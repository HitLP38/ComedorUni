export interface AlumnoPublico {
  id: number;
  codigo_alumno: string;
  nombres_apellidos: string;
  facultad: string;
  correo_uni: string;
}

export interface LoginResponse {
  challenge_id: number;
  mensaje: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  alumno: AlumnoPublico;
}
