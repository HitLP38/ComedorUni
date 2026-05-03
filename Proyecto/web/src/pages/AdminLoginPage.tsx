import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../api/admin.js';
import { useAuthStore } from '../store/authStore.js';
import { getApiError } from '../api/client.js';

export function AdminLoginPage() {
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
      const data = await loginAdmin(username, password);
      setAuth(data.accessToken, data.admin.id, data.admin.username);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">⚙️ Administrador</h1>
        <p className="auth-subtitle">RanchUNI — Panel de Control</p>
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
            {loading ? 'Ingresando…' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  );
}
