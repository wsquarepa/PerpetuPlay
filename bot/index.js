const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const WEB_DASHBOARD_BASE_URL = process.env.WEB_DASHBOARD_BASE_URL;

const PATH_LIST_NAME = 'available_music_files';
const PLAYLIST_CACHE_NAME = 'playlist';

import fs from 'fs';
import path from 'path';

import { Client, EmbedBuilder, Events, GatewayDispatchEvents, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { createClient } from 'redis';
import { Riffy } from 'riffy';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const nodes = [
    {
        name: 'remote',
        host: process.env.LAVALINK_ADDRESS || 'localhost',
        port: process.env.LAVALINK_PORT || 2333,
        secure: (process.env.LAVALINK_SECURE == 'true') || false,
        password: process.env.LAVALINK_PASSWORD || 'youshallnotpass'
    },
    {
        name: 'production',
        host: 'lavalink',
        port: 2333,
        secure: false
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

// Inter-app communication
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (error) => { console.error(error); });

const publisher = redisClient.duplicate();
const subscriber = redisClient.duplicate();
await subscriber.connect()
subscriber.subscribe('im-ch-bot', async (message) => {
    console.log(`Received message: ${message}`);

    const { requestId, data } = JSON.parse(message);

    switch (data.type) {
        case 'login':
            const userId = data.userId;
            const guildId = data.guildId;

            const guild = await (await client.guilds.fetch()).find(g => g.id === guildId).fetch();
            const member = await guild.members.fetch(userId);
            
            if (!member) {
                return publisher.publish('im-ch-web', JSON.stringify({
                    requestId,
                    response: {
                        success: false,
                        message: 'User is not in the guild'
                    }
                }));
            }

            // check for manage guild permission
            if (!member.permissions.has(PermissionFlagsBits.ManageGuild, true)) {
                return publisher.publish('im-ch-web', JSON.stringify({
                    requestId,
                    response: {
                        success: false,
                        message: 'User does not have the required permissions'
                    }
                }));
            }

            publisher.publish('im-ch-web', JSON.stringify({
                requestId,
                response: {
                    success: true
                }
            }));
            break;
        default:
            console.error(`Unknown message type: ${data.type}`);
            break;
    }
});

// playlist stuff

await redisClient.connect();
redisClient.on('error', (error) => { console.error(error); });

async function reloadPlaylist() {
    const filePaths = await redisClient.lRange(PATH_LIST_NAME, 0, -1);

    if (!filePaths.length) {
        console.error('No files found');
        return;
    }

    filePaths.sort(() => Math.random() - 0.5);

    await redisClient.del(PLAYLIST_CACHE_NAME);
    await redisClient.rPush(PLAYLIST_CACHE_NAME, ...filePaths);
}

async function getNextTrack(player) {
    const filePath = await redisClient.lPop(PLAYLIST_CACHE_NAME);

    if (!filePath) {
        await reloadPlaylist();
        return getNextTrack(player);
    }

    return await player.node.rest.getTracks(filePath);
} 

// discord stuff
client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user)) return;

    const data = fs.readFileSync(path.join(process.cwd(), 'message.txt'));
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

    const player = riffy.createConnection({
        guildId: channel.guild.id,
        voiceChannel: channel.id,
        textChannel: channel.id,
        deaf: true,
        loop: 'queue'
    });

    await reloadPlaylist();

    // get the first song
    const firstTrack = await getNextTrack(player);

    if (!firstTrack) {
        console.error('No tracks found');
        return;
    }

    player.queue.add(firstTrack);
    player.play();
});

// riffy stuff
riffy.on('nodeConnect', (node) => {
    console.log(`Node ${node.name} connected`);
});

riffy.on('nodeError', (node, error) => {
    console.error(`Node ${node.name} encountered an error: ${error}`);
});

riffy.on('queueEnd', async (player) => {
    const nextTrack = await getNextTrack(player);

    if (!nextTrack) {
        await reloadPlaylist();
    }

    player.queue.add(nextTrack);
    player.play();
});

client.on(Events.Raw, (d) => {
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    riffy.updateVoiceState(d);
});

client.login(DISCORD_BOT_TOKEN);