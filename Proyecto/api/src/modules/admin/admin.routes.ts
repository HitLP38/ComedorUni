import { FastifyInstance } from 'fastify';
import {
  patchServicioSchema,
  patchTurnoSchema,
  alumnosQuerySchema,
  anularSancionSchema,
  reportesQuerySchema,
} from '../../schemas/admin.schema.js';
import * as adminService from './admin.service.js';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.post('/admin/login', async (req, reply) => {
    const body = req.body as { username: string; password: string };
    const result = await adminService.loginAdmin(body);
    return reply.send(result);
  });

  fastify.post('/admin/logout', { preHandler: fastify.authenticateAdmin }, async (_req, reply) => {
    return reply.code(204).send();
  });

  // Servicios
  fastify.get('/admin/servicios', { preHandler: fastify.authenticateAdmin }, async (_req, reply) => {
    const result = await adminService.getServicios();
    return reply.send(result);
  });

  fastify.patch('/admin/servicios/:id', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = patchServicioSchema.parse(req.body);
    const result = await adminService.patchServicio(Number(id), body);
    return reply.send(result);
  });

  // Turnos
  fastify.get('/admin/turnos', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const { fecha } = req.query as { fecha?: string };
    const result = await adminService.getTurnos(fecha ?? new Date().toISOString().slice(0, 10));
    return reply.send(result);
  });

  fastify.patch('/admin/turnos/:id', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = patchTurnoSchema.parse(req.body);
    const result = await adminService.patchTurno(Number(id), body);
    return reply.send(result);
  });

  fastify.post('/admin/turnos/regenerar', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const { servicio, fecha } = req.body as { servicio: string; fecha: string };
    const result = await adminService.regenerarTurnos(servicio, fecha);
    return reply.code(201).send(result);
  });

  // Alumnos
  fastify.get('/admin/alumnos', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const query = alumnosQuerySchema.parse(req.query);
    const result = await adminService.getAlumnos(query);
    return reply.send(result);
  });

  fastify.get('/admin/alumnos/:id', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await adminService.getAlumnoById(Number(id));
    return reply.send(result);
  });

  fastify.patch('/admin/alumnos/:id/estado', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { estado: 'ACTIVO' | 'SUSPENDIDO_7D' | 'SUSPENDIDO_MANUAL'; justificacion?: string };
    const result = await adminService.updateAlumnoEstado(Number(id), body);
    return reply.send(result);
  });

  // Sanciones
  fastify.get('/admin/sanciones', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const { activas } = req.query as { activas?: string };
    const result = await adminService.getSanciones(activas === 'true');
    return reply.send(result);
  });

  fastify.post('/admin/sanciones/:id/anular', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { justificacion } = anularSancionSchema.parse(req.body);
    await adminService.anularSancion(Number(id), justificacion);
    return reply.code(204).send();
  });

  // Reportes
  fastify.get('/admin/reportes/uso', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const query = reportesQuerySchema.parse(req.query);
    const result = await adminService.getReportesUso(query.desde, query.hasta);
    return reply.send(result);
  });

  fastify.get('/admin/logs', { preHandler: fastify.authenticateAdmin }, async (req, reply) => {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await adminService.getLogs(Number(page ?? 1), Number(limit ?? 50));
    return reply.send(result);
  });
}
