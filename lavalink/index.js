import { createClient } from 'redis';
import { readdir } from 'fs/promises';
import { resolve, extname } from 'path';

import { parseFile } from 'music-metadata';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import sharp from 'sharp';

const LIST_NAME = 'available_music_files';
const DATA_PREFIX = 'music_data:';
const COVER_PREFIX = 'cover_art:';
const PARALLEL_PROCESSING = 4;

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function getAllFilePaths(dir) {
    console.log('Traversing directory:', dir);

    let filePaths = [];
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = resolve(dir, entry.name);
        if (entry.isDirectory()) {
            const nestedPaths = await getAllFilePaths(fullPath);
            filePaths = filePaths.concat(nestedPaths);
        } else if (extname(entry.name) !== '.txt') { 
            filePaths.push(fullPath);
        }
    }
    return filePaths;
}

async function processFile(filePath) {
    console.log('Processing:', filePath);

    await redisClient.lPush(LIST_NAME, filePath);

    const data = await parseFile(filePath);

    const musicDataPromise = redisClient.set(`${DATA_PREFIX}${filePath}`, JSON.stringify({
        title: data.common.title,
        artists: data.common.artists,
        album: data.common.album,
        duration: data.format.duration
    }));

    let coverArtPromise = Promise.resolve();
    if (data.common.picture && data.common.picture.length) {
        const resizedImageBuffer = await sharp(data.common.picture[0].data)
            .resize(600, 600, { fit: 'inside' })
            .toBuffer();

        coverArtPromise = redisClient.set(`${COVER_PREFIX}${filePath}`, uint8ArrayToBase64(resizedImageBuffer));
    }

    await Promise.all([musicDataPromise, coverArtPromise]);

    console.log('Processed:', filePath);
}

async function indexMusicFiles() {
    try {
        await redisClient.connect();

        await redisClient.del(LIST_NAME); 
        console.log(`Cleared Redis list: ${LIST_NAME}`);

        const musicDir = resolve('/opt/Lavalink/music');
        console.log('Indexing files from:', musicDir);

        const filePaths = await getAllFilePaths(musicDir);

        const batches = [];
        for (let i = 0; i < filePaths.length; i += PARALLEL_PROCESSING) {
            const batch = filePaths.slice(i, i + PARALLEL_PROCESSING).map(processFile);
            batches.push(Promise.all(batch));
        }

        for (const batch of batches) {
            await batch;
        }

        console.log(`Successfully indexed ${filePaths.length} files into Redis.`);
    } finally {
        await redisClient.disconnect();
    }
}

indexMusicFiles();
