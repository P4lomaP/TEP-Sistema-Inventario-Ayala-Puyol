import { API_BASE } from './apiConfig';
const API_URL = `${API_BASE}/auth`;

/**
 * Servicio para iniciar sesión
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Datos del usuario y token JWT
 */
export async function loginService(username, password) {
  let response;
  try {
    response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
  } catch (networkError) {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000). Verifique que el servicio esté iniciado ejecutando "npm start" en la carpeta backend.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Si la respuesta no es exitosa (400, 401, 403, 500)
    throw new Error(data.message || 'Error al iniciar sesión.');
  }

  // Si el login es exitoso, persistir token, actividad y datos del usuario en localStorage
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('tep_last_activity', Date.now().toString());
    sessionStorage.setItem('tep_session_active', 'true');
  }
  if (data.usuario) {
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
  }

  return data;
}

/**
 * Servicio para registrar un nuevo operador
 * @param {Object} userData - { username, password, rolAcceso }
 * @returns {Promise<Object>} Confirmación de registro
 */
export async function registerService({ username, password, rolAcceso }) {
  let response;
  try {
    response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, rolAcceso }),
    });
  } catch (networkError) {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000). Verifique que el servicio esté iniciado ejecutando "npm start" en la carpeta backend.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al registrar la cuenta.');
  }

  return data;
}

/**
 * Cerrar sesión eliminando credenciales
 */
export function logoutService() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('tep_last_activity');
  sessionStorage.removeItem('tep_session_active');
}

/**
 * Comprobar de forma segura y síncrona si un token JWT ha expirado
 * @param {string} token
 * @returns {boolean}
 */
export function isTokenExpired(token) {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;

    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Obtener usuario actualmente almacenado
 */
export function getStoredUser() {
  try {
    const user = localStorage.getItem('usuario');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

/**
 * Obtener el token JWT almacenado
 */
export function getAuthToken() {
  return localStorage.getItem('token');
}

/**
 * Obtener headers con autorización Bearer para peticiones protegidas
 * @param {Object} extraHeaders
 * @returns {Object}
 */
export function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

/**
 * Guardar token renovado automáticamente si el backend lo envía en los headers
 * (Mecanismo de sesión deslizante por actividad del usuario: renueva 30m)
 */
export function handleTokenRenewal(response) {
  try {
    const renewed = response?.headers?.get('x-renewed-token');
    if (renewed) {
      localStorage.setItem('token', renewed);
    }
  } catch {}
}

/**
 * Petición fetch autenticada con renovación transparente y captura de sesión expirada
 */
export async function authFetch(url, options = {}) {
  const headers = getAuthHeaders(options.headers || {});
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Si el usuario está activo y el servidor renovó el token, persistirlo y actualizar última actividad
  handleTokenRenewal(response);
  localStorage.setItem('tep_last_activity', Date.now().toString());

  // Si la sesión expiró en el servidor por inactividad prolongada (401)
  if (response.status === 401) {
    const wasActiveSession = sessionStorage.getItem('tep_session_active') === 'true';
    const cloned = response.clone();
    const data = await cloned.json().catch(() => ({}));
    logoutService();
    // Solo mostrar aviso de inactividad si el operador estaba efectivamente en una sesión activa
    if (wasActiveSession && data.expired) {
      sessionStorage.setItem(
        'tep_inactivity_message',
        data.message || 'Su sesión se ha cerrado automáticamente tras 30 minutos sin actividad.'
      );
    }
    window.dispatchEvent(new CustomEvent('session-expired', { detail: data.message }));
  }

  return response;
}

/**
 * Validar si el PIN de recuperación ingresado para un usuario es correcto
 * @param {Object} data - { username, pinRecuperacion }
 */
export async function verificarPinService({ username, pinRecuperacion }) {
  let response;
  try {
    response = await fetch(`${API_URL}/verificar-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, pinRecuperacion }),
    });
  } catch (networkError) {
    throw new Error('No se pudo conectar con el servidor backend.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'El PIN de recuperación es incorrecto.');
    error.status = response.status;
    error.valido = false;
    error.diasRestantesCooldown = data.diasRestantesCooldown || 0;
    error.puedeSolicitar = data.puedeSolicitar !== false;
    throw error;
  }

  return data;
}

/**
 * Notificar al administrador para solicitar la regeneración de un PIN
 * @param {string} username
 */
export async function solicitarPinService(username) {
  let response;
  try {
    response = await fetch(`${API_URL}/solicitar-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
  } catch (networkError) {
    throw new Error('No se pudo conectar con el servidor backend.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Error al enviar la solicitud al Administrador.');
    error.status = response.status;
    error.diasRestantesCooldown = data.diasRestantesCooldown;
    error.bloqueadoPorCooldown = data.bloqueadoPorCooldown;
    throw error;
  }

  return data;
}

/**
 * Blanquear / restablecer contraseña con el PIN de recuperación
 * @param {Object} data - { username, pinRecuperacion, nuevaPassword }
 */
export async function recuperarPasswordService({ username, pinRecuperacion, nuevaPassword }) {
  let response;
  try {
    response = await fetch(`${API_URL}/recuperar-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, pinRecuperacion, nuevaPassword }),
    });
  } catch (networkError) {
    throw new Error('No se pudo conectar con el servidor backend.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al restablecer la contraseña.');
  }

  return data;
}

/**
 * Administrador: Regenerar PIN de recuperación para un usuario (con cooldown de 30 días)
 * @param {number|string} idUsuario
 */
export async function regenerarPinAdminService(idUsuario) {
  const response = await authFetch(`${API_URL}/admin/regenerar-pin/${idUsuario}`, {
    method: 'PUT',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Error al regenerar PIN.');
    error.status = response.status;
    error.diasRestantes = data.diasRestantes;
    throw error;
  }

  return data;
}

/**
 * Administrador: Descartar solicitud de regeneración de PIN
 * @param {number|string} idUsuario
 */
export async function descartarSolicitudPinService(idUsuario) {
  const response = await authFetch(`${API_URL}/admin/descartar-solicitud-pin/${idUsuario}`, {
    method: 'PUT',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al descartar la solicitud de PIN.');
  }

  return data;
}
