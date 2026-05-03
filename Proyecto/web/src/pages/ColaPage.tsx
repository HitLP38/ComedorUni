import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { entrarCola, salirCola } from '../api/cola.js';
import { getApiError } from '../api/client.js';

const WS_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace('http', 'ws');

export function ColaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const servicio = params.get('servicio') ?? 'ALMUERZO';
  const fecha = params.get('fecha') ?? new Date().toISOString().slice(0, 10);

  const [tokenCola, setTokenCola] = useState<string | null>(null);
  const [posicion, setPosicion] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let mounted = true;

    async function joinQueue() {
      try {
        const data = await entrarCola(servicio, fecha);
        if (!mounted) return;
        setTokenCola(data.token_cola);
        setPosicion(data.posicion);
        setTotal(data.total);
        setLoading(false);

        const token = localStorage.getItem('accessToken');
        const ws = new WebSocket(`${WS_URL}/ws/cola?token=${token}&token_cola=${data.token_cola}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'posicion') {
              setPosicion(msg.posicion);
              setTotal(msg.total);
            } else if (msg.type === 'tu_turno') {
              sessionStorage.setItem('token_reserva', msg.token_reserva);
              navigate(`/turnos?servicio=${servicio}&fecha=${fecha}`);
            }
          } catch { /* ignore */ }
        };
      } catch (err) {
        if (mounted) setError(getApiError(err));
        setLoading(false);
      }
    }

    joinQueue();
    return () => {
      mounted = false;
      wsRef.current?.close();
    };
  }, [servicio, fecha, navigate]);

  async function handleLeave() {
    if (!tokenCola) { navigate('/home'); return; }
    try {
      wsRef.current?.close();
      await salirCola(tokenCola);
    } catch { /* ignore */ }
    navigate('/home');
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Entrando a la cola…</p></div>;
  if (error) return (
    <div className="page-container">
      <div className="error-card">
        <p>{error}</p>
        <button onClick={() => navigate('/home')} className="btn-primary">Volver</button>
      </div>
    </div>
  );

  return (
    <div className="page-container cola-page">
      <h1>🎫 Cola Virtual — {servicio}</h1>
      <p className="fecha-display">{fecha}</p>

      <div className="posicion-card">
        <div className="posicion-number">{posicion}</div>
        <p>tu posición en la cola</p>
        <p className="total-hint">Total en espera: <strong>{total}</strong></p>
      </div>

      <p className="hint cola-hint">
        Mantén esta pantalla abierta. Se te notificará cuando sea tu turno.
      </p>

      <button onClick={handleLeave} className="btn-secondary">
        Salir de la cola
      </button>
    </div>
  );
}
