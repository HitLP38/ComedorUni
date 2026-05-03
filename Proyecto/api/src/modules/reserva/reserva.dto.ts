export interface TurnoPublico {
  id: number;
  hora_inicio: string;
  cupo_disponible: number;
  estado: string;
}

export interface HoldResponse {
  hold_id: string;
  ttl_segundos: number;
}

export interface TicketPublico {
  id: number;
  codigo_ticket: string;
  fecha: string;
  hora_inicio: string;
  qr_data: string;
  estado: string;
}
