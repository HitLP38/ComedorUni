import { apiClient } from './client.js';

export async function entrarCola(servicio: string, fecha: string) {
  const res = await apiClient.post('/cola/entrar', { servicio, fecha });
  return res.data as { token_cola: string; posicion: number; total: number };
}

export async function salirCola(token_cola: string) {
  await apiClient.delete('/cola/salir', { data: { token_cola } });
}

export async function getPosicion(token_cola: string) {
  const res = await apiClient.get(`/cola/posicion?token_cola=${token_cola}`);
  return res.data as { posicion: number; total: number };
}
