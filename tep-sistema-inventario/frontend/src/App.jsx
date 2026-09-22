import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Insumos from './pages/Insumos';
import Equipos from './pages/Equipos';
import Movimientos from './pages/Movimientos';
import Compatibilidad from './pages/Compatibilidad';

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
        {/* Ruta principal: por defecto va al Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Rutas principales del sistema */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/insumos" element={<Insumos />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/compatibilidad" element={<Compatibilidad />} />
        <Route path="/catalogo-insumos" element={<Navigate to="/insumos" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        
        {/* Alias en inglés */}
        <Route path="/register" element={<Navigate to="/registro" replace />} />

        {/* Cualquier otra ruta inexistente redirige al dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}