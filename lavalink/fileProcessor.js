// fileProcessor.js
import { parentPort, workerData } from "node:worker_threads";
import { parseFile } from "music-metadata";
import sharp from "sharp";
import { uint8ArrayToBase64 } from "uint8array-extras";

// Worker Data:
// { filePath: string }

(async () => {
    try {
        const { filePath } = workerData;

        // Parse metadata
        const data = await parseFile(filePath);

        // Basic metadata to return
        const musicData = {
            filePath,
            title: data.common.title,
            artists: data.common.artists,
            album: data.common.album,
            duration: data.format.duration,
        };

        // Resize cover art if present
        let coverArtBase64 = null;
        if (data.common.picture && data.common.picture.length > 0) {
            const resizedImageBuffer = await sharp(data.common.picture[0].data)
                .resize(600, 600, { fit: "inside" })
                .toBuffer();
            coverArtBase64 = uint8ArrayToBase64(resizedImageBuffer);
        }

        // Send structured result back to the main thread
        parentPort.postMessage({
            filePath,
            musicData,
            coverArtBase64,
        });
    } catch (err) {
        parentPort.postMessage({ error: err.message || String(err) });
    }
})();
