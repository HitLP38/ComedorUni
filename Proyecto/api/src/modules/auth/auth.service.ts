export async function registrarAlumno(_data: unknown, _ip: string): Promise<{ mensaje: string }> {
  throw new Error('Not implemented — ver B3');
}

export async function verificarCorreo(_token: string): Promise<{ mensaje: string }> {
  throw new Error('Not implemented — ver B3');
}

export async function loginAlumno(_data: unknown, _ip: string): Promise<{ challenge_id: number; mensaje: string }> {
  throw new Error('Not implemented — ver B4');
}

export async function verificarOtp(_data: unknown, _ip: string): Promise<unknown> {
  throw new Error('Not implemented — ver B4');
}

export async function refreshTokens(_refreshToken: string): Promise<unknown> {
  throw new Error('Not implemented — ver B4');
}

export async function logout(_jti: string): Promise<void> {
  throw new Error('Not implemented — ver B4');
}

export async function cambiarPin(_data: unknown, _alumnoId: number): Promise<void> {
  throw new Error('Not implemented — ver B4');
}
