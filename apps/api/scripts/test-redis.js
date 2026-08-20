const Redis = require('ioredis');
const host = process.env.REDIS_HOST || 'localhost';
const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6491;
const password = process.env.REDIS_PASSWORD || 'redis_secret_2025';

const client = new Redis({ host, port, password });

client.on('connect', () => console.log('connect'));
client.on('ready', () => console.log('ready'));
client.on('error', (e) => console.error('error', e.message || e));

(async () => {
  try {
    const pong = await client.ping();
    console.log('ping ->', pong);
  } catch (e) {
    console.error('ping error', e.message || e);
  } finally {
    client.quit();
  }
})();
