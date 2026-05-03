import argon2 from 'argon2';
import { config } from '../config/env.js';

export async function hashPin(pin: string): Promise<string> {
  return argon2.hash(pin, {
    type: argon2.argon2id,
    memoryCost: config.ARGON2_MEMORY,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, pin);
  } catch {
    return false;
  }
}

export function generateOTP(): string {
  const digits = Array.from({ length: 6 }, () => crypto.getRandomValues(new Uint8Array(1))[0] % 10);
  return digits.join('');
}

export function generateTicketCode(): string {
  return crypto.randomUUID();
}

export function generateVerifToken(): string {
  return crypto.randomUUID();
}

export function isPinDebil(pin: string): boolean {
  if (/^(\d)\1{5}$/.test(pin)) return true;
  const digits = pin.split('').map(Number);
  const isAsc = digits.every((d, i) => i === 0 || d === digits[i - 1]! + 1);
  const isDesc = digits.every((d, i) => i === 0 || d === digits[i - 1]! - 1);
  return isAsc || isDesc;
}
