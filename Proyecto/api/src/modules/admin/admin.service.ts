import { verifyPin } from '../../lib/crypto.js';
import { signAccessToken } from '../../lib/jwt.js';
import { Errors } from '../../errors/AppError.js';
import { ACCESS_TOKEN_TTL } from '../../config/constants.js';
import { anularSancion as anularSancionService } from '../sancion/sancion.service.js';
import * as repo from './admin.repository.js';

const HORARIOS_ALMUERZO = ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00'];
const HORARIOS_CENA = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];
const DURACION_MIN = 30;
const CUPO_DEFAULT = 50;

export async function loginAdmin(data: { username: string; password: string }) {
  const admin = await repo.findAdminByUsername(data.username);
  if (!admin || !admin.activo) throw Errors.AUTH_CREDENCIALES_INVALIDAS();

  const ok = await verifyPin(data.password, admin.password_hash);
  if (!ok) throw Errors.AUTH_CREDENCIALES_INVALIDAS();

  const payload = { id: admin.id, codigo_alumno: admin.username, role: 'ADMIN' as const };
  const accessToken = await signAccessToken(payload, ACCESS_TOKEN_TTL);

  return { accessToken, admin: { id: admin.id, nombre: admin.nombre, username: admin.username } };
}

export async function getServicios() {
  return repo.findAllServicios();
}

export async function patchServicio(id: number, data: {
  hora_apertura_reserva?: string;
  hora_cierre_reserva?: string;
  activo?: boolean;
}) {
  return repo.updateServicio(id, data);
}

export async function getTurnos(fecha: string) {
  const fechaDate = new Date(fecha + 'T00:00:00.000Z');
  return repo.findTurnosByFecha(fechaDate);
}

export async function patchTurno(id: number, data: { cupo_maximo?: number; estado?: string }) {
  return repo.updateTurno(id, data);
}

export async function regenerarTurnos(servicio: string, fecha: string) {
  const { prisma } = await import('../../lib/prisma.js');
  const servicioDb = await prisma.servicio.findUnique({ where: { nombre: servicio } });
  if (!servicioDb) throw Errors.SERVICIO_CERRADO();

  const horarios = servicio === 'ALMUERZO' ? HORARIOS_ALMUERZO : HORARIOS_CENA;
  const fechaDate = new Date(fecha + 'T00:00:00.000Z');

  const turnos = horarios.map((hora) => ({
    servicio_id: servicioDb.id,
    hora_inicio: hora,
    duracion_minutos: DURACION_MIN,
    cupo_maximo: CUPO_DEFAULT,
    cupo_actual: 0,
    fecha: fechaDate,
  }));

  const result = await repo.createTurnosBatch(turnos);
  return { creados: result.count };
}

export async function getAlumnos(opts: { estado?: string; q?: string; page: number; limit: number }) {
  const skip = (opts.page - 1) * opts.limit;
  const { alumnos, total } = await repo.findAlumnos({ ...opts, skip, take: opts.limit });
  return { alumnos, total, page: opts.page, pages: Math.ceil(total / opts.limit) };
}

export async function getAlumnoById(id: number) {
  const alumno = await repo.findAlumnoById(id);
  if (!alumno) throw Errors.TICKET_NO_ENCONTRADO();
  return alumno;
}

export async function updateAlumnoEstado(id: number, data: {
  estado: 'ACTIVO' | 'SUSPENDIDO_7D' | 'SUSPENDIDO_MANUAL';
  justificacion?: string;
}) {
  return repo.updateAlumnoEstado(id, {
    estado: data.estado,
    fecha_suspension_hasta: data.estado === 'SUSPENDIDO_7D'
      ? new Date(Date.now() + 7 * 24 * 3600 * 1000)
      : null,
  });
}

export async function getSanciones(soloActivas = false) {
  return repo.findSanciones(soloActivas ? false : undefined);
}

export async function anularSancion(id: number, justificacion: string) {
  return anularSancionService(id, justificacion);
}

export async function getReportesUso(desde: string, hasta: string) {
  return repo.reporteUso(
    new Date(desde + 'T00:00:00.000Z'),
    new Date(hasta + 'T23:59:59.999Z'),
  );
}

export async function getLogs(page = 1, limit = 50) {
  return repo.findLogs({ take: limit, skip: (page - 1) * limit });
}
