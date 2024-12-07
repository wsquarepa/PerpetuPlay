import express from 'express';

import { negotiate } from '../negotiator.js';

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

export default router;
