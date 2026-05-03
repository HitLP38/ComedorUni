import { FastifyInstance } from 'fastify';

export async function colaRoutes(fastify: FastifyInstance) {
  const stub = (_r: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B5 pendiente' } });

  fastify.post('/cola/entrar', stub as never);
  fastify.delete('/cola/salir', stub as never);
  fastify.get('/cola/posicion', stub as never);
}
