import { createClient } from 'redis';
import { readdir } from 'fs/promises';
import { resolve, extname } from 'path';

import { parseFile } from 'music-metadata';
import { uint8ArrayToBase64 } from 'uint8array-extras';

const LIST_NAME = 'available_music_files';
const DATA_PREFIX = 'music_data:';

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

            await redisClient.set(`${DATA_PREFIX}${filePath}`, JSON.stringify({
                title: data.common.title,
                artists: data.common.artists,
                album: data.common.album,
                duration: data.format.duration,
                cover: data.common.picture ? `data:${data.common.picture.format};base64,${uint8ArrayToBase64(data.common.picture.data)}` : null
            }));
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
