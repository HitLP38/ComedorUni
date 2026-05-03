import { prisma } from '../../lib/prisma.js';
import type { RegistroInput } from '../../schemas/auth.schema.js';

export async function findAlumnoByDni(dni: string) {
  return prisma.alumno.findUnique({ where: { dni } });
}

export async function findAlumnoById(id: number) {
  return prisma.alumno.findUnique({ where: { id } });
}

export async function findAlumnoByCodigo(codigo_alumno: string) {
  return prisma.alumno.findUnique({ where: { codigo_alumno } });
}

export async function findAlumnoByCorreo(correo_uni: string) {
  return prisma.alumno.findUnique({ where: { correo_uni } });
}

export async function createAlumno(data: RegistroInput & { pin_hash: string }) {
  return prisma.alumno.create({
    data: {
      codigo_alumno: data.codigo_alumno,
      dni: data.dni,
      nombres_apellidos: data.nombres_apellidos,
      correo_uni: data.correo_uni,
      facultad: data.facultad,
      pin_hash: data.pin_hash,
    },
  });
}

export async function updateAlumnoPinHash(id: number, pin_hash: string) {
  return prisma.alumno.update({ where: { id }, data: { pin_hash } });
}

export async function createOTPCode(alumno_id: number, codigo: string, expiracion: Date) {
  return prisma.oTPCode.create({
    data: { alumno_id, codigo, timestamp_expiracion: expiracion, consumido: false },
  });
}

export async function findOTPCode(id: number) {
  return prisma.oTPCode.findUnique({ where: { id } });
}

export async function updateOTPCode(id: number, data: { consumido?: boolean; intentos_fallidos?: number }) {
  return prisma.oTPCode.update({ where: { id }, data });
}

export async function createLogAcceso(data: {
  alumno_id?: number;
  tipo_evento: string;
  ip_origen: string;
  detalles_json?: string;
}) {
  return prisma.logAcceso.create({
    data: {
      alumno_id: data.alumno_id,
      tipo_evento: data.tipo_evento as never,
      ip_origen: data.ip_origen,
      detalles_json: data.detalles_json,
    },
  });
}
