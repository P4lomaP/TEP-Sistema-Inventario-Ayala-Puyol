import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Insumos from './pages/Insumos';
import Equipos from './pages/Equipos';
import Movimientos from './pages/Movimientos';
import Compatibilidad from './pages/Compatibilidad';
import ProtectedRoute from './components/ProtectedRoute';

// Envoltorio para Login con navegación por URL
function LoginPage() {
  const navigate = useNavigate();
  return (
    <Login
      onSwitchToRegister={() => navigate('/registro')}
      onLoginSuccess={() => navigate('/dashboard')}
    />
  );
}

// Envoltorio para Register con navegación por URL
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

        {/* Rutas protegidas del sistema con monitoreo de 30 minutos de inactividad */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/insumos" element={<Insumos />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/compatibilidad" element={<Compatibilidad />} />
          <Route path="/catalogo-insumos" element={<Navigate to="/insumos" replace />} />
        </Route>

        {/* Cualquier otra ruta inexistente redirige al dashboard (o al login si no está autenticado) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}