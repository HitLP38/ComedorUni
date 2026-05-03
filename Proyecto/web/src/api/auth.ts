import { apiClient } from './client.js';

export interface AlumnoInfo {
  id: number;
  codigo_alumno: string;
  role: string;
}

export async function login(dni: string, pin: string) {
  const res = await apiClient.post('/auth/login', { dni, pin });
  return res.data as { challenge_id: number; mensaje: string };
}

export async function verificarOtp(challenge_id: number, codigo: string) {
  const res = await apiClient.post('/auth/verificar-otp', { challenge_id, codigo });
  return res.data as { accessToken: string; refreshToken: string; alumno: AlumnoInfo };
}

export async function logout() {
  await apiClient.post('/auth/logout');
}
