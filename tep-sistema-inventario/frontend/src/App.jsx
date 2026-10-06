import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Insumos from './pages/Insumos';
import Equipos from './pages/Equipos';
import Movimientos from './pages/Movimientos';
import Compatibilidad from './pages/Compatibilidad';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';
import Almacen from './pages/Almacen';
import ProtectedRoute from './components/ProtectedRoute';
import { getStoredUser } from './services/authService';

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
    <Login
      initialMode="register"
      onSwitchToLogin={() => navigate('/login')}
      onLoginSuccess={() => navigate('/dashboard')}
    />
  );
}

// Guardián exclusivo para vistas de Administrador
function AdminRoute({ children }) {
  const user = getStoredUser();
  const rolNormalizado = (user?.rolAcceso || user?.rol || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (rolNormalizado !== 'administrador') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas de autenticación */}
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
          
          {/* Módulo de Depósito y Estantes (Cuadrícula Física) */}
          <Route path="/almacen" element={<Almacen />} />
          <Route path="/mapa-almacen" element={<Almacen />} />
          <Route path="/deposito" element={<Navigate to="/almacen" replace />} />
          <Route path="/estantes" element={<Navigate to="/almacen" replace />} />
          
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/movement" element={<Navigate to="/movimientos" replace />} />
          
          <Route path="/compatibilidad" element={<Compatibilidad />} />
          <Route path="/matriz-compatibilidad" element={<Navigate to="/compatibilidad" replace />} />
          
          {/* Módulo de Reportes y Auditoría */}
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/auditorias" element={<Navigate to="/reportes" replace />} />
          <Route path="/auditorias-reportes" element={<Navigate to="/reportes" replace />} />
          <Route path="/backup" element={<Navigate to="/reportes" replace />} />

          {/* Módulo exclusivo de Administrador */}
          <Route 
            path="/usuarios" 
            element={
              <AdminRoute>
                <Usuarios />
              </AdminRoute>
            } 
          />
          <Route path="/usuarios-roles" element={<Navigate to="/usuarios" replace />} />

          {/* Perfil del Operador */}
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/profile" element={<Navigate to="/perfil" replace />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}