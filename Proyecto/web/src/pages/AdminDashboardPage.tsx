import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlumnos, getSanciones, anularSancion, getReportesUso } from '../api/admin.js';
import { useAuthStore } from '../store/authStore.js';
import { getApiError } from '../api/client.js';

type Tab = 'alumnos' | 'sanciones' | 'reportes';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { codigoAlumno, clearAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>('alumnos');

  const [alumnos, setAlumnos] = useState<Array<{ id: number; codigo_alumno: string; nombres_apellidos: string; estado: string; facultad: string }>>([]);
  const [alumnosTotal, setAlumnosTotal] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [alumnosLoading, setAlumnosLoading] = useState(false);

  const [sanciones, setSanciones] = useState<Array<{ id: number; tipo: string; alumno: { codigo_alumno: string; nombres_apellidos: string }; fecha_aplicacion: string; resuelta: boolean }>>([]);
  const [sancionesLoading, setSancionesLoading] = useState(false);

  const [reporte, setReporte] = useState<{ tickets: Array<{ estado: string; _count: { id: number } }>; no_shows: number; sanciones: number } | null>(null);
  const [desde, setDesde] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));

  const [error, setError] = useState('');

  useEffect(() => {
    if (tab === 'alumnos') loadAlumnos();
    else if (tab === 'sanciones') loadSanciones();
    else if (tab === 'reportes') loadReporte();
  }, [tab]);

  async function loadAlumnos() {
    setAlumnosLoading(true);
    try {
      const data = await getAlumnos(1, 20, searchQ || undefined, estadoFiltro || undefined);
      setAlumnos(data.alumnos);
      setAlumnosTotal(data.total);
    } catch (err) { setError(getApiError(err)); }
    finally { setAlumnosLoading(false); }
  }

  async function loadSanciones() {
    setSancionesLoading(true);
    try {
      const data = await getSanciones(false);
      setSanciones(data);
    } catch (err) { setError(getApiError(err)); }
    finally { setSancionesLoading(false); }
  }

  async function loadReporte() {
    try {
      const data = await getReportesUso(desde, hasta);
      setReporte(data);
    } catch (err) { setError(getApiError(err)); }
  }

  async function handleAnular(id: number) {
    const just = prompt('Justificación (mín. 10 caracteres):');
    if (!just || just.length < 10) return;
    try {
      await anularSancion(id, just);
      setSanciones((prev) => prev.filter((s) => s.id !== id));
    } catch (err) { alert(getApiError(err)); }
  }

  function handleLogout() {
    clearAuth();
    navigate('/admin/login');
  }

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <header className="page-header">
        <h1>⚙️ Panel Admin</h1>
        <div className="header-user">
          <span>{codigoAlumno}</span>
          <button onClick={handleLogout} className="btn-logout">Salir</button>
        </div>
      </header>

      {error && <p className="error-msg">{error}</p>}

      <div className="admin-tabs">
        {(['alumnos', 'sanciones', 'reportes'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`admin-tab ${tab === t ? 'active' : ''}`}>
            {t === 'alumnos' ? '👥 Alumnos' : t === 'sanciones' ? '⚠️ Sanciones' : '📊 Reportes'}
          </button>
        ))}
      </div>

      {tab === 'alumnos' && (
        <div className="admin-section">
          <div className="search-bar">
            <input placeholder="Buscar por nombre, DNI o código…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadAlumnos()} />
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
              <option value="">Todos</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="SUSPENDIDO_7D">SUSPENDIDO_7D</option>
              <option value="SUSPENDIDO_MANUAL">SUSPENDIDO_MANUAL</option>
            </select>
            <button onClick={loadAlumnos} className="btn-primary" style={{ width: 'auto', padding: '.5rem 1rem' }}>Buscar</button>
          </div>
          <p className="total-hint">Total: {alumnosTotal}</p>
          {alumnosLoading ? <div className="spinner" style={{ margin: '2rem auto' }} /> : (
            <table className="admin-table">
              <thead><tr><th>Código</th><th>Nombre</th><th>Facultad</th><th>Estado</th></tr></thead>
              <tbody>
                {alumnos.map((a) => (
                  <tr key={a.id}>
                    <td>{a.codigo_alumno}</td>
                    <td>{a.nombres_apellidos}</td>
                    <td>{a.facultad}</td>
                    <td><span className={`estado-mini estado-${a.estado.toLowerCase()}`}>{a.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'sanciones' && (
        <div className="admin-section">
          {sancionesLoading ? <div className="spinner" style={{ margin: '2rem auto' }} /> : (
            sanciones.length === 0 ? <p style={{ textAlign: 'center', color: '#718096', padding: '2rem' }}>Sin sanciones registradas.</p> : (
              <table className="admin-table">
                <thead><tr><th>Alumno</th><th>Tipo</th><th>Fecha</th><th>Acción</th></tr></thead>
                <tbody>
                  {sanciones.map((s) => (
                    <tr key={s.id}>
                      <td>{s.alumno.nombres_apellidos} ({s.alumno.codigo_alumno})</td>
                      <td><span className="tipo-sancion">{s.tipo}</span></td>
                      <td>{new Date(s.fecha_aplicacion).toLocaleDateString('es-PE')}</td>
                      <td>
                        {!s.resuelta && (
                          <button onClick={() => handleAnular(s.id)} className="btn-danger" style={{ fontSize: '.8rem' }}>
                            Anular
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      )}

      {tab === 'reportes' && (
        <div className="admin-section">
          <div className="reporte-filters">
            <label>Desde: <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
            <label>Hasta: <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
            <button onClick={loadReporte} className="btn-primary" style={{ width: 'auto', padding: '.5rem 1rem' }}>Consultar</button>
          </div>
          {reporte && (
            <div className="reporte-cards">
              <div className="reporte-card">
                <span>No-Shows</span>
                <strong>{reporte.no_shows}</strong>
              </div>
              <div className="reporte-card">
                <span>Sanciones</span>
                <strong>{reporte.sanciones}</strong>
              </div>
              {reporte.tickets.map((t) => (
                <div key={t.estado} className="reporte-card">
                  <span>{t.estado}</span>
                  <strong>{t._count.id}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
