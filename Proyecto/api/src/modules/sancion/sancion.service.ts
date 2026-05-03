import {
  NO_SHOW_VENTANA_DIAS,
  NO_SHOW_ADVERTENCIA,
  NO_SHOW_SUSPENSION_7D,
  NO_SHOW_SUSPENSION_MANUAL,
} from '../../config/constants.js';
import * as repo from './sancion.repository.js';

export async function evaluarAlumno(alumnoId: number, ticketId?: number): Promise<void> {
  const desde = new Date();
  desde.setDate(desde.getDate() - NO_SHOW_VENTANA_DIAS);

  const noShows = await repo.countNoShowsVentana(alumnoId, desde);

  if (noShows >= NO_SHOW_SUSPENSION_MANUAL) {
    const existente = await repo.findSancionActiva(alumnoId, 'SUSPENSION_MANUAL');
    if (!existente) {
      await repo.createSancion({
        alumno_id: alumnoId,
        tipo: 'SUSPENSION_MANUAL',
        ticket_id: ticketId,
        razon: `${noShows} inasistencias en los últimos ${NO_SHOW_VENTANA_DIAS} días. Requiere revisión manual.`,
      });
      await repo.updateAlumnoEstado(alumnoId, 'SUSPENDIDO_MANUAL');
      await repo.createLogSancion({
        alumno_id: alumnoId,
        tipo_evento: 'SANCION_APLICADA',
        ip_origen: 'system',
        detalles_json: JSON.stringify({ tipo: 'SUSPENSION_MANUAL', no_shows: noShows }),
      });
    }
  } else if (noShows >= NO_SHOW_SUSPENSION_7D) {
    const existente = await repo.findSancionActiva(alumnoId, 'SUSPENSION_7D');
    if (!existente) {
      const levantamiento = new Date();
      levantamiento.setDate(levantamiento.getDate() + 7);
      await repo.createSancion({
        alumno_id: alumnoId,
        tipo: 'SUSPENSION_7D',
        ticket_id: ticketId,
        fecha_levantamiento: levantamiento,
        razon: `${noShows} inasistencias en los últimos ${NO_SHOW_VENTANA_DIAS} días.`,
      });
      await repo.updateAlumnoEstado(alumnoId, 'SUSPENDIDO_7D', levantamiento);
      await repo.createLogSancion({
        alumno_id: alumnoId,
        tipo_evento: 'SANCION_APLICADA',
        ip_origen: 'system',
        detalles_json: JSON.stringify({ tipo: 'SUSPENSION_7D', no_shows: noShows }),
      });
    }
  } else if (noShows >= NO_SHOW_ADVERTENCIA) {
    const existente = await repo.findSancionActiva(alumnoId, 'ADVERTENCIA');
    if (!existente) {
      await repo.createSancion({
        alumno_id: alumnoId,
        tipo: 'ADVERTENCIA',
        ticket_id: ticketId,
        razon: `${noShows} inasistencias en los últimos ${NO_SHOW_VENTANA_DIAS} días.`,
      });
      await repo.createLogSancion({
        alumno_id: alumnoId,
        tipo_evento: 'SANCION_APLICADA',
        ip_origen: 'system',
        detalles_json: JSON.stringify({ tipo: 'ADVERTENCIA', no_shows: noShows }),
      });
    }
  }
}

export async function procesarCierreServicio(fechaServicio: Date, servicioId: number): Promise<number> {
  const tickets = await repo.findTicketsNoShowPorCerrar(fechaServicio, servicioId);
  let count = 0;

  for (const ticket of tickets) {
    await repo.marcarNoShow(ticket.id);
    await repo.incrementarInasistencias(ticket.alumno_id);
    await evaluarAlumno(ticket.alumno_id, ticket.id);
    count++;
  }

  return count;
}

export async function levantarSuspensionesVencidas(): Promise<number> {
  const sanciones = await repo.findSancionesPendientesLevantar();
  let count = 0;

  for (const sancion of sanciones) {
    await repo.resolveSancion(sancion.id);
    await repo.updateAlumnoEstado(sancion.alumno_id, 'ACTIVO');
    count++;
  }

  return count;
}

export async function anularSancion(sancionId: number, justificacion: string): Promise<void> {
  const { prisma } = await import('../../lib/prisma.js');
  const sancion = await prisma.sancion.findUnique({ where: { id: sancionId }, include: { alumno: true } });
  if (!sancion) throw new Error('Sanción no encontrada');

  await repo.resolveSancion(sancionId);
  await repo.updateAlumnoEstado(sancion.alumno_id, 'ACTIVO');
  await repo.createLogSancion({
    alumno_id: sancion.alumno_id,
    tipo_evento: 'SANCION_APLICADA',
    ip_origen: 'admin',
    detalles_json: JSON.stringify({ accion: 'ANULACION', justificacion }),
  });
}
