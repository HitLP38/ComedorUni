/**
 * Integration tests for /operador routes.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { SignJWT } from 'jose';

vi.mock('../../src/lib/redis.js', () => ({
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn(), setEx: vi.fn(), eval: vi.fn(), zRange: vi.fn() },
  connectRedis: vi.fn(),
  disconnectRedis: vi.fn(),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

vi.mock('../../src/modules/operador/operador.repository.js', () => ({
  findOperadorByUsername: vi.fn(),
  findOperadorById: vi.fn(),
  findTicketByCodigo: vi.fn(),
  findTicketActivoByAlumno: vi.fn(),
  findAlumnoByCodigoOrDni: vi.fn(),
  marcarTicketConsumido: vi.fn(),
  createLogAcceso: vi.fn(),
}));

vi.mock('../../src/lib/mailer.js', () => ({
  getMailer: () => ({ send: vi.fn() }),
  buildVerifEmail: vi.fn(),
  buildOTPEmail: vi.fn(),
}));

import { buildApp } from '../../src/app.js';
import * as repo from '../../src/modules/operador/operador.repository.js';
import { redis } from '../../src/lib/redis.js';
import { config } from '../../src/config/env.js';

async function makeOperadorToken(operadorId = 10) {
  const secret = new TextEncoder().encode(config.JWT_SECRET);
  return new SignJWT({ sub: String(operadorId), id: operadorId, operadorId, role: 'OPERADOR' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret);
}

describe('Operador routes — /operador', () => {
  let app: FastifyInstance;
  let opToken: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
    opToken = await makeOperadorToken(10);
  });

  afterAll(() => app.close());

  // ── POST /operador/login ───────────────────────────────────────────────────
  describe('POST /operador/login', () => {
    it('devuelve 400 si faltan credenciales', async () => {
      const res = await app.inject({ method: 'POST', url: '/operador/login', body: {} });
      expect(res.statusCode).toBe(400);
    });

    it('devuelve 401 si el operador no existe', async () => {
      vi.mocked(repo.findOperadorByUsername).mockResolvedValue(null);
      const res = await app.inject({
        method: 'POST', url: '/operador/login',
        body: { username: 'noexiste', password: 'Cambiar123!' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── POST /operador/validar ─────────────────────────────────────────────────
  describe('POST /operador/validar', () => {
    it('devuelve 401 sin token', async () => {
      const res = await app.inject({
        method: 'POST', url: '/operador/validar',
        body: { codigo_ticket: 'some-code' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('devuelve 404 si el ticket no existe', async () => {
      vi.mocked(redis.get).mockResolvedValue(null); // token not revoked
      vi.mocked(repo.findTicketByCodigo).mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST', url: '/operador/validar',
        headers: { Authorization: `Bearer ${opToken}` },
        body: { codigo_ticket: '550e8400-e29b-41d4-a716-446655440099' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('devuelve 200 con ticket ACTIVO válido', async () => {
      vi.mocked(redis.get).mockResolvedValue(null); // token not revoked
      const ahora = new Date();
      const expiracion = new Date(ahora.getTime() + 30 * 60_000);

      vi.mocked(repo.findTicketByCodigo).mockResolvedValue({
        id: 5,
        alumno_id: 1,
        codigo_ticket: '550e8400-e29b-41d4-a716-446655440099',
        estado: 'ACTIVO',
        timestamp_expiracion: expiracion,
        alumno: { id: 1, codigo_alumno: '20241001', nombres_apellidos: 'Test Alumno', facultad: 'FIIS' },
        turno: { hora_inicio: '11:30', servicio: { nombre: 'ALMUERZO' } },
        fecha: new Date('2026-05-03'),
      } as any);
      vi.mocked(repo.marcarTicketConsumido).mockResolvedValue({} as any);
      vi.mocked(repo.createLogAcceso).mockResolvedValue({} as any);

      const res = await app.inject({
        method: 'POST', url: '/operador/validar',
        headers: { Authorization: `Bearer ${opToken}` },
        body: { codigo_ticket: '550e8400-e29b-41d4-a716-446655440099' },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json).toHaveProperty('alumno');
      expect(json).toHaveProperty('ticket');
    });
  });

  // ── GET /operador/turno-actual ─────────────────────────────────────────────
  describe('GET /operador/turno-actual', () => {
    it('devuelve 401 sin token', async () => {
      const res = await app.inject({ method: 'GET', url: '/operador/turno-actual' });
      expect(res.statusCode).toBe(401);
    });
  });
});
