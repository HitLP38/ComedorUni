import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { config } from './config/env.js';
import { connectRedis, disconnectRedis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';
import { buildErrorHandler } from './plugins/errorHandler.js';
import { prismaPlugin } from './plugins/prismaPlugin.js';
import { authPlugin } from './plugins/auth.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { reservaRoutes } from './modules/reserva/reserva.routes.js';
import { colaRoutes } from './modules/cola/cola.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { operadorRoutes } from './modules/operador/operador.routes.js';
import { startColaWorker, startPubSubListener } from './modules/cola/cola.worker.js';

async function build() {
  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'development' ? 'debug' : 'info',
      ...(config.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    },
    trustProxy: true,
    bodyLimit: 1_048_576,
  });

  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });

  await fastify.register(fastifyCors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  fastify.setErrorHandler(buildErrorHandler());
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(reservaRoutes);
  await fastify.register(colaRoutes);
  await fastify.register(operadorRoutes);
  await fastify.register(adminRoutes);

  return fastify;
}

async function start() {
  const fastify = await build();

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
  } catch (err) {
    fastify.log.error({ err }, '✗ Error iniciando servidor');
    await prisma.$disconnect();
    await disconnectRedis();
    process.exit(1);
  }
}

start();
