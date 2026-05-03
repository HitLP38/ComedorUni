import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// ============================================
// Configuración de Variantes de Entorno
// ============================================
const PORT = parseInt(process.env.API_PORT || '3001');
const HOST = process.env.API_HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// ============================================
// Inicialización de Dependencias Externas
// ============================================
const prisma = new PrismaClient({
  log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// ============================================
// Bootstrap de Aplicación Fastify
// ============================================
async function start() {
  const fastify = Fastify({
    logger: {
      level: NODE_ENV === 'development' ? 'debug' : 'info',
      transport: NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: { colorize: true }
      } : undefined,
    },
    trustProxy: true,
    bodyLimit: 1048576, // 1 MB
  });

  // ============================================
  // Middleware de Seguridad Global
  // ============================================
  await fastify.register(fastifyHelmet, {
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  });

  // ============================================
  // Middleware de CORS
  // ============================================
  await fastify.register(fastifyCors, {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ============================================
  // Conectar a Redis
  // ============================================
  try {
    await redisClient.connect();
    console.log('✓ Conectado a Redis');
  } catch (error) {
    console.error('✗ Error conectando a Redis:', error);
    process.exit(1);
  }

  // ============================================
  // Rutas de Healthcheck
  // ============================================
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
    };
  });

  fastify.get('/health/db', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'postgresql',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      reply.code(503);
      return {
        status: 'error',
        database: 'postgresql',
        error: 'Database connection failed',
      };
    }
  });

  fastify.get('/health/redis', async (request, reply) => {
    try {
      await redisClient.ping();
      return {
        status: 'ok',
        cache: 'redis',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      reply.code(503);
      return {
        status: 'error',
        cache: 'redis',
        error: 'Redis connection failed',
      };
    }
  });

  // ============================================
  // Ruta de Prueba: Hello World
  // ============================================
  fastify.get('/', async (request, reply) => {
    return {
      message: 'Bienvenido a RanchUNI API',
      version: '0.1.0',
      endpoints: {
        health: '/health',
        database: '/health/db',
        cache: '/health/redis',
      },
    };
  });

  // ============================================
  // Gestión de Cierre Graceful
  // ============================================
  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n${signal} recibido. Cerrando gracefully...`);

      try {
        await fastify.close();
        await prisma.$disconnect();
        await redisClient.quit();
        console.log('✓ Aplicación cerrada correctamente');
        process.exit(0);
      } catch (error) {
        console.error('✗ Error durante cierre:', error);
        process.exit(1);
      }
    });
  });

  // ============================================
  // Iniciar Servidor
  // ============================================
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`\n🚀 RanchUNI API iniciado en ${HOST}:${PORT}`);
    console.log(`📝 Ambiente: ${NODE_ENV}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health\n`);
  } catch (error) {
    console.error('✗ Error iniciando servidor:', error);
    await prisma.$disconnect();
    await redisClient.quit();
    process.exit(1);
  }
}

// Ejecutar inicio
start().catch((error) => {
  console.error('✗ Error fatal:', error);
  process.exit(1);
});
