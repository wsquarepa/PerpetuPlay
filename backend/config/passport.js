import passport from 'passport';
import Strategy from 'passport-discord';
import process from 'process';
import { negotiate } from '../negotiator.js';

const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

passport.use(new Strategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    const guild = profile.guilds.find(g => g.id === DISCORD_GUILD_ID);

    if (!guild) {
        return done(new Error('User is not in the configured guild'));
    }

    const result = await negotiate({
        type: 'login',
        userId: profile.id,
        guildId: guild.id
    });

    if (!result || !result.success) {
        return done(new Error(result?.message || 'Failed to negotiate login'));
    }

    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    process.nextTick(() => done(null, user));
});

passport.deserializeUser((id, done) => {
    process.nextTick(() => done(null, id));
});

export default passport;
