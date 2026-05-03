import { FastifyInstance } from 'fastify';
import { operadorLoginSchema, validarTicketSchema } from '../../schemas/operador.schema.js';
import * as operadorService from './operador.service.js';

export async function operadorRoutes(fastify: FastifyInstance) {
  fastify.post('/operador/login', async (req, reply) => {
    const body = operadorLoginSchema.parse(req.body);
    const result = await operadorService.loginOperador(body, req.ip);
    return reply.send(result);
  });

  fastify.post('/operador/logout', { preHandler: fastify.authenticateOperador }, async (req, reply) => {
    await operadorService.logoutOperador(req.headers.authorization);
    return reply.code(204).send();
  });

  fastify.post('/operador/validar', { preHandler: fastify.authenticateOperador }, async (req, reply) => {
    const body = validarTicketSchema.parse(req.body);
    const result = await operadorService.validarTicket(body, req.user!.id, req.ip);
    return reply.send(result);
  });

  fastify.get('/operador/turno-actual', { preHandler: fastify.authenticateOperador }, async (_req, reply) => {
    const turnos = await operadorService.getTurnoActual();
    return reply.send(turnos);
  });
}
