import { z } from 'zod';

export const entrarColaSchema = z.object({
  servicio: z.enum(['ALMUERZO', 'CENA']),
});

export const salirColaSchema = z.object({
  token_cola: z.string().uuid(),
});

export const posicionColaSchema = z.object({
  token_cola: z.string().uuid(),
});

export const holdSchema = z.object({
  token_reserva: z.string().uuid(),
  turno_id: z.coerce.number().int().positive(),
});

export const confirmarReservaSchema = z.object({
  token_reserva: z.string().uuid(),
  turno_id: z.coerce.number().int().positive(),
});

export const turnosQuerySchema = z.object({
  servicio: z.enum(['ALMUERZO', 'CENA']),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const cancelarReservaSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type EntrarColaInput = z.infer<typeof entrarColaSchema>;
export type HoldInput = z.infer<typeof holdSchema>;
export type ConfirmarReservaInput = z.infer<typeof confirmarReservaSchema>;
