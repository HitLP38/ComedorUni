import { Queue } from 'bullmq';
import { config } from '../config/env.js';

function parseRedisUrl(url: string) {
  try {
    const u = new URL(url);
    return { host: u.hostname, port: parseInt(u.port || '6379') };
  } catch {
    return { host: 'redis', port: 6379 };
  }
}

const connection = parseRedisUrl(config.REDIS_URL);

export const cierreServicioQueue = new Queue('cierre-servicio', { connection });
export const levantarSuspensionQueue = new Queue('levantar-suspension', { connection });
