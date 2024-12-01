import fs from 'fs';
import process from 'process';
import path from 'path';

import { lookup } from 'mime-types';

import { createClient } from 'redis';
import { createAudioResource } from '@discordjs/voice';
import { parseBuffer } from 'music-metadata';
import { ActivityType } from 'discord.js';

function getMusicFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getMusicFiles(file));
        } else {
            const mimeType = lookup(file);
            if (mimeType && mimeType.startsWith('audio/')) {
                results.push(file);
            }
        }
    });
    return results;
}

const musicFiles = getMusicFiles(path.join(process.cwd(), 'music'));

const db = createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

db.on('error', (error) => {
    console.error(error);
});

await db.connect();

function randomQueue() {
    const queue = musicFiles.slice();
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    return queue;
}

let queue = randomQueue();

function nextResourceFile() {
    if (queue.length === 0) {
        queue = randomQueue();
    }

    return queue.shift();
}

function getQueue() {
    return queue;
}

async function play(player, client, resource) {
    player.play(createAudioResource(resource));

    const meta = await parseBuffer(fs.readFileSync(resource));

    client.user.setActivity(meta.common.title + " by " + meta.common.artist, {
        type: ActivityType.Listening
    });
}

export {
    nextResourceFile,
    getQueue,
    play
};