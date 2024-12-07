import express from 'express';
import cookieParser from 'cookie-parser';
import sessionMiddleware from './config/session.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import indexRoutes from './routes/index.js';

const app = express();

app.use(cookieParser());
app.disable('x-powered-by');
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(authRoutes);
app.use(indexRoutes);

export default app;
