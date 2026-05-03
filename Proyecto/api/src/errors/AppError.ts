export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined && { details: this.details }),
      },
    };
  }
}

export const Errors = {
  AUTH_DNI_INVALIDO: () => new AppError('AUTH_DNI_INVALIDO', 'El DNI ingresado no es válido.', 400),
  AUTH_CORREO_NO_UNI: () => new AppError('AUTH_CORREO_NO_UNI', 'El correo debe tener formato n1.A1.A2@uni.pe.', 400),
  AUTH_ALUMNO_DUPLICADO: (campo: string) => new AppError('AUTH_ALUMNO_DUPLICADO', `Ya existe una cuenta con ese ${campo}.`, 409),
  AUTH_TOKEN_EXPIRADO: () => new AppError('AUTH_TOKEN_EXPIRADO', 'El enlace ha expirado.', 410),
  AUTH_TOKEN_INVALIDO: () => new AppError('AUTH_TOKEN_INVALIDO', 'El token no es válido.', 400),
  AUTH_CREDENCIALES_INVALIDAS: () => new AppError('AUTH_CREDENCIALES_INVALIDAS', 'DNI o PIN incorrecto.', 401),
  AUTH_OTP_EXPIRADO: () => new AppError('AUTH_OTP_EXPIRADO', 'El código OTP ha expirado.', 410),
  AUTH_OTP_INVALIDO: () => new AppError('AUTH_OTP_INVALIDO', 'Código OTP incorrecto.', 401),
  AUTH_OTP_BLOQUEADO: () => new AppError('AUTH_OTP_BLOQUEADO', 'Demasiados intentos fallidos. Vuelve a iniciar sesión.', 429),
  AUTH_NO_VERIFICADO: () => new AppError('AUTH_NO_VERIFICADO', 'Debes verificar tu correo UNI primero.', 403),
  AUTH_SUSPENDIDO: (hasta?: string) => new AppError('AUTH_SUSPENDIDO', `Tu cuenta está suspendida${hasta ? ` hasta el ${hasta}` : ''}.`, 403),
  AUTH_PIN_DEBIL: () => new AppError('AUTH_PIN_DEBIL', 'El PIN no puede ser consecutivo ni repetido.', 400),
  AUTH_YA_EN_COLA: () => new AppError('AUTH_YA_EN_COLA', 'Ya estás en la cola para este servicio.', 409),
  TICKET_NO_ENCONTRADO: () => new AppError('TICKET_NO_ENCONTRADO', 'Ticket no encontrado.', 404),
  TICKET_FUERA_DE_VENTANA: () => new AppError('TICKET_FUERA_DE_VENTANA', 'El ticket no corresponde a la ventana de tiempo actual.', 422),
  TICKET_YA_CONSUMIDO: () => new AppError('TICKET_YA_CONSUMIDO', 'Este ticket ya fue validado.', 409),
  TICKET_EXPIRADO: () => new AppError('TICKET_EXPIRADO', 'El ticket ha expirado.', 410),
  TICKET_CANCELACION_TARDÍA: () => new AppError('TICKET_CANCELACION_TARDIA', 'Solo puedes cancelar hasta 30 minutos antes del turno.', 422),
  TURNO_SIN_CUPO: () => new AppError('TURNO_SIN_CUPO', 'No hay cupo disponible en este turno.', 409),
  HOLD_EXPIRADO: () => new AppError('HOLD_EXPIRADO', 'El tiempo de reserva expiró. Selecciona el turno nuevamente.', 410),
  TOKEN_RESERVA_INVALIDO: () => new AppError('TOKEN_RESERVA_INVALIDO', 'El token de reserva no es válido o ya fue usado.', 401),
  NO_AUTORIZADO: () => new AppError('NO_AUTORIZADO', 'No tienes permiso para realizar esta acción.', 403),
  NO_AUTENTICADO: () => new AppError('NO_AUTENTICADO', 'Debes iniciar sesión.', 401),
  SERVICIO_CERRADO: () => new AppError('SERVICIO_CERRADO', 'Las reservas para este servicio están cerradas.', 422),
  RESERVA_DUPLICADA: () => new AppError('RESERVA_DUPLICADA', 'Ya tienes una reserva para este servicio hoy.', 409),
};
