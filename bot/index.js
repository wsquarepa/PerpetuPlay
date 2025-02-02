const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const WEB_DASHBOARD_BASE_URL = process.env.WEB_DASHBOARD_BASE_URL;

const PATH_LIST_NAME = 'available_music_files';
const PLAYLIST_CACHE_NAME = 'playlist';

import fs from 'fs';
import path from 'path';

import { ActivityType, Client, EmbedBuilder, Events, GatewayDispatchEvents, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { createClient } from 'redis';
import { Riffy, Track } from 'riffy';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const nodes = [
    {
        name: 'production',
        host: 'lavalink',
        port: 2333,
        secure: false,
        password: 'youshallnotpass'
    }
]

const riffy = new Riffy(client, nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: 'ytmsearch',
    restVersion: "v4"
});

let guildId = null;

// Inter-app communication
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (error) => { console.error(error); });

const subscriber = redisClient.duplicate();
const publisher = redisClient.duplicate();
await subscriber.connect()
await publisher.connect()

function respond(requestId, response) {
    publisher.publish('im-ch-web', JSON.stringify({
        requestId,
        response
    }));
}

subscriber.subscribe('im-ch-bot', async (message) => {
    const { requestId, data } = JSON.parse(message);

    switch (data.type) {
        // getters
        case 'login': {
            const userId = data.userId;
            const guildId = data.guildId;

            const guild = await (await client.guilds.fetch()).find(g => g.id === guildId).fetch();
            const member = await guild.members.fetch(userId);
            
            if (!member) {
                return respond(requestId, {
                    success: false,
                    message: 'User is not in the guild'
                });
            }

            // check for manage guild permission
            if (!member.permissions.has(PermissionFlagsBits.ManageGuild, true)) {
                return respond(requestId, {
                    success: false,
                    message: 'User does not have the required permissions'
                });
            }

            respond(requestId, {
                success: true
            });
            break;
        }
        case 'status': {
            const player = riffy.get(guildId);
            respond(requestId, {
                success: true,
                identifier: player.current.info.identifier,
                title: player.current.info.title,
                author: player.current.info.author,
                length: player.current.info.length,
                position: player.position,
                volume: player.volume,
                paused: player.paused,
                loop: player.loop == 'none' ? false : true
            });
            break;
        }
        // setters
        case 'play': {
            const player = riffy.get(guildId);
            player.pause(data.state);
            respond(requestId, {
                success: true
            });
            break;
        }
        case 'skip': {
            const player = riffy.get(guildId);
            player.stop();
            respond(requestId, {
                success: true
            });
            break;
        }
        case 'rewind': {
            const player = riffy.get(guildId);
            player.seek(0);
            respond(requestId, {
                success: true
            });
            break;
        }
        case 'volume': {
            const player = riffy.get(guildId);
            const volume = data.volume;

            player.setVolume(volume);

            respond(requestId, {
                success: true
            });
            break;
        }
        case 'seek': {
            const player = riffy.get(guildId);
            const position = data.position;

            if (position < 0 || position > player.current.info.length) {
                return respond(requestId, {
                    success: false,
                    message: 'Invalid position'
                });
            }

            player.seek(position);

            respond(requestId, {
                success: true
            });
            break;
        }
        case 'repeat': {
            const player = riffy.get(guildId);

            if (player.loop == 'none') {
                player.setLoop('track');
            } else {
                player.setLoop('none');
            }

            respond(requestId, {
                success: true
            });
            break;
        }
        // catch all
        default: {
            console.error(`Unknown message type: ${data.type}`);
            break;
        }
    }
});

// playlist stuff
await redisClient.connect();
redisClient.on('error', (error) => { console.error(error); });

// Fisher-Yates shuffle
// Sourced from https://stackoverflow.com/a/2450976
function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

async function reloadPlaylist() {
    console.log('Reloading playlist');

    const filePaths = await redisClient.lRange(PATH_LIST_NAME, 0, -1);

    if (!filePaths.length) {
        console.error('No files found');
        return;
    }

    console.log(`Found ${filePaths.length} files`);
    
    shuffle(filePaths);

    await redisClient.del(PLAYLIST_CACHE_NAME);
    
    for (const filePath of filePaths) {
        await redisClient.lPush(PLAYLIST_CACHE_NAME, filePath);
    }
}

async function getNextTrack(player) {
    console.log('Getting next track');

    const filePath = await redisClient.lPop(PLAYLIST_CACHE_NAME);

    if (!filePath) {
        return null;
    }

    const serverData = await player.node.rest.getTracks(filePath)
    
    return new Track(serverData.data, client.user, player.node);
}

async function playNextTrack(player, retries = 0) {
    const track = await getNextTrack(player);

    if (!track) {
        if (retries >= 3) {
            console.error('Failed to get next track');
            return;
        }

        await reloadPlaylist();
        playNextTrack(player, retries + 1);
        return;
    }

    player.queue.add(track);
    player.play();

    client.user.setActivity(track.info.title + " | " + track.info.author, { type: ActivityType.Listening });
    console.log(`Playing: ${track.info.title} by ${track.info.author}`);
}



// discord stuff
client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user)) return;
    if (message.content.split(' ').length > 1) return; // only respond to mentions

    const data = fs.readFileSync(path.join(process.cwd(), 'message.txt'));

    if (data.length < 1) return;

    const lines = data.toString().split('\n');
    const title = lines[0];
    const description = lines.slice(1).join('\n');

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description.replace('{{URL}}', WEB_DASHBOARD_BASE_URL))
        .setColor('#0099ff')
        .setTimestamp();
    
    message.reply({
        embeds: [embed]
    });
});

client.on(Events.ClientReady, async () => {
    riffy.init(client.user.id);
    console.log(`Logged in as ${client.user.tag}!`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel.isVoiceBased()) {
        console.error('Channel is not voice based');
        return;
    }

    await new Promise((resolve) => {
        riffy.once('nodeConnect', () => {
            resolve();
        });
    });

    guildId = channel.guild.id;

    const player = riffy.createConnection({
        guildId,
        voiceChannel: channel.id,
        textChannel: channel.id,
        deaf: true
    });

    player.on('socketClosed', async () => {
        console.warn('Socket closed? Unexpected behaviour');
    });

    await reloadPlaylist();

    playNextTrack(player);
});

// riffy stuff
riffy.on('nodeConnect', (node) => {
    console.log(`Node ${node.name} connected`);
});

riffy.on('nodeError', (node, error) => {
    console.error(`Node ${node.name} encountered an error: ${error}`);
});

riffy.on('queueEnd', async (player) => {
    playNextTrack(player);
});

client.on(Events.Raw, (d) => {
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    riffy.updateVoiceState(d);
});

client.login(DISCORD_BOT_TOKEN);