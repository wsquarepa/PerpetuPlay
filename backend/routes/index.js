import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/auth');
    }
});

export default router;
