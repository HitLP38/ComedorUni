import { prisma } from '../../lib/prisma.js';

export async function findTicketsNoShowPorCerrar(fechaServicio: Date, servicioId: number) {
  return prisma.ticket.findMany({
    where: {
      fecha: fechaServicio,
      turno: { servicio_id: servicioId },
      estado: 'ACTIVO',
    },
    include: { alumno: true, turno: true },
  });
}

export async function marcarNoShow(ticketId: number) {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: { estado: 'NO_SHOW' },
  });
}

export async function incrementarInasistencias(alumnoId: number) {
  return prisma.alumno.update({
    where: { id: alumnoId },
    data: { inasistencias_acumuladas: { increment: 1 } },
    select: { id: true, inasistencias_acumuladas: true, estado: true },
  });
}

export async function countNoShowsVentana(alumnoId: number, desde: Date) {
  return prisma.ticket.count({
    where: { alumno_id: alumnoId, estado: 'NO_SHOW', timestamp_creacion: { gte: desde } },
  });
}

export async function findSancionActiva(alumnoId: number, tipo: string) {
  return prisma.sancion.findFirst({
    where: { alumno_id: alumnoId, tipo: tipo as never, resuelta: false },
  });
}

export async function createSancion(data: {
  alumno_id: number;
  tipo: 'ADVERTENCIA' | 'SUSPENSION_7D' | 'SUSPENSION_MANUAL';
  ticket_id?: number;
  fecha_levantamiento?: Date;
  razon?: string;
}) {
  return prisma.sancion.create({ data });
}

export async function updateAlumnoEstado(alumnoId: number, estado: 'ACTIVO' | 'SUSPENDIDO_7D' | 'SUSPENDIDO_MANUAL', fechaSuspensionHasta?: Date) {
  return prisma.alumno.update({
    where: { id: alumnoId },
    data: { estado, fecha_suspension_hasta: fechaSuspensionHasta ?? null },
  });
}

export async function findSancionesPendientesLevantar() {
  return prisma.sancion.findMany({
    where: {
      resuelta: false,
      tipo: 'SUSPENSION_7D',
      fecha_levantamiento: { lte: new Date() },
    },
    include: { alumno: true },
  });
}

export async function resolveSancion(sancionId: number) {
  return prisma.sancion.update({
    where: { id: sancionId },
    data: { resuelta: true },
  });
}

export async function createLogSancion(data: {
  alumno_id: number;
  tipo_evento: 'SANCION_APLICADA';
  ip_origen: string;
  detalles_json?: string;
}) {
  return prisma.logAcceso.create({ data });
}
