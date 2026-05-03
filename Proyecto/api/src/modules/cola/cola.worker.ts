import { redis } from '../../lib/redis.js';
import { COLA_WORKER_INTERVALO_SEG } from '../../config/constants.js';
import { getColasSesiones, liberarNAlumnos } from './cola.service.js';

let workerTimer: ReturnType<typeof setInterval> | null = null;

export async function startColaWorker(): Promise<void> {
  if (workerTimer) return;

  workerTimer = setInterval(async () => {
    try {
      const colas = await getColasSesiones();
      for (const { servicio, fecha } of colas) {
        await liberarNAlumnos(servicio, fecha);
      }
    } catch (err) {
      if (process.env['NODE_ENV'] !== 'test') {
        console.error('[cola-worker] error:', err);
      }
    }
  }, COLA_WORKER_INTERVALO_SEG * 1000);
}

export function stopColaWorker(): void {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}

// Pub/sub subscriber para reenviar eventos WS por canal Redis
const wsConnections = new Map<number, (msg: string) => void>();

export function registerWsCallback(alumnoId: number, cb: (msg: string) => void): void {
  wsConnections.set(alumnoId, cb);
}

export function unregisterWsCallback(alumnoId: number): void {
  wsConnections.delete(alumnoId);
}

export async function startPubSubListener(): Promise<void> {
  const subscriber = redis.duplicate();
  await subscriber.connect();

  await subscriber.pSubscribe('cola_evento:*', (message) => {
    try {
      const data = JSON.parse(message) as { alumno_id: number; [k: string]: unknown };
      const cb = wsConnections.get(data.alumno_id);
      if (cb) cb(message);
    } catch {
      // mensaje malformado
    }
  });
}
