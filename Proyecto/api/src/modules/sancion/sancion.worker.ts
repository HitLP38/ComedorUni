import { Queue, Worker } from 'bullmq';
import { config } from '../../config/env.js';
import { procesarCierreServicio, levantarSuspensionesVencidas } from './sancion.service.js';

const QUEUE_NAME = 'cierre-servicio';

let sancionQueue: Queue | null = null;

export function getSancionQueue(): Queue {
  if (!sancionQueue) {
    sancionQueue = new Queue(QUEUE_NAME, {
      connection: { url: config.REDIS_URL },
    });
  }
  return sancionQueue;
}

export async function encolarCierreServicio(fechaServicio: Date, servicioId: number) {
  const queue = getSancionQueue();
  await queue.add('cierre', { fechaServicio: fechaServicio.toISOString(), servicioId }, {
    jobId: `cierre:${servicioId}:${fechaServicio.toISOString().slice(0, 10)}`,
    removeOnComplete: true,
    removeOnFail: 50,
  });
}

export async function startNoShowWorker(): Promise<void> {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { fechaServicio, servicioId } = job.data as { fechaServicio: string; servicioId: number };
      const fecha = new Date(fechaServicio);
      const count = await procesarCierreServicio(fecha, servicioId);
      return { noShows: count };
    },
    { connection: { url: config.REDIS_URL } },
  );

  worker.on('completed', (job, result) => {
    console.info(`[sancion-worker] cierre servicio ${job.data.servicioId}: ${result.noShows} no-shows`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[sancion-worker] job ${job?.id} failed:`, err.message);
  });

  // Every 5 minutes, lift expired 7-day suspensions
  setInterval(async () => {
    try {
      const count = await levantarSuspensionesVencidas();
      if (count > 0) console.info(`[sancion-worker] ${count} suspensiones levantadas`);
    } catch (err) {
      console.error('[sancion-worker] error levantando suspensiones:', err);
    }
  }, 5 * 60 * 1000);
}
