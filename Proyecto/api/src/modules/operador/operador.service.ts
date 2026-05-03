import { hashPin, verifyPin } from '../../lib/crypto.js';
import { signAccessToken, extractToken, verifyToken } from '../../lib/jwt.js';
import { redis } from '../../lib/redis.js';
import { Errors } from '../../errors/AppError.js';
import { ACCESS_TOKEN_TTL } from '../../config/constants.js';
import * as repo from './operador.repository.js';
import type { OperadorLoginInput, ValidarTicketInput } from '../../schemas/operador.schema.js';

export async function loginOperador(data: OperadorLoginInput, ip: string) {
  const operador = await repo.findOperadorByUsername(data.username);
  if (!operador || !operador.activo) throw Errors.AUTH_CREDENCIALES_INVALIDAS();

  const ok = await verifyPin(data.password, operador.password_hash);
  if (!ok) throw Errors.AUTH_CREDENCIALES_INVALIDAS();

  const payload = { id: operador.id, codigo_alumno: operador.username, role: 'OPERADOR' as const };
  const accessToken = await signAccessToken(payload, ACCESS_TOKEN_TTL);

  return { accessToken, operador: { id: operador.id, nombre: operador.nombre, username: operador.username } };
}

export async function logoutOperador(authHeader: string | undefined) {
  const token = extractToken(authHeader);
  const payload = await verifyToken(token);
  if (payload.jti) {
    await redis.setEx(`revoked:${payload.jti}`, 3600 * 2, '1');
  }
}

export async function validarTicket(data: ValidarTicketInput, operadorId: number, ip: string) {
  let ticket: Awaited<ReturnType<typeof repo.findTicketByCodigo>> | null = null;

  if (data.codigo_ticket) {
    ticket = await repo.findTicketByCodigo(data.codigo_ticket);
  } else {
    const valor = (data.codigo_alumno ?? data.dni)!;
    const alumno = await repo.findAlumnoByCodigoOrDni(valor);
    if (!alumno) throw Errors.TICKET_NO_ENCONTRADO();
    ticket = await repo.findTicketActivoByAlumno(alumno.id);
  }

  if (!ticket) throw Errors.TICKET_NO_ENCONTRADO();
  if (ticket.estado !== 'ACTIVO') throw Errors.TICKET_EXPIRADO();

  const ahora = new Date();
  if (ahora > ticket.timestamp_expiracion) throw Errors.TICKET_EXPIRADO();

  await repo.marcarTicketConsumido(ticket.id);

  await repo.createLogAcceso({
    alumno_id: ticket.alumno_id,
    tipo_evento: 'TICKET_VALIDADO',
    ip_origen: ip,
    detalles_json: JSON.stringify({ ticket_id: ticket.id, operador_id: operadorId }),
  });

  return {
    alumno: {
      codigo_alumno: ticket.alumno.codigo_alumno,
      nombres_apellidos: ticket.alumno.nombres_apellidos,
      facultad: ticket.alumno.facultad,
    },
    ticket: {
      id: ticket.id,
      codigo_ticket: ticket.codigo_ticket,
      servicio: ticket.turno.servicio.nombre,
      hora_inicio: ticket.turno.hora_inicio,
      fecha: ticket.fecha.toISOString().slice(0, 10),
      estado: 'CONSUMIDO',
    },
  };
}

export async function getTurnoActual() {
  const { prisma } = await import('../../lib/prisma.js');
  const ahora = new Date();
  const fechaHoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  const horaActual = `${String(ahora.getUTCHours()).padStart(2, '0')}:${String(ahora.getUTCMinutes()).padStart(2, '0')}`;

  return prisma.turno.findMany({
    where: {
      fecha: fechaHoy,
      estado: 'ABIERTO',
      hora_inicio: { lte: horaActual },
    },
    include: { servicio: true },
    orderBy: { hora_inicio: 'desc' },
    take: 2,
  });
}

export async function hashOperadorPassword(password: string) {
  return hashPin(password);
}
