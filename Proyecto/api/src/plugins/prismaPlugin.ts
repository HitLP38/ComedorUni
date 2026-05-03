import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';

export const prismaPlugin = fp(async function (fastify: FastifyInstance) {
  fastify.decorate('prisma', prisma);
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
