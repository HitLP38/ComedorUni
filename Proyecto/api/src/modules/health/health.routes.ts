import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { config } from '../../config/env.js';

// In-memory counters for lightweight Prometheus metrics
const counters = {
  http_requests_total: 0,
  auth_logins_total: 0,
  reservas_created_total: 0,
  tickets_validated_total: 0,
  errors_total: 0,
};

export function incrementCounter(key: keyof typeof counters) {
  counters[key]++;
}

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

  fastify.get('/metrics', async (_req, reply) => {
    const lines = [
      '# HELP http_requests_total Total HTTP requests handled',
      '# TYPE http_requests_total counter',
      `http_requests_total ${counters.http_requests_total}`,
      '',
      '# HELP auth_logins_total Total successful logins',
      '# TYPE auth_logins_total counter',
      `auth_logins_total ${counters.auth_logins_total}`,
      '',
      '# HELP reservas_created_total Total reservations created',
      '# TYPE reservas_created_total counter',
      `reservas_created_total ${counters.reservas_created_total}`,
      '',
      '# HELP tickets_validated_total Total tickets validated by operator',
      '# TYPE tickets_validated_total counter',
      `tickets_validated_total ${counters.tickets_validated_total}`,
      '',
      '# HELP errors_total Total application errors',
      '# TYPE errors_total counter',
      `errors_total ${counters.errors_total}`,
      '',
      `# HELP process_uptime_seconds Process uptime in seconds`,
      `# TYPE process_uptime_seconds gauge`,
      `process_uptime_seconds ${process.uptime().toFixed(2)}`,
    ];
    return reply.header('Content-Type', 'text/plain; version=0.0.4').send(lines.join('\n'));
  });
}
