import express from 'express';

import { negotiate } from '../negotiator.js';
import { redisClient } from '../config/redis.js';

const router = express.Router();

router.use((req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.get('/', (req, res) => {
    res.json({ message: 'Hello, world!' });
});

router.get('/status', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let cachedResult = await negotiate({
        type: 'status'
    });

    const interval = setInterval(async () => {
        const result = await negotiate({
            type: 'status'
        });

        const changedFields = Object.keys(result).filter((key) => result[key] !== cachedResult[key]);

        for (const field of changedFields) {
            res.write(`event: ${field}\n`);
            res.write(`data: ${JSON.stringify({value: result[field]})}\n\n`);
        }

        cachedResult = result;
    }, 1000);

    res.write(`event: initialize\n`);
    res.write(`data: ${JSON.stringify(cachedResult)}\n\n`);

    res.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

router.get('/cover', async (req, res) => {
    const filePath = req.query.f;
    const coverArt = await redisClient.get(`cover_art:${filePath}`);

    if (coverArt) {
        const imgBuffer = Buffer.from(coverArt, 'base64');
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(imgBuffer);
    } else {
        res.status(404).json({ error: 'Cover art not found' });
    }
});

router.get('/queue', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const start = (page - 1) * limit;
    const end = page * limit - 1;

    const queue = await redisClient.lRange('playlist', start, end);

    const dataArray = [];

    for (const [index, filePath] of queue.entries()) {
        dataArray[index] = JSON.parse(await redisClient.get(`music_data:${filePath}`));
    }

    res.json(dataArray);
});

router.post('/media', async (req, res) => {
    const command = req.body.command;

    switch (command) {
        case 'play': {
            const state = req.body.state;

            if (!(typeof state === 'boolean')) {
                res.status(400).json({ error: 'Invalid state' });
                return;
            }

            await negotiate({
                type: 'play',
                state
            });
            res.json({ success: true });
            break;
        }
        case 'skip': {
            await negotiate({
                type: 'skip'
            });
            res.json({ success: true });
            break;
        }
        case 'rewind': {
            await negotiate({
                type: 'rewind'
            });
            res.json({ success: true });
            break;
        }
        case 'volume': {
            const volume = req.body.volume;

            if (volume >= 0 && volume <= 100) {
                await negotiate({
                    type: 'volume',
                    volume
                });
                res.json({ success: true });
            } else {
                res.status(400).json({ error: 'Invalid volume' });
            }

            break;
        }
        case 'seek': {
            const position = req.body.position;

            if (position >= 0) {
                await negotiate({
                    type: 'seek',
                    position
                });
                res.json({ success: true });
            } else {
                res.status(400).json({ error: 'Invalid position' });
            }

            break;
        }
        default: {
            res.status(400).json({ error: 'Invalid command' });
            break;
        }
    }
})

export default router;
