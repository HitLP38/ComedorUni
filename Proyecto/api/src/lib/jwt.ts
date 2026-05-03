import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { config } from '../config/env.js';
import { Errors } from '../errors/AppError.js';

const secret = new TextEncoder().encode(config.JWT_SECRET);

export interface TokenPayload extends JWTPayload {
  id: number;
  codigo_alumno: string;
  role: 'ALUMNO' | 'ADMIN' | 'OPERADOR';
}

export async function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, ttl = config.JWT_EXPIRES_IN) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret);
}

export async function signRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.JWT_REFRESH_EXPIRES_IN)
    .setJti(crypto.randomUUID())
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as TokenPayload;
  } catch {
    throw Errors.AUTH_TOKEN_INVALIDO();
  }
}

export function extractToken(authHeader?: string): string {
  if (!authHeader?.startsWith('Bearer ')) throw Errors.NO_AUTENTICADO();
  return authHeader.slice(7);
}
