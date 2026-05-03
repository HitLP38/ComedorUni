import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { logout } from '../api/auth.js';

export function HomePage() {
  const navigate = useNavigate();
  const { codigoAlumno, clearAuth } = useAuthStore();

  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const servicio = hour < 14 ? 'ALMUERZO' : 'CENA';
  const fecha = new Date().toISOString().slice(0, 10);

  async function handleLogout() {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>🍽️ RanchUNI</h1>
        <div className="header-user">
          <span>Código: {codigoAlumno}</span>
          <button onClick={handleLogout} className="btn-logout">Salir</button>
        </div>
      </header>

      <main className="home-main">
        <p className="date-display">{today}</p>

        <div className="service-card">
          <h2>Servicio actual: <strong>{servicio}</strong></h2>
          <div className="action-buttons">
            <button
              className="btn-primary btn-large"
              onClick={() => navigate(`/cola?servicio=${servicio}&fecha=${fecha}`)}
            >
              🎫 Unirme a la Cola
            </button>
            <button
              className="btn-secondary btn-large"
              onClick={() => navigate('/mis-reservas')}
            >
              📋 Mis Reservas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
