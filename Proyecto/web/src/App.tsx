import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.js';
import { HomePage } from './pages/HomePage.js';
import { ColaPage } from './pages/ColaPage.js';
import { TurnosPage } from './pages/TurnosPage.js';
import { TicketPage } from './pages/TicketPage.js';
import { MisReservasPage } from './pages/MisReservasPage.js';
import { OperadorLoginPage } from './pages/OperadorLoginPage.js';
import { OperadorDashboardPage } from './pages/OperadorDashboardPage.js';
import { AdminLoginPage } from './pages/AdminLoginPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Alumno */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/cola" element={<ProtectedRoute><ColaPage /></ProtectedRoute>} />
        <Route path="/turnos" element={<ProtectedRoute><TurnosPage /></ProtectedRoute>} />
        <Route path="/ticket" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />
        <Route path="/mis-reservas" element={<ProtectedRoute><MisReservasPage /></ProtectedRoute>} />
        {/* Operador */}
        <Route path="/operador/login" element={<OperadorLoginPage />} />
        <Route path="/operador/dashboard" element={<ProtectedRoute><OperadorDashboardPage /></ProtectedRoute>} />
        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
