const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const WEB_DASHBOARD_BASE_URL = process.env.WEB_DASHBOARD_BASE_URL;

import fs from 'fs';
import path from 'path';

import { Client, EmbedBuilder, Events, GatewayIntentBits } from 'discord.js';
import { createAudioPlayer, AudioPlayerStatus, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';

import { nextResourceFile, getQueue, play } from './music.js';

import { createClient } from 'redis';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Inter-app communication
const subscriber = createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

subscriber.on('error', (error) => {
    console.error(error);
});

await subscriber.connect()
subscriber.subscribe('im-ch');

subscriber.on('message', (channel, message) => {
    console.log(`Received message from ${channel}: ${message}`);
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

// music stuff
let connection;
const player = createAudioPlayer();

player.on(AudioPlayerStatus.Idle, async () => {
    console.log('Playing next song...');
    play(player, client, nextResourceFile());
});

client.on(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('Connection is ready!');

        connection.subscribe(player);

        console.log('Starting music stream...');
        play(player, client, nextResourceFile());
    })

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            connection.destroy();
        }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
        console.log('Connection was destroyed!');
    });
});

client.login(DISCORD_BOT_TOKEN);