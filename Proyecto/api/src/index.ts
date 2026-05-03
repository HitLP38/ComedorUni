import { config } from './config/env.js';
import { connectRedis, disconnectRedis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';
import { buildApp } from './app.js';
import { startColaWorker, startPubSubListener } from './modules/cola/cola.worker.js';
import { startNoShowWorker } from './modules/sancion/sancion.worker.js';

async function start() {
  const fastify = await buildApp({ logger: true });

  try {
    await connectRedis();
    fastify.log.info('✓ Conectado a Redis');
  } catch (err) {
    fastify.log.error({ err }, '✗ Error conectando a Redis');
    process.exit(1);
  }

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      fastify.log.info(`${signal} recibido. Cerrando gracefully...`);
      try {
        await fastify.close();
        await prisma.$disconnect();
        await disconnectRedis();
        fastify.log.info('✓ Aplicación cerrada correctamente');
        process.exit(0);
      } catch (err) {
        fastify.log.error({ err }, '✗ Error durante cierre');
        process.exit(1);
      }
    });
  });

  try {
    await fastify.listen({ port: config.API_PORT, host: config.API_HOST });
    fastify.log.info(`🚀 RanchUNI API en ${config.API_HOST}:${config.API_PORT}`);
    await startColaWorker();
    await startPubSubListener();
    await startNoShowWorker();
  } catch (err) {
    fastify.log.error({ err }, '✗ Error iniciando servidor');
    await prisma.$disconnect();
    await disconnectRedis();
    process.exit(1);
  }
}

start();
