import { apiClient } from './client.js';

export async function loginOperador(username: string, password: string) {
  const res = await apiClient.post('/operador/login', { username, password });
  return res.data as { accessToken: string; operador: { id: number; nombre: string; username: string } };
}

export async function validarTicket(data: { codigo_ticket?: string; codigo_alumno?: string; dni?: string }) {
  const res = await apiClient.post('/operador/validar', data);
  return res.data as {
    alumno: { codigo_alumno: string; nombres_apellidos: string; facultad: string };
    ticket: { id: number; codigo_ticket: string; servicio: string; hora_inicio: string; fecha: string; estado: string };
  };
}

export async function getTurnoActual() {
  const res = await apiClient.get('/operador/turno-actual');
  return res.data as Array<{ id: number; hora_inicio: string; servicio: { nombre: string }; cupo_actual: number; cupo_maximo: number }>;
}
