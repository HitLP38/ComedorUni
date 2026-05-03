import { FastifyInstance } from 'fastify';
import { AppError, Errors } from '../../errors/AppError.js';
import { entrarColaSchema, salirColaSchema, posicionColaSchema } from '../../schemas/reserva.schema.js';
import * as colaService from './cola.service.js';
import {
  registerWsCallback,
  unregisterWsCallback,
} from './cola.worker.js';
import { HEARTBEAT_TIMEOUT_SEG } from '../../config/constants.js';

export async function colaRoutes(fastify: FastifyInstance) {
  await fastify.register(import('@fastify/websocket'));

  fastify.post('/cola/entrar', { preHandler: fastify.authenticate }, async (req, reply) => {
    const body = entrarColaSchema.parse(req.body);
    const result = await colaService.entrarCola(req.user!.id, body.servicio).catch((e) => {
      if (e.code) throw new AppError(e.code, e.message, e.statusCode);
      throw e;
    });
    return reply.send(result);
  });

  fastify.delete('/cola/salir', { preHandler: fastify.authenticate }, async (req, reply) => {
    const body = salirColaSchema.parse(req.body);
    await colaService.salirCola(body.token_cola);
    return reply.code(204).send();
  });

  fastify.get('/cola/posicion', { preHandler: fastify.authenticate }, async (req, reply) => {
    const { token_cola } = posicionColaSchema.parse(req.query);
    const posicion = await colaService.getPosicion(token_cola);
    if (!posicion) throw Errors.AUTH_TOKEN_INVALIDO();
    return reply.send(posicion);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fastify.get('/ws/cola', { websocket: true }, (socket: any, req) => {
    const tokenCola = (req.query as Record<string, string>)['token_cola'];
    if (!tokenCola) {
      socket.send(JSON.stringify({ tipo: 'error', mensaje: 'token_cola requerido' }));
      socket.close();
      return;
    }

    let alumnoId: number | null = null;
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
    let posicionTimer: ReturnType<typeof setInterval> | null = null;

    const resetHeartbeat = () => {
      if (heartbeatTimer) clearTimeout(heartbeatTimer);
      heartbeatTimer = setTimeout(() => {
        socket.send(JSON.stringify({ tipo: 'error', mensaje: 'Heartbeat timeout. Reconéctate.' }));
        colaService.salirCola(tokenCola).catch(() => {});
        socket.close();
      }, HEARTBEAT_TIMEOUT_SEG * 1000);
    };

    const cleanup = () => {
      if (heartbeatTimer) clearTimeout(heartbeatTimer);
      if (posicionTimer) clearInterval(posicionTimer);
      if (alumnoId !== null) unregisterWsCallback(alumnoId);
    };

    colaService.getPosicion(tokenCola).then(async (pos) => {
      if (!pos) {
        socket.send(JSON.stringify({ tipo: 'error', mensaje: 'Token de cola inválido.' }));
        socket.close();
        return;
      }

      const sesionStr = await import('../../lib/redis.js').then(({ redis }) =>
        redis.get(`sesion_cola:${tokenCola}`),
      );
      if (!sesionStr) { socket.close(); return; }

      const sesion = JSON.parse(sesionStr) as { alumno_id: number };
      alumnoId = sesion.alumno_id;

      registerWsCallback(alumnoId, (msg) => {
        socket.send(msg);
        cleanup();
        socket.close();
      });

      socket.send(JSON.stringify({ tipo: 'posicion', ...pos }));
      resetHeartbeat();

      posicionTimer = setInterval(async () => {
        const p = await colaService.getPosicion(tokenCola);
        if (p) socket.send(JSON.stringify({ tipo: 'posicion', ...p }));
      }, 5000);
    });

    socket.on('message', (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString()) as { tipo: string };
        if (msg.tipo === 'heartbeat') resetHeartbeat();
      } catch { /* ignorar */ }
    });

    socket.on('close', () => cleanup());
    socket.on('error', () => cleanup());
  });
}
