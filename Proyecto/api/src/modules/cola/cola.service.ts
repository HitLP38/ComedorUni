import { redis } from '../../lib/redis.js';
import {
  COLA_TTL_SEG,
  TTL_TICKET_MIN,
  COLA_LIBERA_N,
} from '../../config/constants.js';

function colaKey(servicio: string, fecha: string) {
  return `cola:${servicio}:${fecha}`;
}

function sesionKey(tokenCola: string) {
  return `sesion_cola:${tokenCola}`;
}

export function tokenReservaKey(tokenReserva: string) {
  return `token_reserva:${tokenReserva}`;
}

export function pubSubChannel(servicio: string, fecha: string) {
  return `cola_evento:${servicio}:${fecha}`;
}

export async function entrarCola(alumnoId: number, servicio: string) {
  const fecha = new Date().toISOString().slice(0, 10);
  const key = colaKey(servicio, fecha);

  const yaEnCola = await redis.zScore(key, String(alumnoId));
  if (yaEnCola !== null) throw { code: 'AUTH_YA_EN_COLA', message: 'Ya estás en la cola para este servicio.', statusCode: 409 };

  const tsEntrada = Date.now();
  await redis.zAdd(key, { score: tsEntrada, value: String(alumnoId) });
  await redis.expire(key, COLA_TTL_SEG);

  const tokenCola = crypto.randomUUID();
  const posicion = (await redis.zRank(key, String(alumnoId)) ?? 0) + 1;
  const total = await redis.zCard(key);

  await redis.setEx(sesionKey(tokenCola), COLA_TTL_SEG, JSON.stringify({
    alumno_id: alumnoId, servicio, fecha, ts_entrada: tsEntrada,
  }));

  return {
    token_cola: tokenCola,
    posicion,
    total,
    ws_url: 'ws://localhost:3001/ws/cola',
  };
}

export async function salirCola(tokenCola: string) {
  const sesionStr = await redis.get(sesionKey(tokenCola));
  if (!sesionStr) return;
  const sesion = JSON.parse(sesionStr) as { alumno_id: number; servicio: string; fecha: string };
  const key = colaKey(sesion.servicio, sesion.fecha);
  await Promise.all([
    redis.zRem(key, String(sesion.alumno_id)),
    redis.del(sesionKey(tokenCola)),
  ]);
}

export async function getPosicion(tokenCola: string) {
  const sesionStr = await redis.get(sesionKey(tokenCola));
  if (!sesionStr) return null;
  const sesion = JSON.parse(sesionStr) as { alumno_id: number; servicio: string; fecha: string };
  const key = colaKey(sesion.servicio, sesion.fecha);
  const rank = await redis.zRank(key, String(sesion.alumno_id));
  if (rank === null) return null;
  const total = await redis.zCard(key);
  return { posicion: rank + 1, total, eta_segundos: (rank + 1) * 30 };
}

export async function liberarNAlumnos(servicio: string, fecha: string): Promise<number[]> {
  const key = colaKey(servicio, fecha);
  const primeros = await redis.zRange(key, 0, COLA_LIBERA_N - 1);
  if (primeros.length === 0) return [];

  const alumnoIds: number[] = [];
  for (const alumnoIdStr of primeros) {
    const alumnoId = parseInt(alumnoIdStr);
    alumnoIds.push(alumnoId);

    const tokenReserva = crypto.randomUUID();
    const ttlSeg = TTL_TICKET_MIN * 60;
    await redis.setEx(tokenReservaKey(tokenReserva), ttlSeg, JSON.stringify({ alumno_id: alumnoId, servicio, fecha }));

    await redis.publish(pubSubChannel(servicio, fecha), JSON.stringify({
      tipo: 'tu_turno',
      alumno_id: alumnoId,
      token_reserva: tokenReserva,
      ttl_segundos: ttlSeg,
    }));

    await redis.zRem(key, alumnoIdStr);
  }
  return alumnoIds;
}

export async function getColasSesiones() {
  const keys = await redis.keys('cola:*');
  return keys.map((k) => {
    const parts = k.split(':');
    return { servicio: parts[1]!, fecha: parts[2]! };
  });
}
