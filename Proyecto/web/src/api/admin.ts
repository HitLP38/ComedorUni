import { apiClient } from './client.js';

export async function loginAdmin(username: string, password: string) {
  const res = await apiClient.post('/admin/login', { username, password });
  return res.data as { accessToken: string; admin: { id: number; nombre: string; username: string } };
}

export async function getServicios() {
  const res = await apiClient.get('/admin/servicios');
  return res.data as Array<{ id: number; nombre: string; hora_apertura_reserva: string; hora_cierre_reserva: string; activo: boolean }>;
}

export async function getAlumnos(page = 1, limit = 20, q?: string, estado?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set('q', q);
  if (estado) params.set('estado', estado);
  const res = await apiClient.get(`/admin/alumnos?${params}`);
  return res.data as { alumnos: Array<{ id: number; codigo_alumno: string; nombres_apellidos: string; estado: string; facultad: string }>; total: number; pages: number };
}

export async function getSanciones(activas = false) {
  const res = await apiClient.get(`/admin/sanciones?activas=${activas}`);
  return res.data as Array<{ id: number; tipo: string; alumno: { codigo_alumno: string; nombres_apellidos: string }; fecha_aplicacion: string; resuelta: boolean }>;
}

export async function anularSancion(id: number, justificacion: string) {
  await apiClient.post(`/admin/sanciones/${id}/anular`, { justificacion });
}

export async function getReportesUso(desde: string, hasta: string) {
  const res = await apiClient.get(`/admin/reportes/uso?desde=${desde}&hasta=${hasta}`);
  return res.data as { tickets: Array<{ estado: string; _count: { id: number } }>; no_shows: number; sanciones: number };
}
