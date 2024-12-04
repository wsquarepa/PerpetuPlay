import { createClient } from 'redis';
import { readdir } from 'fs/promises';
import { resolve, extname } from 'path';

const redisClient = createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
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

        const listName = 'music_paths';
        await redisClient.del(listName); 
        console.log(`Cleared Redis list: ${listName}`);

        const musicDir = resolve('./music');
        console.log('Indexing files from:', musicDir);

        const filePaths = await getAllFilePaths(musicDir);

        for (const filePath of filePaths) {
            await redisClient.lPush(listName, filePath);
        }

        console.log(`Successfully indexed ${filePaths.length} files into Redis.`);
    } catch (err) {
        console.error('Error indexing files:', err);
    } finally {
        await redisClient.disconnect();
    }
}


indexMusicFiles();
