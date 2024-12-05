const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

import fs from 'fs';
import path from 'path';
import process from 'process';  

import express from 'express';
import cookieParser from 'cookie-parser';

import { negotiate } from './negotiator.js';

import passport from 'passport';
import Strategy from 'passport-discord';

import session from 'express-session';
import { RedisStore } from 'connect-redis';

import { createClient } from 'redis';

const keyv = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD,
});

const redisStore = new RedisStore({
    client: keyv
});

const app = express();
app.use(cookieParser());

app.disable('x-powered-by');

app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));

passport.use(new Strategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    // Check if the user is in the configured guild
    const guild = profile.guilds.find(g => g.id === DISCORD_GUILD_ID);

    if (!guild) {
        return done(new Error('User is not in the configured guild'));
    }

    const result = await negotiate({
        type: 'login',
        userId: profile.id,
        guildId: guild.id
    })

    if (!result) {
        return done(new Error('Failed to negotiate login'));
    }

    if (!result.success) {
        return done(new Error(result.message));
    }

    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    process.nextTick(() => {
        done(null, user);
    });
})

passport.deserializeUser((id, done) => {
    process.nextTick(() => {
        done(null, id);
    });
})

app.use(passport.initialize());

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`Hello, ${req.user.username}!`);
    } else {
        res.send('Hello, guest!');
    }
})

app.get('/auth', passport.authenticate('discord'));
app.get('/auth/cb', passport.authenticate('discord', {
    failureRedirect: '/auth'
}), (req, res) => {
    res.redirect('/');
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.listen(8080, () => {
    console.log('Server listening on port 8080');
});