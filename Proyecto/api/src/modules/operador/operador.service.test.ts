import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/crypto.js', () => ({
  hashPin: vi.fn(),
  verifyPin: vi.fn(),
}));

vi.mock('../../lib/jwt.js', () => ({
  signAccessToken: vi.fn(),
  extractToken: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock('../../lib/redis.js', () => ({
  redis: { setEx: vi.fn() },
}));

vi.mock('./operador.repository.js', () => ({
  findOperadorByUsername: vi.fn(),
  findOperadorById: vi.fn(),
  findTicketByCodigo: vi.fn(),
  findTicketActivoByAlumno: vi.fn(),
  findAlumnoByCodigoOrDni: vi.fn(),
  marcarTicketConsumido: vi.fn(),
  createLogAcceso: vi.fn(),
}));

import { verifyPin, hashPin } from '../../lib/crypto.js';
import { signAccessToken } from '../../lib/jwt.js';
import * as repo from './operador.repository.js';
import * as service from './operador.service.js';
import { AppError } from '../../errors/AppError.js';

const verifyPinMock = verifyPin as ReturnType<typeof vi.fn>;
const signMock = signAccessToken as ReturnType<typeof vi.fn>;
const repoMock = repo as Record<string, ReturnType<typeof vi.fn>>;

const mockOperador = {
  id: 1, username: 'op01', nombre: 'Operador 01',
  password_hash: '$argon2id$hash', activo: true, fecha_creacion: new Date(),
};

const mockAlumno = {
  id: 1, codigo_alumno: '20200001', nombres_apellidos: 'Juan Perez',
  facultad: 'FIC', dni: '12345671',
};

const mockServicio = { id: 1, nombre: 'ALMUERZO' };

const mockTurno = {
  id: 1, hora_inicio: '14:00', duracion_minutos: 30, servicio_id: 1, servicio: mockServicio,
};

function makeTicket(overrides: object = {}) {
  return {
    id: 1,
    alumno_id: 1,
    codigo_ticket: 'abc-uuid-1234',
    estado: 'ACTIVO',
    timestamp_expiracion: new Date(Date.now() + 2 * 3600 * 1000), // 2h future
    fecha: new Date(),
    turno_id: 1,
    alumno: mockAlumno,
    turno: mockTurno,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  signMock.mockResolvedValue('access-token-jwt');
});

describe('loginOperador', () => {
  it('retorna accessToken con credenciales correctas', async () => {
    repoMock.findOperadorByUsername.mockResolvedValue(mockOperador);
    verifyPinMock.mockResolvedValue(true);

    const result = await service.loginOperador({ username: 'op01', password: 'pass' }, '127.0.0.1');

    expect(result.accessToken).toBe('access-token-jwt');
    expect(result.operador.username).toBe('op01');
    expect(signMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'OPERADOR', codigo_alumno: 'op01' }),
      expect.anything(),
    );
  });

  it('lanza AUTH_CREDENCIALES_INVALIDAS si operador no existe', async () => {
    repoMock.findOperadorByUsername.mockResolvedValue(null);

    await expect(service.loginOperador({ username: 'bad', password: 'pass' }, '127.0.0.1'))
      .rejects.toMatchObject({ code: 'AUTH_CREDENCIALES_INVALIDAS' });
  });

  it('lanza AUTH_CREDENCIALES_INVALIDAS si operador inactivo', async () => {
    repoMock.findOperadorByUsername.mockResolvedValue({ ...mockOperador, activo: false });
    verifyPinMock.mockResolvedValue(true);

    await expect(service.loginOperador({ username: 'op01', password: 'pass' }, '127.0.0.1'))
      .rejects.toMatchObject({ code: 'AUTH_CREDENCIALES_INVALIDAS' });
  });

  it('lanza AUTH_CREDENCIALES_INVALIDAS con contraseña incorrecta', async () => {
    repoMock.findOperadorByUsername.mockResolvedValue(mockOperador);
    verifyPinMock.mockResolvedValue(false);

    await expect(service.loginOperador({ username: 'op01', password: 'wrong' }, '127.0.0.1'))
      .rejects.toMatchObject({ code: 'AUTH_CREDENCIALES_INVALIDAS' });
  });
});

describe('validarTicket', () => {
  it('valida ticket por codigo_ticket y retorna datos del alumno', async () => {
    const ticket = makeTicket();
    repoMock.findTicketByCodigo.mockResolvedValue(ticket);
    repoMock.marcarTicketConsumido.mockResolvedValue({ ...ticket, estado: 'CONSUMIDO' });
    repoMock.createLogAcceso.mockResolvedValue({});

    const result = await service.validarTicket({ codigo_ticket: 'abc-uuid-1234' }, 1, '127.0.0.1');

    expect(result.ticket.estado).toBe('CONSUMIDO');
    expect(result.alumno.codigo_alumno).toBe('20200001');
    expect(repoMock.marcarTicketConsumido).toHaveBeenCalledWith(1);
    expect(repoMock.createLogAcceso).toHaveBeenCalled();
  });

  it('valida ticket por codigo_alumno', async () => {
    const ticket = makeTicket();
    repoMock.findAlumnoByCodigoOrDni.mockResolvedValue(mockAlumno);
    repoMock.findTicketActivoByAlumno.mockResolvedValue(ticket);
    repoMock.marcarTicketConsumido.mockResolvedValue({ ...ticket, estado: 'CONSUMIDO' });
    repoMock.createLogAcceso.mockResolvedValue({});

    const result = await service.validarTicket({ codigo_alumno: '20200001' }, 1, '127.0.0.1');

    expect(result.ticket.estado).toBe('CONSUMIDO');
    expect(repoMock.findAlumnoByCodigoOrDni).toHaveBeenCalledWith('20200001');
  });

  it('lanza TICKET_NO_ENCONTRADO si ticket no existe', async () => {
    repoMock.findTicketByCodigo.mockResolvedValue(null);

    await expect(service.validarTicket({ codigo_ticket: 'nope-uuid' }, 1, '127.0.0.1'))
      .rejects.toMatchObject({ code: 'TICKET_NO_ENCONTRADO' });
  });

  it('lanza TICKET_EXPIRADO si ticket no está ACTIVO', async () => {
    repoMock.findTicketByCodigo.mockResolvedValue(makeTicket({ estado: 'CONSUMIDO' }));

    await expect(service.validarTicket({ codigo_ticket: 'abc' }, 1, '127.0.0.1'))
      .rejects.toMatchObject({ code: 'TICKET_EXPIRADO' });
  });

  it('lanza TICKET_EXPIRADO si timestamp_expiracion pasó', async () => {
    const ticket = makeTicket({ timestamp_expiracion: new Date(Date.now() - 1000) });
    repoMock.findTicketByCodigo.mockResolvedValue(ticket);

    await expect(service.validarTicket({ codigo_ticket: 'abc' }, 1, '127.0.0.1'))
      .rejects.toMatchObject({ code: 'TICKET_EXPIRADO' });
  });

  it('lanza TICKET_NO_ENCONTRADO si alumno no existe', async () => {
    repoMock.findAlumnoByCodigoOrDni.mockResolvedValue(null);

    await expect(service.validarTicket({ codigo_alumno: '99999999' }, 1, '127.0.0.1'))
      .rejects.toMatchObject({ code: 'TICKET_NO_ENCONTRADO' });
  });
});
