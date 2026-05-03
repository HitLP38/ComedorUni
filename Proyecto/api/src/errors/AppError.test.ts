import { describe, it, expect } from 'vitest';
import { AppError, Errors } from './AppError.js';

describe('AppError', () => {
  it('tiene el código y statusCode correctos', () => {
    const e = new AppError('TEST_CODE', 'Mensaje de prueba', 422);
    expect(e.code).toBe('TEST_CODE');
    expect(e.statusCode).toBe(422);
    expect(e.message).toBe('Mensaje de prueba');
    expect(e).toBeInstanceOf(AppError);
    expect(e).toBeInstanceOf(Error);
  });

  it('serializa a JSON correctamente', () => {
    const e = new AppError('TEST_CODE', 'Mensaje', 400, { campo: 'dni' });
    expect(e.toJSON()).toEqual({
      error: { code: 'TEST_CODE', message: 'Mensaje', details: { campo: 'dni' } },
    });
  });

  it('serializa sin details cuando no se pasan', () => {
    const e = new AppError('TEST_CODE', 'Mensaje');
    const json = e.toJSON();
    expect(json.error).not.toHaveProperty('details');
  });
});

describe('Errors factory', () => {
  it('Errors.AUTH_DNI_INVALIDO crea AppError con statusCode 400', () => {
    const e = Errors.AUTH_DNI_INVALIDO();
    expect(e.code).toBe('AUTH_DNI_INVALIDO');
    expect(e.statusCode).toBe(400);
  });

  it('Errors.AUTH_ALUMNO_DUPLICADO incluye el campo', () => {
    const e = Errors.AUTH_ALUMNO_DUPLICADO('DNI');
    expect(e.message).toContain('DNI');
    expect(e.statusCode).toBe(409);
  });

  it('Errors.NO_AUTENTICADO tiene statusCode 401', () => {
    expect(Errors.NO_AUTENTICADO().statusCode).toBe(401);
  });
});
