import { z } from 'zod';
import { FACULTADES_UNI } from '../config/constants.js';
import { isPinDebil } from '../lib/crypto.js';

export const registroSchema = z.object({
  codigo_alumno: z.string().regex(/^\d{8}$/, 'Debe tener exactamente 8 dígitos.'),
  dni: z.string().regex(/^\d{8}$/, 'Debe tener exactamente 8 dígitos.'),
  nombres_apellidos: z.string().min(3).max(255),
  correo_uni: z
    .string()
    .regex(/^[a-z]\.[a-z]+\.[a-z]+@uni\.pe$/, 'Formato inválido. Usa n1.A1.A2@uni.pe.'),
  facultad: z.enum(FACULTADES_UNI),
  pin: z
    .string()
    .regex(/^\d{6}$/, 'El PIN debe tener 6 dígitos numéricos.')
    .refine((p) => !isPinDebil(p), 'El PIN no puede ser consecutivo ni repetido.'),
});

export const verificarCorreoSchema = z.object({ token: z.string().uuid() });

export const loginSchema = z.object({
  dni: z.string().regex(/^\d{8}$/),
  pin: z.string().regex(/^\d{6}$/),
});

export const verificarOtpSchema = z.object({
  challenge_id: z.coerce.number().int().positive(),
  codigo: z.string().regex(/^\d{6}$/),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export const cambiarPinSchema = z.object({
  pin_actual: z.string().regex(/^\d{6}$/),
  pin_nuevo: z
    .string()
    .regex(/^\d{6}$/, 'El PIN debe tener 6 dígitos numéricos.')
    .refine((p) => !isPinDebil(p), 'El PIN no puede ser consecutivo ni repetido.'),
});

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerificarOtpInput = z.infer<typeof verificarOtpSchema>;
export type CambiarPinInput = z.infer<typeof cambiarPinSchema>;
