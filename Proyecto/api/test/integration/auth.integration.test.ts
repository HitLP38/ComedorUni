/**
 * Integration tests for /auth routes.
 * Mocks at repository + redis layer — tests full HTTP stack (routes, middleware, validation).
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

// ── Mocks (hoisted before imports) ────────────────────────────────────────────
vi.mock('../../src/lib/redis.js', () => ({
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn(), setEx: vi.fn(), eval: vi.fn() },
  connectRedis: vi.fn(),
  disconnectRedis: vi.fn(),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    alumno: { update: vi.fn() },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

vi.mock('../../src/modules/auth/auth.repository.js', () => ({
  findAlumnoByDni: vi.fn(),
  findAlumnoByCodigo: vi.fn(),
  findAlumnoByCorreo: vi.fn(),
  createAlumno: vi.fn(),
  updateAlumnoPinHash: vi.fn(),
  findAlumnoById: vi.fn(),
  createOTPCode: vi.fn(),
  findOTPCode: vi.fn(),
  updateOTPCode: vi.fn(),
  createLogAcceso: vi.fn(),
}));

vi.mock('../../src/lib/mailer.js', () => ({
  getMailer: () => ({ send: vi.fn() }),
  buildVerifEmail: vi.fn(() => ({ subject: 'test', body: 'test' })),
  buildOTPEmail: vi.fn(() => ({ subject: 'test', body: 'test' })),
}));

import { buildApp } from '../../src/app.js';
import * as repo from '../../src/modules/auth/auth.repository.js';
import { redis } from '../../src/lib/redis.js';
import { prisma } from '../../src/lib/prisma.js';

describe('Auth routes — /auth', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(() => app.close());

  // ── POST /auth/registro ────────────────────────────────────────────────────
  describe('POST /auth/registro', () => {
    it('devuelve 400 si el cuerpo está vacío', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/registro', body: {} });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toHaveProperty('error');
    });

    it('devuelve 400 si DNI tiene formato inválido', async () => {
      const res = await app.inject({
        method: 'POST', url: '/auth/registro',
        body: { codigo_alumno: '20241001', dni: '123', nombres_apellidos: 'Test Alumno', correo_uni: 't.test.alumno@uni.pe', facultad: 'FIIS', pin: '235789' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('devuelve 400 si correo no tiene formato @uni.pe', async () => {
      const res = await app.inject({
        method: 'POST', url: '/auth/registro',
        body: { codigo_alumno: '20241001', dni: '12345671', nombres_apellidos: 'Test Alumno', correo_uni: 'alumno@gmail.com', facultad: 'FIIS', pin: '235789' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('devuelve 201 con datos válidos', async () => {
      vi.mocked(repo.findAlumnoByDni).mockResolvedValue(null);
      vi.mocked(repo.findAlumnoByCodigo).mockResolvedValue(null);
      vi.mocked(repo.findAlumnoByCorreo).mockResolvedValue(null);
      vi.mocked(repo.createAlumno).mockResolvedValue({ id: 1, codigo_alumno: '20241001', correo_uni: 't.test.alumno@uni.pe' } as any);
      vi.mocked(redis.setEx).mockResolvedValue('OK' as any);
      vi.mocked(repo.createLogAcceso).mockResolvedValue({} as any);

      const res = await app.inject({
        method: 'POST', url: '/auth/registro',
        body: { codigo_alumno: '20241001', dni: '12345671', nombres_apellidos: 'Test Alumno', correo_uni: 't.test.alumno@uni.pe', facultad: 'FIIS', pin: '235789' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toHaveProperty('mensaje');
    });

    it('devuelve 409 si el alumno ya existe por DNI', async () => {
      vi.mocked(repo.findAlumnoByDni).mockResolvedValue({ id: 1 } as any);
      vi.mocked(repo.findAlumnoByCodigo).mockResolvedValue(null);
      vi.mocked(repo.findAlumnoByCorreo).mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST', url: '/auth/registro',
        body: { codigo_alumno: '20241001', dni: '12345671', nombres_apellidos: 'Test Alumno', correo_uni: 't.test.alumno@uni.pe', facultad: 'FIIS', pin: '235789' },
      });
      expect(res.statusCode).toBe(409);
    });
  });

  // ── POST /auth/login ───────────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    it('devuelve 400 si faltan campos', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/login', body: { dni: '12345671' } });
      expect(res.statusCode).toBe(400);
    });

    it('devuelve 401 si el alumno no existe', async () => {
      vi.mocked(repo.findAlumnoByDni).mockResolvedValue(null);
      const res = await app.inject({ method: 'POST', url: '/auth/login', body: { dni: '12345671', pin: '235789' } });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /auth/verificar/:token ─────────────────────────────────────────────
  describe('GET /auth/verificar/:token', () => {
    it('devuelve 410 si el token no existe en Redis', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      const res = await app.inject({ method: 'GET', url: '/auth/verificar/550e8400-e29b-41d4-a716-446655440000' });
      expect(res.statusCode).toBe(410);
    });

    it('devuelve 200 con token válido', async () => {
      vi.mocked(redis.get).mockResolvedValue('1');
      vi.mocked(repo.findAlumnoById).mockResolvedValue({ id: 1 } as any);
      vi.mocked(redis.del).mockResolvedValue(1 as any);
      vi.mocked((prisma.alumno as any).update).mockResolvedValue({ id: 1 });
      vi.mocked(repo.createLogAcceso).mockResolvedValue({} as any);

      const res = await app.inject({ method: 'GET', url: '/auth/verificar/550e8400-e29b-41d4-a716-446655440001' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty('mensaje');
    });
  });

  // ── POST /auth/logout (protegida) ──────────────────────────────────────────
  describe('POST /auth/logout', () => {
    it('devuelve 401 sin token Authorization', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/logout' });
      expect(res.statusCode).toBe(401);
    });
  });
});
