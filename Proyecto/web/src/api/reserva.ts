import { apiClient } from './client.js';

export interface Turno {
  id: number;
  hora_inicio: string;
  cupo_disponible: number;
  estado: string;
}

export interface Ticket {
  id: number;
  codigo_ticket: string;
  fecha: string;
  hora_inicio: string;
  qr_data: string;
  estado: string;
  servicio?: string;
}

export async function getTurnos(servicio: string, fecha: string) {
  const res = await apiClient.get(`/turnos?servicio=${servicio}&fecha=${fecha}`);
  return res.data as Turno[];
}

export async function holdCupo(token_reserva: string, turno_id: number) {
  const res = await apiClient.post('/reservas/hold', { token_reserva, turno_id });
  return res.data as { hold_id: string; ttl_segundos: number };
}

export async function confirmarReserva(token_reserva: string, turno_id: number) {
  const res = await apiClient.post('/reservas/confirmar', { token_reserva, turno_id });
  return res.data as { ticket: Ticket };
}

export async function getMisReservas() {
  const res = await apiClient.get('/reservas/mias');
  return res.data as Ticket[];
}

export async function cancelarReserva(id: number) {
  await apiClient.delete(`/reservas/${id}`);
}
