import { z } from 'zod';

export const loginOperadorSchema = z.object({
  usuario: z.string().min(1),
  password: z.string().min(1),
});

export const validarTicketSchema = z.union([
  z.object({ codigo_ticket: z.string().uuid() }),
  z.object({ codigo_alumno: z.string().regex(/^\d{8}$/) }),
  z.object({ dni: z.string().regex(/^\d{8}$/) }),
]);

export const patchServicioSchema = z.object({
  hora_apertura_reserva: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  hora_cierre_reserva: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  activo: z.boolean().optional(),
});

export const patchTurnoSchema = z.object({
  cupo_maximo: z.coerce.number().int().min(1).optional(),
  estado: z.enum(['ABIERTO', 'CERRADO', 'COMPLETO']).optional(),
});

export const alumnosQuerySchema = z.object({
  estado: z.enum(['ACTIVO', 'SUSPENDIDO_7D', 'SUSPENDIDO_MANUAL']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const anularSancionSchema = z.object({
  justificacion: z.string().min(10),
});

export const reportesQuerySchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type LoginOperadorInput = z.infer<typeof loginOperadorSchema>;
export type ValidarTicketInput = z.infer<typeof validarTicketSchema>;
