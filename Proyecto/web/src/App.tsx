import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🍽️ RanchUNI</h1>
        <p>Sistema de Gestión de Turnos de Comedor</p>
      </header>

      <main className="app-main">
        <div className="welcome-card">
          <h2>¡Bienvenido a RanchUNI!</h2>
          <p>Versión 0.1.0 - Setup Inicial</p>

          <section className="status">
            <h3>Estado de Conexiones:</h3>
            <ul>
              <li>Frontend: ✓ React 18 + Vite</li>
              <li>Backend: Conectando...</li>
              <li>Base de Datos: Pendiente</li>
              <li>Cache: Pendiente</li>
            </ul>
          </section>

          <section className="next-steps">
            <h3>Próximos Pasos:</h3>
            <ol>
              <li>Ejecutar: <code>docker-compose up</code></li>
              <li>Verificar API: <code>http://localhost:3001/health</code></li>
              <li>Implementar handlers de autenticación</li>
              <li>Crear componentes de UI</li>
            </ol>
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 RanchUNI - Proyecto Taller de Efectividad Personal</p>
      </footer>
    </div>
  )
}

export default App
