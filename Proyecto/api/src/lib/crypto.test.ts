import { describe, it, expect } from 'vitest';
import { hashPin, verifyPin, generateOTP, isPinDebil } from './crypto.js';

describe('hashPin / verifyPin', () => {
  it('verifica un PIN correcto', async () => {
    const hash = await hashPin('123456');
    expect(await verifyPin('123456', hash)).toBe(true);
  });

  it('rechaza un PIN incorrecto', async () => {
    const hash = await hashPin('123456');
    expect(await verifyPin('654321', hash)).toBe(false);
  });

  it('genera hashes distintos para el mismo PIN (sal aleatoria)', async () => {
    const h1 = await hashPin('123456');
    const h2 = await hashPin('123456');
    expect(h1).not.toBe(h2);
  });
});

describe('generateOTP', () => {
  it('genera exactamente 6 caracteres', () => {
    expect(generateOTP()).toHaveLength(6);
  });

  it('contiene solo dígitos', () => {
    expect(generateOTP()).toMatch(/^\d{6}$/);
  });

  it('genera valores diferentes en llamadas consecutivas', () => {
    const otps = new Set(Array.from({ length: 20 }, () => generateOTP()));
    expect(otps.size).toBeGreaterThan(1);
  });
});

describe('isPinDebil', () => {
  it('detecta PIN repetido (111111)', () => {
    expect(isPinDebil('111111')).toBe(true);
  });

  it('detecta PIN ascendente (123456)', () => {
    expect(isPinDebil('123456')).toBe(true);
  });

  it('detecta PIN descendente (987654)', () => {
    expect(isPinDebil('987654')).toBe(true);
  });

  it('acepta PIN no débil', () => {
    expect(isPinDebil('394857')).toBe(false);
  });
});
