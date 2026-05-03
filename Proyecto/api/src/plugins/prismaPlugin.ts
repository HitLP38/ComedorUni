import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function prismaPlugin(fastify: FastifyInstance) {
  fastify.decorate('prisma', prisma);
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}
