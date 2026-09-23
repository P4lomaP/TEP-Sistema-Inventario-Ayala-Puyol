import { authFetch } from './authService';

const API_URL = 'http://localhost:3000/api/auth/perfil';

/**
 * Obtener detalles del perfil del operador en sesión
 * GET /api/auth/perfil
 */
export async function obtenerPerfilUsuario() {
  const response = await authFetch(API_URL);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener datos del perfil.');
  }

  return await response.json();
}

/**
 * Actualizar credenciales y seguridad del operador (contraseña y/o PIN)
 * PUT /api/auth/perfil
 * @param {Object} data - { passwordActual, nuevoPassword, nuevoPin }
 */
export async function actualizarSeguridadUsuario({ passwordActual, nuevoPassword, nuevoPin }) {
  const response = await authFetch(API_URL, {
    method: 'PUT',
    body: JSON.stringify({ passwordActual, nuevoPassword, nuevoPin }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al actualizar credenciales de seguridad.');
  }

  return data;
}
