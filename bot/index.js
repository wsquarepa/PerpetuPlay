const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const WEB_DASHBOARD_BASE_URL = process.env.WEB_DASHBOARD_BASE_URL;

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
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (error) => {
    console.error(error);
});

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
    
    const resolve = await player.node.rest.getTracks('/opt/Lavalink/music/IJ.mp3');

    console.log(resolve);
});

// riffy stuff
riffy.on('nodeConnect', (node) => {
    console.log(`Node ${node.name} connected`);
});

riffy.on('nodeError', (node, error) => {
    console.error(`Node ${node.name} encountered an error: ${error}`);
});

riffy.on('queueEnd', async (player) => {
    console.log('Queue ended... wait a second, shouldn\'t this be an infinite loop?');
    player.disconnect();
});

client.on(Events.Raw, (d) => {
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    riffy.updateVoiceState(d);
});

client.login(DISCORD_BOT_TOKEN);