import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.js';
import { HomePage } from './pages/HomePage.js';
import { ColaPage } from './pages/ColaPage.js';
import { TurnosPage } from './pages/TurnosPage.js';
import { TicketPage } from './pages/TicketPage.js';
import { MisReservasPage } from './pages/MisReservasPage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/cola" element={<ProtectedRoute><ColaPage /></ProtectedRoute>} />
        <Route path="/turnos" element={<ProtectedRoute><TurnosPage /></ProtectedRoute>} />
        <Route path="/ticket" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />
        <Route path="/mis-reservas" element={<ProtectedRoute><MisReservasPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
