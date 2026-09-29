import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutService, getAuthToken, isTokenExpired } from '../services/authService';

const DEFAULT_TIMEOUT_MINUTES = 30;
const CHECK_INTERVAL_MS = 10 * 1000; // Chequear cada 10 segundos
const THROTTLE_MS = 5 * 1000; // Throttling de registro a 5 segundos

/**
 * Hook para monitorear inactividad del usuario en el sistema.
 * Si el usuario no realiza ninguna acción durante `timeoutMinutes` (30 min por defecto),
 * la sesión se cierra automáticamente y se redirige a /login.
 */
export function useInactivityTimer(timeoutMinutes = DEFAULT_TIMEOUT_MINUTES) {
  const navigate = useNavigate();
  const lastRecordedRef = useRef(Date.now());
  const limitMs = timeoutMinutes * 60 * 1000;

  useEffect(() => {
    // Si no hay token de autenticación activo o ya está vencido, no monitorear
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) return;

    // Inicializar timestamp de última actividad si aún no está guardado
    if (!localStorage.getItem('tep_last_activity')) {
      localStorage.setItem('tep_last_activity', Date.now().toString());
    }

    // Registrar actividad del usuario (throttled)
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRecordedRef.current >= THROTTLE_MS) {
        lastRecordedRef.current = now;
        localStorage.setItem('tep_last_activity', now.toString());
      }
    };

    // Función para expulsar al usuario por inactividad
    const triggerLogout = (customMsg) => {
      logoutService();
      sessionStorage.setItem(
        'tep_inactivity_message',
        customMsg || 'Su sesión se ha cerrado automáticamente tras 30 minutos sin actividad en el sistema.'
      );
      navigate('/login', { replace: true });
    };

    // Comprobar si transcurrieron 30 minutos sin interacción
    const checkInactivity = () => {
      const currentToken = getAuthToken();
      if (!currentToken || isTokenExpired(currentToken)) return;

      const rawLast = localStorage.getItem('tep_last_activity');
      if (!rawLast) {
        localStorage.setItem('tep_last_activity', Date.now().toString());
        return;
      }

      const lastActivity = Number(rawLast);
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= limitMs) {
        triggerLogout();
      }
    };

    // Eventos de interacción del usuario
    const interactionEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
      'click'
    ];

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Comprobar periódicamente cada 10s
    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    // Comprobar inmediatamente al volver a la pestaña o enfocar la ventana
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkInactivity);

    // Escuchar evento personalizado emitido cuando el backend devuelve 401 por token expirado
    const handleSessionExpiredEvent = (e) => {
      triggerLogout(e.detail);
    };
    window.addEventListener('session-expired', handleSessionExpiredEvent);

    // Sincronización entre pestañas: si otra pestaña cerró la sesión, redirigir
    const handleStorage = (e) => {
      if (e.key === 'token' && !e.newValue) {
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkInactivity);
      window.removeEventListener('session-expired', handleSessionExpiredEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [navigate, limitMs]);
}
