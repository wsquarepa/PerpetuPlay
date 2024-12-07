import path from 'path';

import express from 'express';

const router = express.Router();

router.use((req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/auth');
    }
});

// will be replaced with react app later
router.get('/', (req, res) => {
    res.sendFile(path.resolve('./public/dashboard.html'));
});

router.get('/css/dashboard.css', (req, res) => {
    res.sendFile(path.resolve('./public/css/dashboard.css'));
});

router.get('/js/dashboard.js', (req, res) => {
    res.sendFile(path.resolve('./public/js/dashboard.js'));
});

export default router;
