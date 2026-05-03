import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./sancion.repository.js', () => ({
  countNoShowsVentana: vi.fn(),
  findSancionActiva: vi.fn(),
  createSancion: vi.fn(),
  updateAlumnoEstado: vi.fn(),
  createLogSancion: vi.fn(),
  findTicketsNoShowPorCerrar: vi.fn(),
  marcarNoShow: vi.fn(),
  incrementarInasistencias: vi.fn(),
  findSancionesPendientesLevantar: vi.fn(),
  resolveSancion: vi.fn(),
}));

import * as repo from './sancion.repository.js';
import {
  evaluarAlumno,
  procesarCierreServicio,
  levantarSuspensionesVencidas,
} from './sancion.service.js';

const repoMock = repo as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
  repoMock.createSancion.mockResolvedValue({});
  repoMock.updateAlumnoEstado.mockResolvedValue({});
  repoMock.createLogSancion.mockResolvedValue({});
  repoMock.marcarNoShow.mockResolvedValue({});
  repoMock.incrementarInasistencias.mockResolvedValue({});
  repoMock.resolveSancion.mockResolvedValue({});
  repoMock.findSancionActiva.mockResolvedValue(null);
});

describe('evaluarAlumno', () => {
  it('no hace nada con 1 no-show (bajo umbral)', async () => {
    repoMock.countNoShowsVentana.mockResolvedValue(1);

    await evaluarAlumno(1);

    expect(repoMock.createSancion).not.toHaveBeenCalled();
    expect(repoMock.updateAlumnoEstado).not.toHaveBeenCalled();
  });

  it('crea ADVERTENCIA con 2 no-shows', async () => {
    repoMock.countNoShowsVentana.mockResolvedValue(2);

    await evaluarAlumno(1);

    expect(repoMock.createSancion).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'ADVERTENCIA', alumno_id: 1 }),
    );
    expect(repoMock.updateAlumnoEstado).not.toHaveBeenCalled();
  });

  it('crea SUSPENSION_7D con 3 no-shows', async () => {
    repoMock.countNoShowsVentana.mockResolvedValue(3);

    await evaluarAlumno(1, 42);

    expect(repoMock.createSancion).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'SUSPENSION_7D', alumno_id: 1, ticket_id: 42 }),
    );
    expect(repoMock.updateAlumnoEstado).toHaveBeenCalledWith(1, 'SUSPENDIDO_7D', expect.any(Date));
  });

  it('crea SUSPENSION_MANUAL con 5 no-shows', async () => {
    repoMock.countNoShowsVentana.mockResolvedValue(5);

    await evaluarAlumno(1);

    expect(repoMock.createSancion).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'SUSPENSION_MANUAL', alumno_id: 1 }),
    );
    expect(repoMock.updateAlumnoEstado).toHaveBeenCalledWith(1, 'SUSPENDIDO_MANUAL');
  });

  it('no duplica sanción si ya existe SUSPENSION_7D activa', async () => {
    repoMock.countNoShowsVentana.mockResolvedValue(3);
    repoMock.findSancionActiva.mockResolvedValue({ id: 99 }); // ya existe

    await evaluarAlumno(1);

    expect(repoMock.createSancion).not.toHaveBeenCalled();
  });

  it('prioriza SUSPENSION_MANUAL sobre SUSPENSION_7D con 5+ no-shows', async () => {
    repoMock.countNoShowsVentana.mockResolvedValue(6);

    await evaluarAlumno(1);

    const call = repoMock.createSancion.mock.calls[0][0];
    expect(call.tipo).toBe('SUSPENSION_MANUAL');
  });
});

describe('procesarCierreServicio', () => {
  it('marca no-show y evalúa cada ticket ACTIVO sin consumir', async () => {
    const tickets = [
      { id: 10, alumno_id: 1, turno: { servicio_id: 1 } },
      { id: 11, alumno_id: 2, turno: { servicio_id: 1 } },
    ];
    repoMock.findTicketsNoShowPorCerrar.mockResolvedValue(tickets);
    repoMock.countNoShowsVentana.mockResolvedValue(1); // below threshold

    const count = await procesarCierreServicio(new Date(), 1);

    expect(count).toBe(2);
    expect(repoMock.marcarNoShow).toHaveBeenCalledTimes(2);
    expect(repoMock.incrementarInasistencias).toHaveBeenCalledTimes(2);
  });

  it('retorna 0 si no hay tickets sin consumir', async () => {
    repoMock.findTicketsNoShowPorCerrar.mockResolvedValue([]);

    const count = await procesarCierreServicio(new Date(), 1);

    expect(count).toBe(0);
  });
});

describe('levantarSuspensionesVencidas', () => {
  it('levanta suspensiones vencidas y reactiva alumnos', async () => {
    repoMock.findSancionesPendientesLevantar.mockResolvedValue([
      { id: 1, alumno_id: 10, alumno: { id: 10 } },
      { id: 2, alumno_id: 20, alumno: { id: 20 } },
    ]);

    const count = await levantarSuspensionesVencidas();

    expect(count).toBe(2);
    expect(repoMock.resolveSancion).toHaveBeenCalledTimes(2);
    expect(repoMock.updateAlumnoEstado).toHaveBeenCalledWith(10, 'ACTIVO');
    expect(repoMock.updateAlumnoEstado).toHaveBeenCalledWith(20, 'ACTIVO');
  });

  it('retorna 0 si no hay suspensiones vencidas', async () => {
    repoMock.findSancionesPendientesLevantar.mockResolvedValue([]);

    const count = await levantarSuspensionesVencidas();

    expect(count).toBe(0);
  });
});
