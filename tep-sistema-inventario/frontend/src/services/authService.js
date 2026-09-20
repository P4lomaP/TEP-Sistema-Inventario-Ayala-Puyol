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

  // Si el login es exitoso, persistir token y datos del usuario en localStorage
  if (data.token) {
    localStorage.setItem('token', data.token);
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
