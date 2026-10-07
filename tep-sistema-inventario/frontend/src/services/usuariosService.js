import { authFetch } from './authService';
import { API_BASE } from './apiConfig';

const BASE_URL = `${API_BASE}/usuarios`;

/**
 * Obtener lista de todos los usuarios registrados y métricas (Exclusivo Administrador)
 * GET /api/usuarios
 */
export async function listarUsuarios() {
  const response = await authFetch(BASE_URL);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener la nómina de usuarios.');
  }

  return await response.json();
}

/**
 * Alternar estado activo / inactivo de una cuenta
 * PUT /api/usuarios/:id/estado
 * @param {number|string} idUsuario
 * @param {number} estadoActivo (1 o 0)
 */
export async function cambiarEstadoUsuario(idUsuario, estadoActivo) {
  const response = await authFetch(`${BASE_URL}/${idUsuario}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ estadoActivo }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al modificar el estado del usuario.');
  }

  return data;
}

/**
 * Modificar el rol institucional de un operador
 * PUT /api/usuarios/:id/rol
 * @param {number|string} idUsuario
 * @param {string} rolAcceso ('Administrador' | 'Tecnico' | 'Auditor')
 */
export async function cambiarRolUsuario(idUsuario, rolAcceso) {
  const response = await authFetch(`${BASE_URL}/${idUsuario}/rol`, {
    method: 'PUT',
    body: JSON.stringify({ rolAcceso }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al actualizar el rol del usuario.');
  }

  return data;
}

/**
 * Descargar nómina oficial de usuarios en PDF institucional (PDFKit)
 * GET /api/usuarios/pdf
 */
export async function descargarPDFUsuarios() {
  const response = await authFetch(`${BASE_URL}/pdf`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al generar la nómina de usuarios en PDF.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fechaStr = new Date().toISOString().slice(0, 10);
  a.download = `Nomina_Usuarios_TEP_${fechaStr}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
