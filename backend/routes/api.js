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

    const interval = setInterval(async () => {
        const result = await negotiate({
            type: 'status'
        });

        res.write(`data: ${JSON.stringify(result)}\n\n`);
    }, 1000);

    res.on('close', () => {
        clearInterval(interval);
        res.end();
    });
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

export default router;
