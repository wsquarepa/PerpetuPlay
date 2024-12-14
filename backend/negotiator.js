import { randomBytes } from 'crypto';
import { createClient } from 'redis';

// Create Redis client
const client = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

client.on('error', (error) => {
    console.error('Connection error:', error);
});

const publisher = client.duplicate();
const subscriber = client.duplicate();

// Map to hold pending requests
const pendingNegotiations = new Map();

// Function to send a request and await the response
async function negotiate(data) {
    const requestId = randomBytes(16).toString('hex');

    return new Promise((resolve, reject) => {
        // Add the requestId to the pendingNegotiations map with a timeout
        const timeout = setTimeout(() => {
            pendingNegotiations.delete(requestId);
            reject(new Error('Negotiation timed out'));
        }, 10000); // Adjust timeout as needed

        pendingNegotiations.set(requestId, { resolve, reject, timeout });

        // Publish the negotiation request
        publisher.publish('im-ch-bot', JSON.stringify({ requestId, data }));
    });
}

// Connect the clients and subscribe to the channel
async function initializeNegotiator() {
    await subscriber.connect();
    await publisher.connect();
    await subscriber.subscribe('im-ch-web', (message) => {
        try {
            const { requestId, response } = JSON.parse(message);
            const negotiation = pendingNegotiations.get(requestId);
            if (negotiation) {
                clearTimeout(negotiation.timeout); // Clear the timeout
                negotiation.resolve(response); // Resolve the Promise
                pendingNegotiations.delete(requestId); // Remove from map
            } else {
                console.warn(`Received response for unknown requestId: ${requestId}`);
            }
        } catch (err) {
            console.error('Failed to process message:', err);
        }
    });
    console.log('Negotiator initialized and listening for messages');
}

initializeNegotiator();

export { negotiate };
