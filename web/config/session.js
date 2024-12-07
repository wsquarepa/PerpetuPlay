import session from 'express-session';
import { redisStore } from './redis.js';

const sessionMiddleware = session({
    store: redisStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
});

export default sessionMiddleware;
