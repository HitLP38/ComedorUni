import { FastifyInstance } from 'fastify';
import {
  turnosQuerySchema,
  holdSchema,
  confirmarReservaSchema,
  cancelarReservaSchema,
} from '../../schemas/reserva.schema.js';
import * as reservaService from './reserva.service.js';

export async function reservaRoutes(fastify: FastifyInstance) {
  fastify.get('/turnos', async (req, reply) => {
    const query = turnosQuerySchema.parse(req.query);
    const turnos = await reservaService.getTurnos(query.servicio, query.fecha);
    return reply.send(turnos);
  });

  fastify.post('/reservas/hold', { preHandler: fastify.authenticate }, async (req, reply) => {
    const body = holdSchema.parse(req.body);
    const result = await reservaService.holdCupo(body, req.user!.id);
    return reply.send(result);
  });

  fastify.post('/reservas/confirmar', { preHandler: fastify.authenticate }, async (req, reply) => {
    const body = confirmarReservaSchema.parse(req.body);
    const result = await reservaService.confirmarReserva(body, req.user!.id);
    return reply.code(201).send(result);
  });

  fastify.get('/reservas/mias', { preHandler: fastify.authenticate }, async (req, reply) => {
    const reservas = await reservaService.getMisReservas(req.user!.id);
    return reply.send(reservas);
  });

  fastify.delete('/reservas/:id', { preHandler: fastify.authenticate }, async (req, reply) => {
    const { id } = cancelarReservaSchema.parse(req.params);
    await reservaService.cancelarReserva(id, req.user!.id);
    return reply.code(204).send();
  });
}
