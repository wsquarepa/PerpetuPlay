import express from 'express';
import passport from '../config/passport.js';

const router = express.Router();

router.get('/', passport.authenticate('discord'));
router.get('/cb', passport.authenticate('discord', { failureRedirect: '/auth' }), (req, res) => {
    res.redirect('/');
});
router.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

export default router;
