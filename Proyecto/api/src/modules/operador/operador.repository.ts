import { prisma } from '../../lib/prisma.js';

export async function findOperadorByUsername(username: string) {
  return prisma.operador.findUnique({ where: { username } });
}

export async function findOperadorById(id: number) {
  return prisma.operador.findUnique({ where: { id } });
}

export async function findTicketByCodigo(codigo_ticket: string) {
  return prisma.ticket.findUnique({
    where: { codigo_ticket },
    include: { alumno: true, turno: { include: { servicio: true } } },
  });
}

export async function findTicketActivoByAlumno(alumno_id: number) {
  const hoy = new Date();
  const fechaHoy = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  return prisma.ticket.findFirst({
    where: { alumno_id, fecha: fechaHoy, estado: 'ACTIVO' },
    include: { alumno: true, turno: { include: { servicio: true } } },
  });
}

export async function findAlumnoByCodigoOrDni(value: string) {
  return prisma.alumno.findFirst({
    where: { OR: [{ codigo_alumno: value }, { dni: value }] },
  });
}

export async function marcarTicketConsumido(id: number) {
  return prisma.ticket.update({
    where: { id },
    data: { estado: 'CONSUMIDO', timestamp_validacion: new Date() },
  });
}

export async function createLogAcceso(data: {
  alumno_id?: number;
  tipo_evento: 'TICKET_VALIDADO';
  ip_origen: string;
  detalles_json?: string;
}) {
  return prisma.logAcceso.create({ data });
}
