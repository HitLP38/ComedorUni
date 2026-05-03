import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validarTicket, getTurnoActual } from '../api/operador.js';
import { useAuthStore } from '../store/authStore.js';
import { getApiError } from '../api/client.js';

type ValidationResult = {
  alumno: { codigo_alumno: string; nombres_apellidos: string; facultad: string };
  ticket: { id: number; codigo_ticket: string; servicio: string; hora_inicio: string; fecha: string; estado: string };
};

export function OperadorDashboardPage() {
  const navigate = useNavigate();
  const { codigoAlumno, clearAuth } = useAuthStore();

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'ticket' | 'alumno' | 'dni'>('ticket');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');
  const [turnoActual, setTurnoActual] = useState<Array<{ hora_inicio: string; servicio: { nombre: string }; cupo_actual: number; cupo_maximo: number }>>([]);

  useEffect(() => {
    getTurnoActual().then(setTurnoActual).catch(() => {});
    const timer = setInterval(() => getTurnoActual().then(setTurnoActual).catch(() => {}), 30_000);
    return () => clearInterval(timer);
  }, []);

  async function handleValidar(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await validarTicket({
        [mode === 'ticket' ? 'codigo_ticket' : mode === 'alumno' ? 'codigo_alumno' : 'dni']: input.trim(),
      });
      setResult(data);
      setInput('');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate('/operador/login');
  }

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <header className="page-header">
        <h1>🏪 Dashboard Operador</h1>
        <div className="header-user">
          <span>{codigoAlumno}</span>
          <button onClick={handleLogout} className="btn-logout">Salir</button>
        </div>
      </header>

      {turnoActual.length > 0 && (
        <div className="turno-actual-card">
          <strong>Turno en curso:</strong>{' '}
          {turnoActual.map((t) => (
            <span key={t.hora_inicio} className="turno-tag">
              {t.servicio.nombre} {t.hora_inicio} ({t.cupo_actual}/{t.cupo_maximo})
            </span>
          ))}
        </div>
      )}

      <div className="validar-card">
        <h2>Validar Ticket</h2>
        <div className="mode-tabs">
          {(['ticket', 'alumno', 'dni'] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setInput(''); setError(''); setResult(null); }}
              className={`mode-tab ${mode === m ? 'active' : ''}`}>
              {m === 'ticket' ? '🎫 Código ticket' : m === 'alumno' ? '👤 Código alumno' : '🪪 DNI'}
            </button>
          ))}
        </div>
        <form onSubmit={handleValidar} className="validar-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'ticket' ? 'UUID del ticket (escanear o escribir)' :
              mode === 'alumno' ? '20XXXXXX' : '12345678'
            }
            autoFocus
            required
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '…' : 'Validar'}
          </button>
        </form>

        {error && (
          <div className="validacion-error">
            <span>❌ {error}</span>
          </div>
        )}

        {result && (
          <div className="validacion-ok">
            <div className="validacion-check">✅ ACCESO PERMITIDO</div>
            <div className="alumno-info">
              <strong>{result.alumno.nombres_apellidos}</strong>
              <span>{result.alumno.codigo_alumno} — {result.alumno.facultad}</span>
            </div>
            <div className="ticket-mini">
              {result.ticket.servicio} · {result.ticket.hora_inicio} · {result.ticket.fecha}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
