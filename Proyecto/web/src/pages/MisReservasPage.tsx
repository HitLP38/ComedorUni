import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMisReservas, cancelarReserva, type Ticket } from '../api/reserva.js';
import { getApiError } from '../api/client.js';

const ESTADO_LABEL: Record<string, string> = {
  ACTIVO: '✅ Activo',
  CONSUMIDO: '✓ Consumido',
  CANCELADO: '✗ Cancelado',
  EXPIRADO: '⏰ Expirado',
  NO_SHOW: '⚠️ No asistió',
};

export function MisReservasPage() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState<number | null>(null);

  useEffect(() => {
    getMisReservas().then(setReservas).catch((err) => setError(getApiError(err))).finally(() => setLoading(false));
  }, []);

  async function handleCancel(id: number) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    setCanceling(id);
    try {
      await cancelarReserva(id);
      setReservas((prev) => prev.map((r) => r.id === id ? { ...r, estado: 'CANCELADO' } : r));
    } catch (err) {
      alert(getApiError(err));
    } finally {
      setCanceling(null);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Cargando…</p></div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/home')} className="btn-back">← Volver</button>
        <h1>📋 Mis Reservas</h1>
      </header>

      {error && <p className="error-msg">{error}</p>}

      {reservas.length === 0 ? (
        <div className="empty-state">
          <p>No tienes reservas recientes.</p>
          <button onClick={() => navigate('/home')} className="btn-primary">Hacer una reserva</button>
        </div>
      ) : (
        <ul className="reservas-list">
          {reservas.map((r) => (
            <li key={r.id} className={`reserva-item estado-${r.estado.toLowerCase()}`}>
              <div className="reserva-info">
                <strong>{r.fecha}</strong> — {r.hora_inicio}
                <br />
                <span className="reserva-servicio">{(r as unknown as { servicio: string }).servicio}</span>
                <br />
                <span className={`estado-badge estado-${r.estado.toLowerCase()}`}>
                  {ESTADO_LABEL[r.estado] ?? r.estado}
                </span>
              </div>
              <div className="reserva-actions">
                {r.estado === 'ACTIVO' && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={canceling === r.id}
                    className="btn-danger"
                  >
                    {canceling === r.id ? '…' : 'Cancelar'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
