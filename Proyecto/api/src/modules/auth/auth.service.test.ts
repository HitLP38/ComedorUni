import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/redis.js', () => ({
  redis: { setEx: vi.fn().mockResolvedValue('OK'), get: vi.fn(), del: vi.fn() },
}));
vi.mock('../../lib/mailer.js', () => ({
  getMailer: () => ({ send: vi.fn().mockResolvedValue(undefined) }),
  buildVerifEmail: (link: string) => link,
  buildOTPEmail: (otp: string) => otp,
}));
vi.mock('../../lib/crypto.js', async () => {
  const real = await vi.importActual<typeof import('../../lib/crypto.js')>('../../lib/crypto.js');
  return { ...real, verifyPin: vi.fn().mockResolvedValue(true) };
});
vi.mock('./auth.repository.js');
vi.mock('../../lib/prisma.js', () => ({
  prisma: { alumno: { update: vi.fn().mockResolvedValue({}) } },
}));

import * as repo from './auth.repository.js';
import * as cryptoLib from '../../lib/crypto.js';
import { redis } from '../../lib/redis.js';
import { registrarAlumno, verificarCorreo, loginAlumno, verificarOtp } from './auth.service.js';
import { AppError } from '../../errors/AppError.js';

// DNI válido para el algoritmo peruano: 12345671 → suma=122, 122%11=1, verificador='1'
const DNI_VALIDO = '12345671';

const alumnoBase = {
  id: 1,
  codigo_alumno: '20200001',
  dni: DNI_VALIDO,
  nombres_apellidos: 'Juan Perez',
  correo_uni: 'j.perez.test@uni.pe',
  facultad: 'FIC',
  pin_hash: '$argon2id$hash',
  correo_verificado: false,
  estado: 'ACTIVO' as const,
  inasistencias_acumuladas: 0,
  fecha_suspension_hasta: null,
  fecha_creacion: new Date(),
  fecha_ultima_modificacion: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('registrarAlumno', () => {
  it('crea alumno y retorna mensaje de confirmación', async () => {
    vi.mocked(repo.findAlumnoByDni).mockResolvedValue(null);
    vi.mocked(repo.findAlumnoByCodigo).mockResolvedValue(null);
    vi.mocked(repo.findAlumnoByCorreo).mockResolvedValue(null);
    vi.mocked(repo.createAlumno).mockResolvedValue(alumnoBase);
    vi.mocked(repo.createLogAcceso).mockResolvedValue({} as never);

    const result = await registrarAlumno(
      { codigo_alumno: '20200001', dni: DNI_VALIDO, nombres_apellidos: 'Juan Perez', correo_uni: 'j.perez.test@uni.pe', facultad: 'FIC', pin: '394857' },
      '127.0.0.1',
    );

    expect(result.mensaje).toContain('correo');
    expect(repo.createAlumno).toHaveBeenCalled();
  });

  it('lanza AUTH_ALUMNO_DUPLICADO si el DNI ya existe', async () => {
    vi.mocked(repo.findAlumnoByDni).mockResolvedValue(alumnoBase);
    vi.mocked(repo.findAlumnoByCodigo).mockResolvedValue(null);
    vi.mocked(repo.findAlumnoByCorreo).mockResolvedValue(null);

    await expect(
      registrarAlumno({ codigo_alumno: '20200002', dni: DNI_VALIDO, nombres_apellidos: 'X', correo_uni: 'a.b.c@uni.pe', facultad: 'FIC', pin: '394857' }, '127.0.0.1'),
    ).rejects.toMatchObject({ code: 'AUTH_ALUMNO_DUPLICADO' });
  });

  it('lanza AUTH_ALUMNO_DUPLICADO si el código de alumno ya existe', async () => {
    vi.mocked(repo.findAlumnoByDni).mockResolvedValue(null);
    vi.mocked(repo.findAlumnoByCodigo).mockResolvedValue(alumnoBase);
    vi.mocked(repo.findAlumnoByCorreo).mockResolvedValue(null);

    await expect(
      registrarAlumno({ codigo_alumno: '20200001', dni: DNI_VALIDO, nombres_apellidos: 'X', correo_uni: 'a.b.c@uni.pe', facultad: 'FIC', pin: '394857' }, '127.0.0.1'),
    ).rejects.toMatchObject({ code: 'AUTH_ALUMNO_DUPLICADO' });
  });
});

describe('verificarCorreo', () => {
  it('marca correo verificado con token válido', async () => {
    vi.mocked(redis.get as ReturnType<typeof vi.fn>).mockResolvedValue('1');
    vi.mocked(redis.del as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    vi.mocked(repo.findAlumnoById).mockResolvedValue(alumnoBase);
    vi.mocked(repo.createLogAcceso).mockResolvedValue({} as never);

    const result = await verificarCorreo('token-valido');
    expect(result.mensaje).toContain('verificad');
  });

  it('lanza AUTH_TOKEN_EXPIRADO con token inexistente', async () => {
    vi.mocked(redis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(verificarCorreo('token-inexistente')).rejects.toMatchObject({ code: 'AUTH_TOKEN_EXPIRADO' });
  });
});

describe('loginAlumno', () => {
  it('retorna challenge_id cuando credenciales son válidas', async () => {
    vi.mocked(repo.findAlumnoByDni).mockResolvedValue({ ...alumnoBase, correo_verificado: true });
    vi.mocked(repo.createOTPCode).mockResolvedValue({ id: 42, alumno_id: 1, codigo: '123456', timestamp_expiracion: new Date(), timestamp_generacion: new Date(), intentos_fallidos: 0, consumido: false });
    vi.mocked(repo.createLogAcceso).mockResolvedValue({} as never);
    vi.mocked(cryptoLib.verifyPin).mockResolvedValue(true);

    const result = await loginAlumno({ dni: DNI_VALIDO, pin: '394857' }, '127.0.0.1');
    expect(result).toHaveProperty('challenge_id');
  });

  it('lanza AUTH_NO_VERIFICADO si correo no verificado', async () => {
    vi.mocked(repo.findAlumnoByDni).mockResolvedValue({ ...alumnoBase, correo_verificado: false });
    await expect(loginAlumno({ dni: DNI_VALIDO, pin: '394857' }, '127.0.0.1')).rejects.toMatchObject({ code: 'AUTH_NO_VERIFICADO' });
  });

  it('lanza AUTH_CREDENCIALES_INVALIDAS si PIN incorrecto', async () => {
    vi.mocked(repo.findAlumnoByDni).mockResolvedValue({ ...alumnoBase, correo_verificado: true });
    vi.mocked(repo.createLogAcceso).mockResolvedValue({} as never);
    vi.mocked(cryptoLib.verifyPin).mockResolvedValue(false);
    await expect(loginAlumno({ dni: DNI_VALIDO, pin: '000000' }, '127.0.0.1')).rejects.toMatchObject({ code: 'AUTH_CREDENCIALES_INVALIDAS' });
  });
});

describe('verificarOtp', () => {
  const otpBase = {
    id: 1, alumno_id: 1, codigo: '123456',
    timestamp_expiracion: new Date(Date.now() + 300_000),
    timestamp_generacion: new Date(),
    intentos_fallidos: 0, consumido: false,
  };

  it('lanza AUTH_OTP_EXPIRADO con OTP vencido', async () => {
    vi.mocked(repo.findOTPCode).mockResolvedValue({ ...otpBase, timestamp_expiracion: new Date(Date.now() - 1000) });
    await expect(verificarOtp({ challenge_id: 1, codigo: '123456' }, '127.0.0.1')).rejects.toMatchObject({ code: 'AUTH_OTP_EXPIRADO' });
  });

  it('lanza AUTH_OTP_BLOQUEADO si consumido=true', async () => {
    vi.mocked(repo.findOTPCode).mockResolvedValue({ ...otpBase, consumido: true });
    await expect(verificarOtp({ challenge_id: 1, codigo: '123456' }, '127.0.0.1')).rejects.toMatchObject({ code: 'AUTH_OTP_BLOQUEADO' });
  });

  it('bloquea tras 3 intentos fallidos', async () => {
    vi.mocked(repo.findOTPCode).mockResolvedValue({ ...otpBase, intentos_fallidos: 2 });
    vi.mocked(repo.updateOTPCode).mockResolvedValue({} as never);
    await expect(verificarOtp({ challenge_id: 1, codigo: '000000' }, '127.0.0.1')).rejects.toMatchObject({ code: 'AUTH_OTP_BLOQUEADO' });
  });
});
