const API_URL = 'http://localhost:3000/api/auth';

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
    const cloned = response.clone();
    const data = await cloned.json().catch(() => ({}));
    logoutService();
    sessionStorage.setItem(
      'tep_inactivity_message',
      data.message || 'Su sesión se ha cerrado automáticamente tras 30 minutos sin actividad.'
    );
    window.dispatchEvent(new CustomEvent('session-expired', { detail: data.message }));
  }

  return response;
}


