import { FastifyInstance } from 'fastify';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/registro', async (_req, reply) => reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B3 pendiente' } }));
  fastify.get('/auth/verificar/:token', async (_req, reply) => reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B3 pendiente' } }));
  fastify.post('/auth/login', async (_req, reply) => reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B4 pendiente' } }));
  fastify.post('/auth/verificar-otp', async (_req, reply) => reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B4 pendiente' } }));
  fastify.post('/auth/refresh', async (_req, reply) => reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B4 pendiente' } }));
  fastify.post('/auth/logout', async (_req, reply) => reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B4 pendiente' } }));
  fastify.post('/auth/cambiar-pin', async (_req, reply) => reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B4 pendiente' } }));
}
