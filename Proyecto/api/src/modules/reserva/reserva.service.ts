import { redis } from '../../lib/redis.js';
import { Errors } from '../../errors/AppError.js';
import { HOLD_CUPO_SEG } from '../../config/constants.js';
import { generateTicketCode } from '../../lib/crypto.js';
import { tokenReservaKey } from '../cola/cola.service.js';
import * as repo from './reserva.repository.js';

function holdKey(turnoId: number, alumnoId: number) {
  return `hold:${turnoId}:${alumnoId}`;
}

function holdCountKey(turnoId: number) {
  return `hold_count:${turnoId}`;
}

export async function getTurnos(servicio: string, fecha: string) {
  const servicioDb = await repo.findServicioByNombre(servicio);
  if (!servicioDb) throw Errors.SERVICIO_CERRADO();

  const fechaDate = new Date(fecha + 'T00:00:00.000Z');
  const turnos = await repo.findTurnosByServicioFecha(servicioDb.id, fechaDate);

  return Promise.all(
    turnos.map(async (t) => {
      const holds = parseInt((await redis.get(holdCountKey(t.id))) ?? '0');
      const cupoDisponible = t.cupo_maximo - t.cupo_actual - holds;
      return {
        id: t.id,
        hora_inicio: t.hora_inicio,
        cupo_disponible: Math.max(0, cupoDisponible),
        estado: t.estado,
      };
    }),
  );
}

export async function holdCupo(data: { token_reserva: string; turno_id: number }, alumnoId: number) {
  const tokenData = await redis.get(tokenReservaKey(data.token_reserva));
  if (!tokenData) throw Errors.TOKEN_RESERVA_INVALIDO();

  const reservaData = JSON.parse(tokenData) as { alumno_id: number; servicio: string; fecha: string };
  if (reservaData.alumno_id !== alumnoId) throw Errors.TOKEN_RESERVA_INVALIDO();

  const turno = await repo.findTurnoById(data.turno_id);
  if (!turno) throw Errors.TURNO_SIN_CUPO();

  // Validar que el turno pertenece al servicio correcto
  const servicio = await repo.findServicioByNombre(reservaData.servicio);
  if (!servicio || turno.servicio_id !== servicio.id) throw Errors.TOKEN_RESERVA_INVALIDO();

  // Lua script para hold atómico (previene oversell)
  const luaScript = `
    local holdKey = KEYS[1]
    local countKey = KEYS[2]
    local cupoMax = tonumber(ARGV[1])
    local cupoActual = tonumber(ARGV[2])
    local ttl = tonumber(ARGV[3])

    if redis.call("exists", holdKey) == 1 then
      return -1  -- ya tiene hold
    end

    local holds = tonumber(redis.call("get", countKey) or "0")
    if (cupoActual + holds) >= cupoMax then
      return 0  -- sin cupo
    end

    redis.call("setex", holdKey, ttl, "1")
    redis.call("incr", countKey)
    redis.call("expire", countKey, ttl + 60)
    return 1
  `;

  const result = await redis.eval(luaScript, {
    keys: [holdKey(data.turno_id, alumnoId), holdCountKey(data.turno_id)],
    arguments: [
      String(turno.cupo_maximo),
      String(turno.cupo_actual),
      String(HOLD_CUPO_SEG),
    ],
  });

  if (result === -1 || result === 0n || result === 0) {
    throw result === -1 || result === -1n ? Errors.TURNO_SIN_CUPO() : Errors.TURNO_SIN_CUPO();
  }

  return { hold_id: `${data.turno_id}:${alumnoId}`, ttl_segundos: HOLD_CUPO_SEG };
}

export async function confirmarReserva(
  data: { token_reserva: string; turno_id: number },
  alumnoId: number,
) {
  const tokenData = await redis.get(tokenReservaKey(data.token_reserva));
  if (!tokenData) throw Errors.TOKEN_RESERVA_INVALIDO();

  const reservaData = JSON.parse(tokenData) as { alumno_id: number; servicio: string; fecha: string };
  if (reservaData.alumno_id !== alumnoId) throw Errors.TOKEN_RESERVA_INVALIDO();

  const holdExists = await redis.get(holdKey(data.turno_id, alumnoId));
  if (!holdExists) throw Errors.HOLD_EXPIRADO();

  const turno = await repo.findTurnoById(data.turno_id);
  if (!turno) throw Errors.TURNO_SIN_CUPO();

  const fecha = new Date(reservaData.fecha + 'T00:00:00.000Z');
  const ticketExistente = await repo.findTicketActivo(alumnoId, fecha, turno.servicio_id);
  if (ticketExistente) throw Errors.RESERVA_DUPLICADA();

  const [horaH, horaM] = turno.hora_inicio.split(':').map(Number);
  const expiracion = new Date(fecha);
  expiracion.setUTCHours(horaH!, horaM!, 0, 0);
  expiracion.setUTCMinutes(expiracion.getUTCMinutes() + turno.duracion_minutos + 30);

  const codigo_ticket = generateTicketCode();

  const ticket = await repo.createTicket({
    alumno_id: alumnoId,
    turno_id: data.turno_id,
    fecha,
    codigo_ticket,
    timestamp_expiracion: expiracion,
  });

  await repo.incrementarCupoActual(data.turno_id);

  await Promise.all([
    redis.del(holdKey(data.turno_id, alumnoId)),
    redis.decr(holdCountKey(data.turno_id)),
    redis.del(tokenReservaKey(data.token_reserva)),
  ]);

  return {
    ticket: {
      id: ticket.id,
      codigo_ticket: ticket.codigo_ticket,
      fecha: reservaData.fecha,
      hora_inicio: turno.hora_inicio,
      qr_data: ticket.codigo_ticket,
      estado: ticket.estado,
    },
  };
}

export async function getMisReservas(alumnoId: number) {
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);
  const tickets = await repo.findTicketsByAlumno(alumnoId, desde);
  return tickets.map((t) => ({
    id: t.id,
    codigo_ticket: t.codigo_ticket,
    fecha: t.fecha.toISOString().slice(0, 10),
    hora_inicio: t.turno.hora_inicio,
    servicio: t.turno.servicio.nombre,
    estado: t.estado,
  }));
}

export async function cancelarReserva(ticketId: number, alumnoId: number) {
  const ticket = await repo.findTicketById(ticketId);
  if (!ticket) throw Errors.TICKET_NO_ENCONTRADO();
  if (ticket.alumno_id !== alumnoId) throw Errors.NO_AUTORIZADO();
  if (ticket.estado !== 'ACTIVO') throw Errors.TICKET_EXPIRADO();

  const ahora = new Date();
  const [h, m] = ticket.turno.hora_inicio.split(':').map(Number);
  const inicio = new Date(ticket.fecha);
  inicio.setUTCHours(h!, m!, 0, 0);
  const diffMin = (inicio.getTime() - ahora.getTime()) / 60_000;

  if (diffMin < 30) throw Errors.TICKET_CANCELACION_TARDÍA();

  await repo.updateTicketEstado(ticketId, 'CANCELADO');
  await repo.decrementarCupoActual(ticket.turno_id);
}
