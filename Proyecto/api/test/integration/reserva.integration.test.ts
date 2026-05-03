/**
 * Integration tests for /turnos + /reservas routes.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { SignJWT } from 'jose';

vi.mock('../../src/lib/redis.js', () => ({
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn(), setEx: vi.fn(), eval: vi.fn() },
  connectRedis: vi.fn(),
  disconnectRedis: vi.fn(),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  },
}));

vi.mock('../../src/modules/reserva/reserva.repository.js', () => ({
  findServicioByNombre: vi.fn(),
  findTurnosByServicioFecha: vi.fn(),
  findTurnoById: vi.fn(),
  findTicketActivo: vi.fn(),
  createTicket: vi.fn(),
  updateTicketEstado: vi.fn(),
  incrementarCupoActual: vi.fn(),
  decrementarCupoActual: vi.fn(),
  findTicketsByAlumno: vi.fn(),
  findTicketById: vi.fn(),
}));

vi.mock('../../src/modules/cola/cola.service.js', () => ({
  tokenReservaKey: vi.fn((t: string) => `token_reserva:${t}`),
}));

vi.mock('../../src/lib/mailer.js', () => ({
  getMailer: () => ({ send: vi.fn() }),
  buildVerifEmail: vi.fn(),
  buildOTPEmail: vi.fn(),
}));

import { buildApp } from '../../src/app.js';
import * as repo from '../../src/modules/reserva/reserva.repository.js';
import { redis } from '../../src/lib/redis.js';
import { config } from '../../src/config/env.js';

async function makeAlumnoToken(alumnoId = 1) {
  const secret = new TextEncoder().encode(config.JWT_SECRET);
  return new SignJWT({ sub: String(alumnoId), id: alumnoId, alumnoId, role: 'ALUMNO' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
}

describe('Reserva routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
    token = await makeAlumnoToken(1);
  });

  afterAll(() => app.close());

  // ── GET /turnos ────────────────────────────────────────────────────────────
  describe('GET /turnos', () => {
    it('devuelve 400 sin query params (ruta pública)', async () => {
      const res = await app.inject({ method: 'GET', url: '/turnos' });
      expect(res.statusCode).toBe(400);
    });

    it('devuelve 400 si faltan query params', async () => {
      const res = await app.inject({
        method: 'GET', url: '/turnos',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(400);
    });

    it('devuelve 200 con lista de turnos', async () => {
      vi.mocked(repo.findServicioByNombre).mockResolvedValue({ id: 1, nombre: 'ALMUERZO' } as any);
      vi.mocked(repo.findTurnosByServicioFecha).mockResolvedValue([
        { id: 1, hora_inicio: '11:30', cupo_maximo: 50, cupo_actual: 0, estado: 'ABIERTO' } as any,
      ]);
      vi.mocked(redis.get).mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET', url: '/turnos?servicio=ALMUERZO&fecha=2026-05-03',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
      expect(res.json()[0]).toHaveProperty('hora_inicio');
    });
  });

  // ── POST /reservas/hold ────────────────────────────────────────────────────
  describe('POST /reservas/hold', () => {
    it('devuelve 401 sin autenticación', async () => {
      const res = await app.inject({
        method: 'POST', url: '/reservas/hold',
        body: { token_reserva: '550e8400-e29b-41d4-a716-446655440000', turno_id: 1 },
      });
      expect(res.statusCode).toBe(401);
    });

    it('devuelve 400 si token_reserva no es UUID', async () => {
      const res = await app.inject({
        method: 'POST', url: '/reservas/hold',
        headers: { Authorization: `Bearer ${token}` },
        body: { token_reserva: 'no-es-uuid', turno_id: 1 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('devuelve 4xx si el token_reserva no existe en Redis', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      const res = await app.inject({
        method: 'POST', url: '/reservas/hold',
        headers: { Authorization: `Bearer ${token}` },
        body: { token_reserva: '550e8400-e29b-41d4-a716-446655440000', turno_id: 1 },
      });
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  // ── GET /reservas/mias ─────────────────────────────────────────────────────
  describe('GET /reservas/mias', () => {
    it('devuelve 401 sin token', async () => {
      const res = await app.inject({ method: 'GET', url: '/reservas/mias' });
      expect(res.statusCode).toBe(401);
    });

    it('devuelve 200 con array de tickets', async () => {
      vi.mocked(repo.findTicketsByAlumno).mockResolvedValue([
        {
          id: 1,
          codigo_ticket: 'uuid-abc',
          estado: 'ACTIVO',
          fecha: new Date('2026-05-03'),
          turno: { hora_inicio: '11:30', servicio: { nombre: 'ALMUERZO' } },
        } as any,
      ]);

      const res = await app.inject({
        method: 'GET', url: '/reservas/mias',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });
  });

  // ── DELETE /reservas/:id ───────────────────────────────────────────────────
  describe('DELETE /reservas/:id', () => {
    it('devuelve 401 sin token', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/reservas/1' });
      expect(res.statusCode).toBe(401);
    });

    it('devuelve 404 si el ticket no existe', async () => {
      vi.mocked(repo.findTicketById).mockResolvedValue(null);
      const res = await app.inject({
        method: 'DELETE', url: '/reservas/999',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
