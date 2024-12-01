const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

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

    const embed = new EmbedBuilder()
        .setTitle('Hello!')
        .setDescription('This is a test message!')
        .setColor('#0099ff')
        .setTimestamp();
    
    message.reply(embed);
});

// music stuff
const player = createAudioPlayer();

player.on(AudioPlayerStatus.Idle, async () => {
    console.log('Player is idle!');
    playNext(player, client, nextResourceFile());
});

client.on(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('Connection is ready!');

        connection.subscribe(player);

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
        console.log('Connection is destroyed!');
    });
});

client.login(DISCORD_BOT_TOKEN);