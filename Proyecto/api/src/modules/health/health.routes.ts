import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { config } from '../../config/env.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  }));

  fastify.get('/health/db', async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'postgresql', timestamp: new Date().toISOString() };
    } catch {
      return reply.code(503).send({ status: 'error', database: 'postgresql', error: 'Database connection failed' });
    }
  });

  fastify.get('/health/redis', async (_req, reply) => {
    try {
      await redis.ping();
      return { status: 'ok', cache: 'redis', timestamp: new Date().toISOString() };
    } catch {
      return reply.code(503).send({ status: 'error', cache: 'redis', error: 'Redis connection failed' });
    }
  });
}
