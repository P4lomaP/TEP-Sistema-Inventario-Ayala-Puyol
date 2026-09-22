import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Insumos from './pages/Insumos';
import Equipos from './pages/Equipos';
import Movimientos from './pages/Movimientos';
import Compatibilidad from './pages/Compatibilidad';
import Reportes from './pages/Reportes';
import ProtectedRoute from './components/ProtectedRoute';

function LoginPage() {
  const navigate = useNavigate();
  return (
    <Login
      onSwitchToRegister={() => navigate('/registro')}
      onLoginSuccess={() => navigate('/dashboard')}
    />
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  return (
    <Register
      onSwitchToLogin={() => navigate('/login')}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/register" element={<Navigate to="/registro" replace />} />

        {/* Rutas protegidas con monitoreo de 30 minutos de inactividad */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/equipos-patrimoniales" element={<Navigate to="/equipos" replace />} />
          <Route path="/insumos" element={<Insumos />} />
          <Route path="/catalogo-insumos" element={<Navigate to="/insumos" replace />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/movement" element={<Navigate to="/movimientos" replace />} />
          <Route path="/compatibilidad" element={<Compatibilidad />} />
          <Route path="/matriz-compatibilidad" element={<Navigate to="/compatibilidad" replace />} />
          
          {/* Módulo de Reportes y Auditoría */}
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/auditorias" element={<Navigate to="/reportes" replace />} />
          <Route path="/auditorias-reportes" element={<Navigate to="/reportes" replace />} />
          <Route path="/backup" element={<Navigate to="/reportes" replace />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}