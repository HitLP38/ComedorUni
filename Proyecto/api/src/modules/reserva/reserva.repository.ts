import { prisma } from '../../lib/prisma.js';
import { EstadoTurno } from '@prisma/client';

export async function findTurnosByServicioFecha(servicio_id: number, fecha: Date) {
  return prisma.turno.findMany({
    where: { servicio_id, fecha, estado: EstadoTurno.ABIERTO },
    orderBy: { hora_inicio: 'asc' },
  });
}

export async function findTurnoById(id: number) {
  return prisma.turno.findUnique({ where: { id } });
}

export async function findServicioByNombre(nombre: string) {
  return prisma.servicio.findUnique({ where: { nombre } });
}

export async function findTicketActivo(alumno_id: number, fecha: Date, servicio_id: number) {
  return prisma.ticket.findFirst({
    where: {
      alumno_id,
      fecha,
      estado: { in: ['ACTIVO', 'CONSUMIDO'] },
      turno: { servicio_id },
    },
  });
}

export async function createTicket(data: {
  alumno_id: number;
  turno_id: number;
  fecha: Date;
  codigo_ticket: string;
  timestamp_expiracion: Date;
}) {
  return prisma.ticket.create({ data: { ...data, estado: 'ACTIVO' } });
}

export async function updateTicketEstado(id: number, estado: string) {
  return prisma.ticket.update({ where: { id }, data: { estado: estado as never } });
}

export async function incrementarCupoActual(turno_id: number) {
  return prisma.turno.update({ where: { id: turno_id }, data: { cupo_actual: { increment: 1 } } });
}

export async function decrementarCupoActual(turno_id: number) {
  return prisma.turno.update({ where: { id: turno_id }, data: { cupo_actual: { decrement: 1 } } });
}

export async function findTicketsByAlumno(alumno_id: number, desde: Date) {
  return prisma.ticket.findMany({
    where: { alumno_id, timestamp_creacion: { gte: desde } },
    include: { turno: { include: { servicio: true } } },
    orderBy: { timestamp_creacion: 'desc' },
  });
}

export async function findTicketById(id: number) {
  return prisma.ticket.findUnique({ where: { id }, include: { turno: true, alumno: true } });
}
