import { createClient } from 'redis';
import { config } from '../config/env.js';

export const redis = createClient({
  url: config.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redis.on('error', (err) => {
  if (process.env['NODE_ENV'] !== 'test') {
    console.error('[redis] error:', err.message);
  }
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export async function disconnectRedis() {
  if (redis.isOpen) {
    await redis.quit();
  }
}
