import { authFetch } from './authService';

const BASE_URL = 'http://localhost:3000/api/insumos';

/**
 * Obtener listado de insumos activos (estadoActivo = 1)
 * GET /api/insumos
 */
export async function listarInsumos() {
  const response = await authFetch(BASE_URL);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener la lista de insumos.');
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Registrar un nuevo insumo en la base de datos
 * POST /api/insumos
 * @param {Object} insumoData
 */
export async function crearInsumo(insumoData) {
  const esPeriferico = (insumoData.categoria || '').trim().toLowerCase().startsWith('perif');
  const payload = {
    codigoInterno: insumoData.codigoInterno?.trim(),
    descripcion: insumoData.descripcion?.trim(),
    categoria: insumoData.categoria?.trim() || 'Insumo',
    stockActual: Number(insumoData.stockActual ?? 0),
    stockSeguridad: Number(insumoData.stockSeguridad ?? 0),
    ubicacionFila: insumoData.ubicacionFila?.trim() || '',
    ubicacionColumna: insumoData.ubicacionColumna?.trim() || '',
    fechaVencimiento: esPeriferico ? null : (insumoData.fechaVencimiento || null)
  };

  const response = await authFetch(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al registrar el nuevo insumo.');
  }

  return data;
}

/**
 * Actualizar datos de un insumo existente
 * PUT /api/insumos/:id
 * @param {number|string} idInsumo
 * @param {Object} insumoData
 */
export async function actualizarInsumo(idInsumo, insumoData) {
  const esPeriferico = (insumoData.categoria || '').trim().toLowerCase().startsWith('perif');
  const payload = {
    codigoInterno: insumoData.codigoInterno?.trim(),
    descripcion: insumoData.descripcion?.trim(),
    categoria: insumoData.categoria?.trim() || 'Insumo',
    stockActual: Number(insumoData.stockActual ?? 0),
    stockSeguridad: Number(insumoData.stockSeguridad ?? 0),
    ubicacionFila: insumoData.ubicacionFila?.trim() || '',
    ubicacionColumna: insumoData.ubicacionColumna?.trim() || '',
    fechaVencimiento: esPeriferico ? null : (insumoData.fechaVencimiento || null)
  };

  const response = await authFetch(`${BASE_URL}/${idInsumo}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al actualizar el insumo.');
  }

  return data;
}

/**
 * Dar de baja lógica a un insumo (estadoActivo = 0)
 * PUT /api/insumos/:id/baja
 * @param {number|string} idInsumo
 */
export async function darDeBajaInsumo(idInsumo) {
  const response = await authFetch(`${BASE_URL}/${idInsumo}/baja`, {
    method: 'PUT',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al dar de baja el insumo.');
  }

  return data;
}

