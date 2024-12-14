// index.js
import { createClient } from "redis";
import { readdir } from "fs/promises";
import { resolve, extname } from "path";
import { Worker } from "node:worker_threads";
import pLimit from "p-limit";

const LIST_NAME = "available_music_files";
const DATA_PREFIX = "music_data:";
const COVER_PREFIX = "cover_art:";

// Instead of 4, let's utilize more concurrency.
// You have 32 cores, so let's start with concurrency = 16 or 32 and see if it saturates the CPU.
const CONCURRENCY = 16;

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

/**
 * Recursively traverse the directory to list all file paths.
 * Exclude .txt files.
 */
async function getAllFilePaths(dir) {
    let filePaths = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = resolve(dir, entry.name);
        if (entry.isDirectory()) {
            const nestedPaths = await getAllFilePaths(fullPath);
            filePaths = filePaths.concat(nestedPaths);
        } else if (extname(entry.name) !== ".txt") {
            filePaths.push(fullPath);
        }
    }

    return filePaths;
}

/**
 * Offload file processing to a worker thread to take full advantage of multi-core CPU.
 * The worker thread will parse metadata & resize cover art, then return the results.
 */
function processFileInWorker(filePath) {
    return new Promise((resolve, reject) => {
        const worker = new Worker("./fileProcessor.js", {
            workerData: { filePath },
        });

        worker.on("message", (msg) => {
            if (msg.error) {
                reject(new Error(msg.error));
            } else {
                resolve(msg);
            }
        });

        worker.on("error", reject);

        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(
                    new Error(
                        `Worker stopped with exit code ${code} for file ${filePath}`
                    )
                );
            }
        });
    });
}

/**
 * Uses redis pipelining to insert multiple commands in batch
 */
async function storeInRedisBatch(results) {
    // Each result item: { filePath, musicData, coverArtBase64 }
    const pipeline = redisClient.multi();

    for (const item of results) {
        pipeline.lPush(LIST_NAME, item.filePath);

        pipeline.set(
            `${DATA_PREFIX}${item.filePath}`,
            JSON.stringify(item.musicData)
        );

        if (item.coverArtBase64) {
            pipeline.set(
                `${COVER_PREFIX}${item.filePath}`,
                item.coverArtBase64
            );
        }
    }

    // Execute pipeline
    await pipeline.exec();
}

/**
 * Main indexing function
 */
async function indexMusicFiles() {
    try {
        console.log("Connecting to Redis...");
        await redisClient.connect();

        // Clear any existing data in the list
        await redisClient.del(LIST_NAME);
        console.log(`Cleared Redis list: ${LIST_NAME}`);

        // Resolve the music directory
        const musicDir = resolve("/opt/Lavalink/music");
        console.log("Indexing files from:", musicDir);

        // Gather all file paths
        const filePaths = await getAllFilePaths(musicDir);
        console.log(`Found ${filePaths.length} files.`);

        // Use p-limit to control concurrency
        const limit = pLimit(CONCURRENCY);

        // We'll gather results in chunks, then pipeline to Redis to reduce round trips
        const chunkSize = 50; // how many results to pipeline at once
        let batchResults = [];

        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];

            // Queue the worker thread processing
            const promise = limit(async () => {
                console.log("Processing:", filePath);
                const result = await processFileInWorker(filePath);
                console.log("Processed:", filePath);
                return result;
            });

            batchResults.push(promise);

            // Once we accumulate chunkSize promises, wait for them all, then pipeline to Redis
            if (batchResults.length === chunkSize) {
                const resolvedBatch = await Promise.all(batchResults);
                await storeInRedisBatch(resolvedBatch);
                batchResults = [];
            }
        }

        // Process remaining items in the last partial batch
        if (batchResults.length > 0) {
            const resolvedBatch = await Promise.all(batchResults);
            await storeInRedisBatch(resolvedBatch);
        }

        console.log(
            `Successfully indexed ${filePaths.length} files into Redis.`
        );
    } catch (err) {
        console.error("Error during indexing:", err);
    } finally {
        await redisClient.disconnect();
        console.log("Redis disconnected.");
    }
}

indexMusicFiles();
