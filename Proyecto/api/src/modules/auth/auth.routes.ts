import { FastifyInstance } from 'fastify';
import {
  registroSchema,
  loginSchema,
  verificarOtpSchema,
  refreshSchema,
  cambiarPinSchema,
} from '../../schemas/auth.schema.js';
import * as authService from './auth.service.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/registro', async (req, reply) => {
    const body = registroSchema.parse(req.body);
    const result = await authService.registrarAlumno(body, req.ip);
    return reply.code(201).send(result);
  });

  fastify.get('/auth/verificar/:token', async (req, reply) => {
    const { token } = req.params as { token: string };
    const result = await authService.verificarCorreo(token);
    return reply.send(result);
  });

  fastify.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const result = await authService.loginAlumno(body, req.ip);
    return reply.send(result);
  });

  fastify.post('/auth/verificar-otp', async (req, reply) => {
    const body = verificarOtpSchema.parse(req.body);
    const result = await authService.verificarOtp(body, req.ip);
    return reply.send(result);
  });

  fastify.post('/auth/refresh', async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await authService.refreshTokens(refreshToken);
    return reply.send(result);
  });

  fastify.post('/auth/logout', { preHandler: fastify.authenticate }, async (req, reply) => {
    await authService.logout(req.headers.authorization);
    return reply.code(204).send();
  });

  fastify.post('/auth/cambiar-pin', { preHandler: fastify.authenticate }, async (req, reply) => {
    const body = cambiarPinSchema.parse(req.body);
    await authService.cambiarPin(body, req.user!.id);
    return reply.code(204).send();
  });
}
