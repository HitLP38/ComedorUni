import { prisma } from '../../lib/prisma.js';

export async function findTicketByCodigo(codigo_ticket: string) {
  return prisma.ticket.findUnique({
    where: { codigo_ticket },
    include: { alumno: true, turno: { include: { servicio: true } } },
  });
}

export async function findTicketActivoHoy(alumno_id: number, fecha: Date) {
  return prisma.ticket.findFirst({
    where: { alumno_id, fecha, estado: 'ACTIVO' },
    include: { turno: true },
  });
}

export async function marcarTicketConsumido(id: number) {
  return prisma.ticket.update({
    where: { id },
    data: { estado: 'CONSUMIDO', timestamp_validacion: new Date() },
  });
}

export async function findTicketsActivosPasados(hasta: Date) {
  return prisma.ticket.findMany({
    where: { estado: 'ACTIVO', timestamp_expiracion: { lte: hasta } },
    include: { alumno: true, turno: true },
  });
}
