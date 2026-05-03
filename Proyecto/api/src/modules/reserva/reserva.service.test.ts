import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/redis.js', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    setEx: vi.fn(),
    del: vi.fn(),
    decr: vi.fn(),
    eval: vi.fn(),
  },
}));

vi.mock('./reserva.repository.js', () => ({
  findServicioByNombre: vi.fn(),
  findTurnosByServicioFecha: vi.fn(),
  findTurnoById: vi.fn(),
  findTicketActivo: vi.fn(),
  createTicket: vi.fn(),
  incrementarCupoActual: vi.fn(),
  decrementarCupoActual: vi.fn(),
  findTicketsByAlumno: vi.fn(),
  findTicketById: vi.fn(),
  updateTicketEstado: vi.fn(),
}));

vi.mock('../cola/cola.service.js', () => ({
  tokenReservaKey: (t: string) => `token_reserva:${t}`,
}));

vi.mock('../../lib/crypto.js', () => ({
  generateTicketCode: () => 'ticket-code-uuid-1234',
}));

import { redis } from '../../lib/redis.js';
import * as repo from './reserva.repository.js';
import * as service from './reserva.service.js';
import { AppError } from '../../errors/AppError.js';

const redisMock = redis as Record<string, ReturnType<typeof vi.fn>>;
const repoMock = repo as Record<string, ReturnType<typeof vi.fn>>;

const mockServicio = { id: 1, nombre: 'ALMUERZO' };
const mockTurno = {
  id: 1,
  servicio_id: 1,
  hora_inicio: '11:30',
  duracion_minutos: 30,
  cupo_maximo: 50,
  cupo_actual: 0,
  estado: 'ABIERTO',
  fecha: new Date('2026-05-03T00:00:00.000Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getTurnos', () => {
  it('retorna turnos con cupo_disponible calculado', async () => {
    repoMock.findServicioByNombre.mockResolvedValue(mockServicio);
    repoMock.findTurnosByServicioFecha.mockResolvedValue([mockTurno]);
    redisMock.get.mockResolvedValue('2'); // 2 holds activos

    const result = await service.getTurnos('ALMUERZO', '2026-05-03');

    expect(result).toHaveLength(1);
    expect(result[0]!.cupo_disponible).toBe(48); // 50 - 0 - 2
    expect(result[0]!.hora_inicio).toBe('11:30');
  });

  it('retorna cupo_disponible 0 cuando está lleno', async () => {
    const turnoLleno = { ...mockTurno, cupo_actual: 50 };
    repoMock.findServicioByNombre.mockResolvedValue(mockServicio);
    repoMock.findTurnosByServicioFecha.mockResolvedValue([turnoLleno]);
    redisMock.get.mockResolvedValue('0');

    const result = await service.getTurnos('ALMUERZO', '2026-05-03');

    expect(result[0]!.cupo_disponible).toBe(0);
  });

  it('lanza error si el servicio no existe', async () => {
    repoMock.findServicioByNombre.mockResolvedValue(null);

    await expect(service.getTurnos('INVALIDO', '2026-05-03')).rejects.toThrow(AppError);
  });
});

describe('holdCupo', () => {
  const TOKEN = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const alumnoId = 1;

  it('crea hold atómico y retorna ttl', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ alumno_id: alumnoId, servicio: 'ALMUERZO', fecha: '2026-05-03' }));
    repoMock.findTurnoById.mockResolvedValue(mockTurno);
    repoMock.findServicioByNombre.mockResolvedValue(mockServicio);
    redisMock.eval.mockResolvedValue(1n);

    const result = await service.holdCupo({ token_reserva: TOKEN, turno_id: 1 }, alumnoId);

    expect(result.hold_id).toBe('1:1');
    expect(result.ttl_segundos).toBeGreaterThan(0);
  });

  it('lanza TOKEN_RESERVA_INVALIDO si token no existe en Redis', async () => {
    redisMock.get.mockResolvedValue(null);

    await expect(service.holdCupo({ token_reserva: TOKEN, turno_id: 1 }, alumnoId))
      .rejects.toMatchObject({ code: 'TOKEN_RESERVA_INVALIDO' });
  });

  it('lanza TOKEN_RESERVA_INVALIDO si alumno_id no coincide', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ alumno_id: 999, servicio: 'ALMUERZO', fecha: '2026-05-03' }));
    repoMock.findTurnoById.mockResolvedValue(mockTurno);

    await expect(service.holdCupo({ token_reserva: TOKEN, turno_id: 1 }, alumnoId))
      .rejects.toMatchObject({ code: 'TOKEN_RESERVA_INVALIDO' });
  });

  it('lanza TURNO_SIN_CUPO cuando Lua retorna 0', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ alumno_id: alumnoId, servicio: 'ALMUERZO', fecha: '2026-05-03' }));
    repoMock.findTurnoById.mockResolvedValue(mockTurno);
    repoMock.findServicioByNombre.mockResolvedValue(mockServicio);
    redisMock.eval.mockResolvedValue(0n);

    await expect(service.holdCupo({ token_reserva: TOKEN, turno_id: 1 }, alumnoId))
      .rejects.toMatchObject({ code: 'TURNO_SIN_CUPO' });
  });
});

describe('confirmarReserva', () => {
  const TOKEN = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const alumnoId = 1;

  it('crea ticket y limpia hold y token', async () => {
    redisMock.get
      .mockResolvedValueOnce(JSON.stringify({ alumno_id: alumnoId, servicio: 'ALMUERZO', fecha: '2026-05-03' }))
      .mockResolvedValueOnce('1'); // holdExists
    repoMock.findTurnoById.mockResolvedValue(mockTurno);
    repoMock.findTicketActivo.mockResolvedValue(null);
    repoMock.createTicket.mockResolvedValue({ id: 1, codigo_ticket: 'ticket-code-uuid-1234', estado: 'ACTIVO' });
    repoMock.incrementarCupoActual.mockResolvedValue({});
    redisMock.del.mockResolvedValue(1);
    redisMock.decr.mockResolvedValue(0);

    const result = await service.confirmarReserva({ token_reserva: TOKEN, turno_id: 1 }, alumnoId);

    expect(result.ticket.codigo_ticket).toBe('ticket-code-uuid-1234');
    expect(result.ticket.estado).toBe('ACTIVO');
    expect(repoMock.incrementarCupoActual).toHaveBeenCalledWith(1);
  });

  it('lanza HOLD_EXPIRADO si no hay hold activo', async () => {
    redisMock.get
      .mockResolvedValueOnce(JSON.stringify({ alumno_id: alumnoId, servicio: 'ALMUERZO', fecha: '2026-05-03' }))
      .mockResolvedValueOnce(null); // holdExists = null

    repoMock.findTurnoById.mockResolvedValue(mockTurno);

    await expect(service.confirmarReserva({ token_reserva: TOKEN, turno_id: 1 }, alumnoId))
      .rejects.toMatchObject({ code: 'HOLD_EXPIRADO' });
  });

  it('lanza RESERVA_DUPLICADA si ya tiene ticket activo', async () => {
    redisMock.get
      .mockResolvedValueOnce(JSON.stringify({ alumno_id: alumnoId, servicio: 'ALMUERZO', fecha: '2026-05-03' }))
      .mockResolvedValueOnce('1');
    repoMock.findTurnoById.mockResolvedValue(mockTurno);
    repoMock.findTicketActivo.mockResolvedValue({ id: 99 }); // ya existe

    await expect(service.confirmarReserva({ token_reserva: TOKEN, turno_id: 1 }, alumnoId))
      .rejects.toMatchObject({ code: 'RESERVA_DUPLICADA' });
  });
});

describe('cancelarReserva', () => {
  it('lanza TICKET_NO_ENCONTRADO si no existe', async () => {
    repoMock.findTicketById.mockResolvedValue(null);

    await expect(service.cancelarReserva(999, 1))
      .rejects.toMatchObject({ code: 'TICKET_NO_ENCONTRADO' });
  });

  it('lanza NO_AUTORIZADO si el alumno no es dueño', async () => {
    repoMock.findTicketById.mockResolvedValue({
      id: 1, alumno_id: 2, estado: 'ACTIVO', turno_id: 1,
      fecha: new Date(), turno: { hora_inicio: '23:59' },
    });

    await expect(service.cancelarReserva(1, 1))
      .rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
  });

  it('lanza TICKET_CANCELACION_TARDIA si es menos de 30 min antes', async () => {
    const ahora = new Date();
    const inicio = new Date(ahora.getTime() + 10 * 60 * 1000); // 10 min en el futuro
    const hora = `${String(inicio.getUTCHours()).padStart(2,'0')}:${String(inicio.getUTCMinutes()).padStart(2,'0')}`;
    repoMock.findTicketById.mockResolvedValue({
      id: 1, alumno_id: 1, estado: 'ACTIVO', turno_id: 1,
      fecha: new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate())),
      turno: { hora_inicio: hora },
    });

    await expect(service.cancelarReserva(1, 1))
      .rejects.toMatchObject({ code: 'TICKET_CANCELACION_TARDIA' });
  });
});
