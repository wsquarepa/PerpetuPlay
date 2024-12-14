import express from 'express';
import cookieParser from 'cookie-parser';

import sessionMiddleware from './config/session.js';
import passport from './config/passport.js';

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

const app = express();

app.use(cookieParser());
app.disable('x-powered-by');
app.use(express.json());

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

export default app;
