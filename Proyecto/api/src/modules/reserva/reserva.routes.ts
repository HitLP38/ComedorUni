import { FastifyInstance } from 'fastify';

export async function reservaRoutes(fastify: FastifyInstance) {
  const stub = (_r: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B6 pendiente' } });

  fastify.get('/turnos', stub as never);
  fastify.post('/reservas/hold', stub as never);
  fastify.post('/reservas/confirmar', stub as never);
  fastify.get('/reservas/mias', stub as never);
  fastify.delete('/reservas/:id', stub as never);
}
