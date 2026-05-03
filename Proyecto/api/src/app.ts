import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { config } from './config/env.js';
import { buildErrorHandler } from './plugins/errorHandler.js';
import { prismaPlugin } from './plugins/prismaPlugin.js';
import { authPlugin } from './plugins/auth.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { reservaRoutes } from './modules/reserva/reserva.routes.js';
import { colaRoutes } from './modules/cola/cola.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { operadorRoutes } from './modules/operador/operador.routes.js';

export async function buildApp(opts: { logger?: boolean } = {}) {
  const fastify = Fastify({
    logger: opts.logger ?? (config.NODE_ENV === 'development'),
    trustProxy: true,
    bodyLimit: 1_048_576,
  });

  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false,
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
