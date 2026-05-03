import { redis } from '../../lib/redis.js';
import { hashPin, verifyPin, generateOTP, generateVerifToken } from '../../lib/crypto.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../../lib/jwt.js';
import { getMailer, buildVerifEmail, buildOTPEmail } from '../../lib/mailer.js';
import { Errors } from '../../errors/AppError.js';
import { config } from '../../config/env.js';
import {
  VERIFICACION_TTL_HORAS,
  OTP_TTL_MIN,
  OTP_MAX_INTENTOS,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '../../config/constants.js';
import * as repo from './auth.repository.js';
import type { RegistroInput, LoginInput, VerificarOtpInput, CambiarPinInput } from '../../schemas/auth.schema.js';

function validarDni(dni: string): boolean {
  const factores = [3, 2, 7, 6, 5, 4, 3, 2];
  const suma = dni.slice(0, 7).split('').reduce((acc, d, i) => acc + parseInt(d) * factores[i]!, 0);
  const resto = suma % 11;
  const verificadores: Record<number, string> = { 0: '2', 1: '1', 2: '0', 3: '9', 4: '8', 5: '7', 6: '6', 7: '5', 8: '4', 9: '3', 10: 'K' };
  return (verificadores[resto] ?? '') === dni[7];
}

export async function registrarAlumno(data: RegistroInput, ip: string) {
  if (!validarDni(data.dni)) throw Errors.AUTH_DNI_INVALIDO();

  const [existeDni, existeCodigo, existeCorreo] = await Promise.all([
    repo.findAlumnoByDni(data.dni),
    repo.findAlumnoByCodigo(data.codigo_alumno),
    repo.findAlumnoByCorreo(data.correo_uni),
  ]);
  if (existeDni) throw Errors.AUTH_ALUMNO_DUPLICADO('DNI');
  if (existeCodigo) throw Errors.AUTH_ALUMNO_DUPLICADO('código de alumno');
  if (existeCorreo) throw Errors.AUTH_ALUMNO_DUPLICADO('correo UNI');

  const pin_hash = await hashPin(data.pin);
  const alumno = await repo.createAlumno({ ...data, pin_hash });

  const token = generateVerifToken();
  const ttlSeg = VERIFICACION_TTL_HORAS * 3600;
  await redis.setEx(`verif:${token}`, ttlSeg, String(alumno.id));

  const link = `${config.CORS_ORIGIN}/verificar/${token}`;
  await getMailer().send(alumno.correo_uni, 'Confirma tu cuenta RanchUNI', buildVerifEmail(link));

  await repo.createLogAcceso({ alumno_id: alumno.id, tipo_evento: 'REGISTRO_INICIO', ip_origen: ip });

  return { mensaje: 'Revisa tu correo UNI para confirmar tu cuenta.' };
}

export async function verificarCorreo(token: string) {
  const alumnoIdStr = await redis.get(`verif:${token}`);
  if (!alumnoIdStr) throw Errors.AUTH_TOKEN_EXPIRADO();

  const alumnoId = parseInt(alumnoIdStr);
  await Promise.all([
    repo.findAlumnoById(alumnoId).then((a) => {
      if (!a) throw Errors.AUTH_TOKEN_INVALIDO();
    }),
    redis.del(`verif:${token}`),
  ]);

  await import('../../lib/prisma.js').then(({ prisma }) =>
    prisma.alumno.update({ where: { id: alumnoId }, data: { correo_verificado: true } }),
  );

  await repo.createLogAcceso({ alumno_id: alumnoId, tipo_evento: 'REGISTRO_VERIFICACION', ip_origen: '0.0.0.0' });

  return { mensaje: 'Cuenta verificada. Ya puedes iniciar sesión.' };
}

export async function loginAlumno(data: LoginInput, ip: string) {
  const alumno = await repo.findAlumnoByDni(data.dni);
  if (!alumno) throw Errors.AUTH_CREDENCIALES_INVALIDAS();
  if (!alumno.correo_verificado) throw Errors.AUTH_NO_VERIFICADO();
  if (alumno.estado !== 'ACTIVO') {
    const hasta = alumno.fecha_suspension_hasta?.toLocaleDateString('es-PE');
    throw Errors.AUTH_SUSPENDIDO(hasta);
  }

  const pinOk = await verifyPin(data.pin, alumno.pin_hash);
  if (!pinOk) {
    await repo.createLogAcceso({ alumno_id: alumno.id, tipo_evento: 'LOGIN_FALLIDO', ip_origen: ip });
    throw Errors.AUTH_CREDENCIALES_INVALIDAS();
  }

  const expiracion = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
  const codigo = generateOTP();
  const otpCode = await repo.createOTPCode(alumno.id, codigo, expiracion);

  await getMailer().send(alumno.correo_uni, 'Tu código de acceso RanchUNI', buildOTPEmail(codigo));

  return { challenge_id: otpCode.id, mensaje: `Revisa tu correo UNI, el código expira en ${OTP_TTL_MIN} minutos.` };
}

export async function verificarOtp(data: VerificarOtpInput, ip: string) {
  const otpCode = await repo.findOTPCode(data.challenge_id);
  if (!otpCode) throw Errors.AUTH_OTP_INVALIDO();
  if (otpCode.consumido) throw Errors.AUTH_OTP_BLOQUEADO();
  if (new Date() > otpCode.timestamp_expiracion) throw Errors.AUTH_OTP_EXPIRADO();

  if (otpCode.codigo !== data.codigo) {
    const intentos = otpCode.intentos_fallidos + 1;
    if (intentos >= OTP_MAX_INTENTOS) {
      await repo.updateOTPCode(otpCode.id, { consumido: true });
      throw Errors.AUTH_OTP_BLOQUEADO();
    }
    await repo.updateOTPCode(otpCode.id, { intentos_fallidos: intentos });
    throw Errors.AUTH_OTP_INVALIDO();
  }

  await repo.updateOTPCode(otpCode.id, { consumido: true });

  const alumno = (await repo.findAlumnoById(otpCode.alumno_id))!;
  const payload = { id: alumno.id, codigo_alumno: alumno.codigo_alumno, role: 'ALUMNO' as const };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload, ACCESS_TOKEN_TTL),
    signRefreshToken(payload),
  ]);

  const refreshPayload = await verifyToken(refreshToken);
  const jti = refreshPayload.jti!;
  const ttlSeg = 7 * 24 * 3600;
  await redis.setEx(`refresh:${jti}`, ttlSeg, String(alumno.id));

  await repo.createLogAcceso({ alumno_id: alumno.id, tipo_evento: 'LOGIN_EXITOSO', ip_origen: ip });

  return {
    accessToken,
    refreshToken,
    alumno: {
      id: alumno.id,
      codigo_alumno: alumno.codigo_alumno,
      nombres_apellidos: alumno.nombres_apellidos,
      facultad: alumno.facultad,
      correo_uni: alumno.correo_uni,
    },
  };
}

export async function refreshTokens(refreshTokenStr: string) {
  const payload = await verifyToken(refreshTokenStr);
  const jti = payload.jti;
  if (!jti) throw Errors.AUTH_TOKEN_INVALIDO();

  const stored = await redis.get(`refresh:${jti}`);
  if (!stored) throw Errors.AUTH_TOKEN_INVALIDO();

  await redis.del(`refresh:${jti}`);

  const newPayload = { id: payload.id, codigo_alumno: payload.codigo_alumno, role: payload.role };
  const [accessToken, newRefreshToken] = await Promise.all([
    signAccessToken(newPayload, ACCESS_TOKEN_TTL),
    signRefreshToken(newPayload),
  ]);

  const newPayloadDec = await verifyToken(newRefreshToken);
  const newJti = newPayloadDec.jti!;
  await redis.setEx(`refresh:${newJti}`, 7 * 24 * 3600, stored);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) return;
  try {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (payload.jti) await redis.del(`refresh:${payload.jti}`);
  } catch {
    // token ya inválido — no hay nada que revocar
  }
}

export async function cambiarPin(data: CambiarPinInput, alumnoId: number) {
  const alumno = await repo.findAlumnoById(alumnoId);
  if (!alumno) throw Errors.NO_AUTENTICADO();

  const pinOk = await verifyPin(data.pin_actual, alumno.pin_hash);
  if (!pinOk) throw Errors.AUTH_CREDENCIALES_INVALIDAS();

  const nuevoHash = await hashPin(data.pin_nuevo);
  await repo.updateAlumnoPinHash(alumnoId, nuevoHash);
  await repo.createLogAcceso({ alumno_id: alumnoId, tipo_evento: 'CAMBIO_PIN', ip_origen: '0.0.0.0' });
}
