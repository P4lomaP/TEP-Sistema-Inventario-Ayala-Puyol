import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken, logoutService, isTokenExpired } from '../services/authService';
import { useInactivityTimer } from '../hooks/useInactivityTimer';

/**
 * Componente guardián de rutas protegidas:
 * 1. Verifica si el usuario tiene un token de autenticación válido y no expirado.
 * 2. Si no hay token o ya expiró antes de entrar al sistema, limpia credenciales silenciosamente y redirige a /login.
 * 3. Si la sesión está activa y vigente, inicia el monitoreo de inactividad de 30 minutos.
 */
export default function ProtectedRoute({ children }) {
  const token = getAuthToken();
  const expired = isTokenExpired(token);

  // Si no hay sesión o el token almacenado ya expiró antes de iniciar:
  // Limpiar silenciosamente sin disparar el cartel de inactividad
  if (!token || expired) {
    if (token && expired) {
      logoutService();
      sessionStorage.removeItem('tep_inactivity_message');
    }
    return <Navigate to="/login" replace />;
  }

  // Activa el temporizador de inactividad solo para sesiones válidas y activas
  useInactivityTimer(30);

  return children ? children : <Outlet />;
}
