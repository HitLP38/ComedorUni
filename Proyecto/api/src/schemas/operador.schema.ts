import { z } from 'zod';

export const operadorLoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export const validarTicketSchema = z.object({
  codigo_ticket: z.string().uuid().optional(),
  codigo_alumno: z.string().length(8).optional(),
  dni: z.string().length(8).optional(),
}).refine(
  (d) => d.codigo_ticket || d.codigo_alumno || d.dni,
  { message: 'Debes proveer codigo_ticket, codigo_alumno o dni' },
);

export type OperadorLoginInput = z.infer<typeof operadorLoginSchema>;
export type ValidarTicketInput = z.infer<typeof validarTicketSchema>;
