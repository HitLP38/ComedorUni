import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken, extractToken } from '../lib/jwt.js';
import { Errors } from '../errors/AppError.js';

async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  const token = extractToken(request.headers.authorization);
  const payload = await verifyToken(token);
  request.user = { id: payload.id, codigo_alumno: payload.codigo_alumno, role: payload.role };
}

async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (request.user?.role !== 'ADMIN') throw Errors.NO_AUTORIZADO();
}

async function authenticateOperador(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (request.user?.role !== 'OPERADOR' && request.user?.role !== 'ADMIN') throw Errors.NO_AUTORIZADO();
}

export async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('authenticateAdmin', authenticateAdmin);
  fastify.decorate('authenticateOperador', authenticateOperador);
}
