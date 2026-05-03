import { prisma } from '../../lib/prisma.js';

export async function findAdminByUsername(username: string) {
  return prisma.administrador.findUnique({ where: { username } });
}

export async function findAllServicios() {
  return prisma.servicio.findMany({ orderBy: { id: 'asc' } });
}

export async function updateServicio(id: number, data: {
  hora_apertura_reserva?: string;
  hora_cierre_reserva?: string;
  activo?: boolean;
}) {
  return prisma.servicio.update({ where: { id }, data });
}

export async function findTurnosByFecha(fecha: Date) {
  return prisma.turno.findMany({
    where: { fecha },
    include: { servicio: true },
    orderBy: [{ servicio_id: 'asc' }, { hora_inicio: 'asc' }],
  });
}

export async function updateTurno(id: number, data: { cupo_maximo?: number; estado?: string }) {
  return prisma.turno.update({ where: { id }, data: data as never });
}

export async function findAlumnos(opts: {
  estado?: string;
  q?: string;
  skip: number;
  take: number;
}) {
  const where = {
    ...(opts.estado ? { estado: opts.estado as never } : {}),
    ...(opts.q ? {
      OR: [
        { nombres_apellidos: { contains: opts.q, mode: 'insensitive' as const } },
        { codigo_alumno: { contains: opts.q } },
        { dni: { contains: opts.q } },
      ],
    } : {}),
  };
  const [alumnos, total] = await Promise.all([
    prisma.alumno.findMany({ where, skip: opts.skip, take: opts.take, orderBy: { id: 'asc' } }),
    prisma.alumno.count({ where }),
  ]);
  return { alumnos, total };
}

export async function findAlumnoById(id: number) {
  return prisma.alumno.findUnique({
    where: { id },
    include: { tickets: { take: 10, orderBy: { timestamp_creacion: 'desc' } }, sanciones: true },
  });
}

export async function updateAlumnoEstado(id: number, data: {
  estado: string;
  fecha_suspension_hasta?: Date | null;
}) {
  return prisma.alumno.update({ where: { id }, data: data as never });
}

export async function findSanciones(resuelta?: boolean) {
  return prisma.sancion.findMany({
    where: resuelta !== undefined ? { resuelta } : {},
    include: { alumno: { select: { codigo_alumno: true, nombres_apellidos: true } } },
    orderBy: { fecha_aplicacion: 'desc' },
    take: 100,
  });
}

export async function findSancionById(id: number) {
  return prisma.sancion.findUnique({ where: { id }, include: { alumno: true } });
}

export async function findLogs(opts: { take: number; skip: number }) {
  return prisma.logAcceso.findMany({
    include: { alumno: { select: { codigo_alumno: true, nombres_apellidos: true } } },
    orderBy: { timestamp: 'desc' },
    take: opts.take,
    skip: opts.skip,
  });
}

export async function reporteUso(desde: Date, hasta: Date) {
  const [tickets, noShows, sanciones] = await Promise.all([
    prisma.ticket.groupBy({
      by: ['estado'],
      where: { timestamp_creacion: { gte: desde, lte: hasta } },
      _count: { id: true },
    }),
    prisma.ticket.count({ where: { estado: 'NO_SHOW', timestamp_creacion: { gte: desde, lte: hasta } } }),
    prisma.sancion.count({ where: { fecha_aplicacion: { gte: desde, lte: hasta } } }),
  ]);
  return { tickets, no_shows: noShows, sanciones };
}

export async function createTurnosBatch(data: Array<{
  servicio_id: number;
  hora_inicio: string;
  duracion_minutos: number;
  cupo_maximo: number;
  cupo_actual: number;
  fecha: Date;
}>) {
  return prisma.turno.createMany({ data, skipDuplicates: true });
}
