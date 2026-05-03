export const TTL_TICKET_MIN = 5;
export const HOLD_CUPO_SEG = 60;
export const HEARTBEAT_TIMEOUT_SEG = 30;
export const HEARTBEAT_INTERVAL_SEG = 15;
export const OTP_TTL_MIN = 5;
export const OTP_MAX_INTENTOS = 3;
export const VERIFICACION_TTL_HORAS = 24;
export const COLA_WORKER_INTERVALO_SEG = 10;
export const COLA_LIBERA_N = 5;
export const COLA_TTL_SEG = 1800;
export const NO_SHOW_VENTANA_DIAS = 30;
export const NO_SHOW_ADVERTENCIA = 2;
export const NO_SHOW_SUSPENSION_7D = 3;
export const NO_SHOW_SUSPENSION_MANUAL = 5;
export const CANCELACION_MIN_ANTES_MIN = 30;
export const ACCESS_TOKEN_TTL = '30m';
export const REFRESH_TOKEN_TTL = '7d';
export const OPERADOR_TOKEN_TTL = '8h';

export const FACULTADES_UNI = [
  'FC', 'FIM', 'FIQT', 'FIA', 'FIARN', 'FIEE',
  'FICE', 'FIC', 'FIGMM', 'FIAU', 'FIIS', 'FIPP',
] as const;
export type FacultadUNI = typeof FACULTADES_UNI[number];
