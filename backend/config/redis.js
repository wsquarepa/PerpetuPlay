import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

await redisClient.connect();

const redisStore = new RedisStore({
    client: redisClient
});

export { redisClient, redisStore };
