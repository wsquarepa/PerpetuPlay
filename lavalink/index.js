import { createClient } from 'redis';
import { readdir } from 'fs/promises';
import { resolve, extname } from 'path';

import { parseFile } from 'music-metadata';
import { uint8ArrayToBase64 } from 'uint8array-extras';

const LIST_NAME = 'available_music_files';
const DATA_PREFIX = 'music_data:';
const COVER_PREFIX = 'cover_art:';

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function getAllFilePaths(dir) {
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

async function indexMusicFiles() {
    try {
        await redisClient.connect();

        await redisClient.del(LIST_NAME); 
        console.log(`Cleared Redis list: ${LIST_NAME}`);

        const musicDir = resolve('/opt/Lavalink/music');
        console.log('Indexing files from:', musicDir);

        const filePaths = await getAllFilePaths(musicDir);

        for (const filePath of filePaths) {
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
                coverArtPromise = redisClient.set(`${COVER_PREFIX}${filePath}`, `data:${data.common.picture[0].format};base64,${uint8ArrayToBase64(data.common.picture[0].data)}`);
            }

            await Promise.all([musicDataPromise, coverArtPromise]);
        }

        console.log(`Successfully indexed ${filePaths.length} files into Redis.`);
    } catch (err) {
        console.error('Error indexing files:', err);
        process.exit(1);
    } finally {
        await redisClient.disconnect();
    }
}


indexMusicFiles();
