import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import { config } from '../config/env.js';

export function buildErrorHandler() {
  return (error: Error, _request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDACION_FALLIDA',
          message: 'Los datos enviados no son válidos.',
          details: error.errors.map((e) => ({ campo: e.path.join('.'), mensaje: e.message })),
        },
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON());
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return reply.status(409).send({
        error: { code: 'CONFLICTO', message: 'El recurso ya existe.' },
      });
    }

    const message =
      config.NODE_ENV === 'production' ? 'Error interno del servidor.' : error.message;
    return reply.status(500).send({
      error: { code: 'ERROR_INTERNO', message },
    });
  };
}

export async function errorHandlerPlugin() {}
