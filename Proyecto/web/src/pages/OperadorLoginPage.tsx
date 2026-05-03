import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginOperador } from '../api/operador.js';
import { useAuthStore } from '../store/authStore.js';
import { getApiError } from '../api/client.js';

export function OperadorLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginOperador(username, password);
      setAuth(data.accessToken, data.operador.id, data.operador.username);
      navigate('/operador/dashboard');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🏪 Operador</h1>
        <p className="auth-subtitle">RanchUNI — Comedor Universitario</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Usuario</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.875rem' }}>
            <a href="/admin/login" style={{ color: '#3182ce' }}>Acceso administrador</a>
          </p>
        </form>
      </div>
    </div>
  );
}
