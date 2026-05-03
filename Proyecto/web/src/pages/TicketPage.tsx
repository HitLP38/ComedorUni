import { useLocation, useNavigate } from 'react-router-dom';
import type { Ticket } from '../api/reserva.js';

export function TicketPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { ticket: Ticket; servicio: string } | null };

  if (!state?.ticket) {
    return (
      <div className="page-container">
        <p>No se encontró información del ticket.</p>
        <button onClick={() => navigate('/mis-reservas')} className="btn-primary">Mis Reservas</button>
      </div>
    );
  }

  const { ticket, servicio } = state;

  return (
    <div className="page-container ticket-page">
      <div className="ticket-card">
        <div className="ticket-header">
          <h1>🎫 Tu Ticket</h1>
          <span className={`badge badge-${ticket.estado.toLowerCase()}`}>{ticket.estado}</span>
        </div>

        <div className="ticket-qr">
          <div className="qr-placeholder">
            <p className="qr-code-text">{ticket.codigo_ticket.toUpperCase()}</p>
            <p className="qr-hint">Muestra este código al operador</p>
          </div>
        </div>

        <div className="ticket-info">
          <div className="ticket-row">
            <span>Servicio</span>
            <strong>{servicio}</strong>
          </div>
          <div className="ticket-row">
            <span>Fecha</span>
            <strong>{ticket.fecha}</strong>
          </div>
          <div className="ticket-row">
            <span>Hora</span>
            <strong>{ticket.hora_inicio}</strong>
          </div>
        </div>

        <div className="ticket-actions">
          <button onClick={() => navigate('/mis-reservas')} className="btn-secondary">
            Ver mis reservas
          </button>
          <button onClick={() => navigate('/home')} className="btn-primary">
            Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
