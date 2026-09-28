import { authFetch } from './authService';

const BASE_URL = 'http://localhost:3000/api/compatibilidad';

/**
 * Obtener todas las reglas de compatibilidad
 * GET /api/compatibilidad
 */
export async function listarCompatibilidades() {
  let response;
  try {
    response = await authFetch(BASE_URL);
  } catch {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000). Verifique que esté iniciado.');
  }

  const data = await response.json().catch(() => ([]));

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener las reglas de compatibilidad.');
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Obtener insumos compatibles con un equipo específico
 * GET /api/compatibilidad/equipo/:idEquipo
 */
export async function obtenerInsumosPorEquipo(idEquipo) {
  const response = await authFetch(`${BASE_URL}/equipo/${idEquipo}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener insumos compatibles para el equipo.');
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Obtener equipos compatibles con un insumo específico
 * GET /api/compatibilidad/insumo/:idInsumo
 */
export async function obtenerEquiposPorInsumo(idInsumo) {
  const response = await authFetch(`${BASE_URL}/insumo/${idInsumo}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener equipos compatibles para el insumo.');
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Crear una nueva relación de compatibilidad
 * POST /api/compatibilidad
 * @param {number|string} idInsumo
 * @param {number|string} idEquipo
 * @param {number|string} [idUsuario]
 */
export async function crearCompatibilidad(idInsumo, idEquipo, idUsuario = 1) {
  const response = await authFetch(BASE_URL, {
    method: 'POST',
    body: JSON.stringify({
      idInsumo: Number(idInsumo),
      idEquipo: Number(idEquipo),
      idUsuario: Number(idUsuario || 1),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al crear la relación de compatibilidad.');
  }

  return data;
}

/**
 * Eliminar una relación de compatibilidad por idRegla
 * DELETE /api/compatibilidad/:idRegla
 * @param {number|string} idRegla
 * @param {number|string} [idUsuario]
 */
export async function eliminarCompatibilidad(idRegla, idUsuario = 1) {
  const response = await authFetch(`${BASE_URL}/${idRegla}`, {
    method: 'DELETE',
    body: JSON.stringify({
      idUsuario: Number(idUsuario || 1),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al eliminar la regla de compatibilidad.');
  }

  return data;
}

/**
 * Descargar reporte oficial institucional de la matriz de compatibilidad en PDF (PDFKit)
 * GET /api/compatibilidad/pdf
 */
export async function descargarMatrizPDF() {
  const response = await authFetch(`${BASE_URL}/pdf`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al descargar la matriz de compatibilidad en PDF.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fechaStr = new Date().toISOString().slice(0, 10);
  a.download = `Matriz_Compatibilidad_TEP_${fechaStr}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}


