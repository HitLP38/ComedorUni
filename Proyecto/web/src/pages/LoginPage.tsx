import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, verificarOtp } from '../api/auth.js';
import { useAuthStore } from '../store/authStore.js';
import { getApiError } from '../api/client.js';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(dni, pin);
      setChallengeId(data.challenge_id);
      setStep('otp');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeId) return;
    setError('');
    setLoading(true);
    try {
      const data = await verificarOtp(challengeId, otp);
      setAuth(data.accessToken, data.alumno.id, data.alumno.codigo_alumno);
      navigate('/home');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🍽️ RanchUNI</h1>
        <p className="auth-subtitle">Sistema de Turnos de Comedor</p>

        {step === 'credentials' ? (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Iniciar Sesión</h2>
            <div className="form-group">
              <label>DNI</label>
              <input
                type="text" maxLength={8} value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="12345678" required
              />
            </div>
            <div className="form-group">
              <label>PIN (6 dígitos)</label>
              <input
                type="password" maxLength={6} value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••" required
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
            <p className="auth-link">¿No tienes cuenta? <a href="/registro">Regístrate</a></p>
          </form>
        ) : (
          <form onSubmit={handleOtp} className="auth-form">
            <h2>Verificación OTP</h2>
            <p className="hint">Revisa tu correo UNI (@uni.pe). El código expira en 5 minutos.</p>
            <div className="form-group">
              <label>Código de 6 dígitos</label>
              <input
                type="text" maxLength={6} value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" required autoFocus
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
            <button type="button" onClick={() => setStep('credentials')} className="btn-secondary">
              ← Volver
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
