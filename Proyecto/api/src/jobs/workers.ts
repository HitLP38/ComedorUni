import { startNoShowWorker } from '../modules/sancion/sancion.worker.js';
import { startColaWorker } from '../modules/cola/cola.worker.js';

export async function startAllWorkers(): Promise<void> {
  await startColaWorker();
  await startNoShowWorker();
}
