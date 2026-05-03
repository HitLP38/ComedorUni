import { FastifyInstance } from 'fastify';

export async function adminRoutes(fastify: FastifyInstance) {
  const stub = (_r: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) =>
    reply.code(501).send({ error: { code: 'NOT_IMPLEMENTED', message: 'B9 pendiente' } });

  fastify.post('/admin/login', stub as never);
  fastify.post('/admin/logout', stub as never);
  fastify.get('/admin/servicios', stub as never);
  fastify.patch('/admin/servicios/:id', stub as never);
  fastify.get('/admin/turnos', stub as never);
  fastify.patch('/admin/turnos/:id', stub as never);
  fastify.post('/admin/turnos/regenerar', stub as never);
  fastify.get('/admin/alumnos', stub as never);
  fastify.get('/admin/alumnos/:id', stub as never);
  fastify.patch('/admin/alumnos/:id/estado', stub as never);
  fastify.get('/admin/sanciones', stub as never);
  fastify.post('/admin/sanciones/:id/anular', stub as never);
  fastify.get('/admin/reportes/uso', stub as never);
  fastify.get('/admin/logs', stub as never);
  fastify.post('/operador/login', stub as never);
  fastify.post('/operador/logout', stub as never);
  fastify.post('/operador/validar', stub as never);
}
