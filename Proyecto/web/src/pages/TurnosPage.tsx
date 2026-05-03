import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTurnos, holdCupo, confirmarReserva, type Turno } from '../api/reserva.js';
import { getApiError } from '../api/client.js';

export function TurnosPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const servicio = params.get('servicio') ?? 'ALMUERZO';
  const fecha = params.get('fecha') ?? new Date().toISOString().slice(0, 10);
  const tokenReserva = sessionStorage.getItem('token_reserva') ?? '';

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<number | null>(null);
  const [holdTtl, setHoldTtl] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    getTurnos(servicio, fecha).then(setTurnos).catch((err) => setError(getApiError(err))).finally(() => setLoading(false));
  }, [servicio, fecha]);

  useEffect(() => {
    if (holdTtl <= 0) return;
    const timer = setInterval(() => setHoldTtl((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [holdTtl]);

  async function handleSelect(turnoId: number) {
    if (!tokenReserva) { setError('Token de reserva no encontrado. Vuelve a la cola.'); return; }
    setError('');
    setSelectedTurno(turnoId);
    try {
      const hold = await holdCupo(tokenReserva, turnoId);
      setHoldTtl(hold.ttl_segundos);
    } catch (err) {
      setError(getApiError(err));
      setSelectedTurno(null);
    }
  }

  async function handleConfirm() {
    if (!selectedTurno || !tokenReserva) return;
    setConfirming(true);
    setError('');
    try {
      const { ticket } = await confirmarReserva(tokenReserva, selectedTurno);
      sessionStorage.removeItem('token_reserva');
      navigate('/ticket', { state: { ticket, servicio } });
    } catch (err) {
      setError(getApiError(err));
      setConfirming(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Cargando turnos…</p></div>;

  return (
    <div className="page-container">
      <h1>⏰ Selecciona tu Turno</h1>
      <p className="fecha-display">{servicio} — {fecha}</p>

      {error && <p className="error-msg">{error}</p>}

      {!tokenReserva && (
        <div className="warning-card">
          <p>⚠️ Sin token de reserva. <button onClick={() => navigate('/home')} className="btn-link">Volver al inicio</button></p>
        </div>
      )}

      <div className="turnos-grid">
        {turnos.map((t) => (
          <button
            key={t.id}
            className={`turno-card ${selectedTurno === t.id ? 'selected' : ''} ${t.cupo_disponible === 0 ? 'full' : ''}`}
            onClick={() => t.cupo_disponible > 0 && !selectedTurno && handleSelect(t.id)}
            disabled={t.cupo_disponible === 0 || (selectedTurno !== null && selectedTurno !== t.id)}
          >
            <span className="turno-hora">{t.hora_inicio}</span>
            <span className="turno-cupo">{t.cupo_disponible > 0 ? `${t.cupo_disponible} lugares` : 'Sin cupo'}</span>
          </button>
        ))}
      </div>

      {selectedTurno && holdTtl > 0 && (
        <div className="hold-banner">
          <p>Turno reservado. Confirma en <strong>{holdTtl}s</strong></p>
          <button onClick={handleConfirm} disabled={confirming} className="btn-primary btn-large">
            {confirming ? 'Confirmando…' : '✓ Confirmar Reserva'}
          </button>
        </div>
      )}

      {selectedTurno && holdTtl === 0 && (
        <div className="warning-card">
          <p>⏰ El hold expiró. Selecciona otro turno.</p>
          <button onClick={() => setSelectedTurno(null)} className="btn-secondary">Intentar de nuevo</button>
        </div>
      )}
    </div>
  );
}
