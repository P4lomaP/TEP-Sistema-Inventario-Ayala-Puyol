import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../services/authService';
import { useInactivityTimer } from '../hooks/useInactivityTimer';

/**
 * Componente guardián de rutas protegidas:
 * 1. Verifica si el usuario tiene un token de autenticación válido.
 * 2. Activa el monitoreo de inactividad de 30 minutos.
 * 3. Si no hay sesión o transcurrieron 30 minutos sin actividad, redirige a /login.
 */
export default function ProtectedRoute({ children }) {
  const token = getAuthToken();
  useInactivityTimer(30);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
