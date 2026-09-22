import { authFetch } from './authService';

const BASE_URL = 'http://localhost:3000/api/sectores';

/**
 * Obtener todos los sectores u oficinas activos
 * GET /api/sectores
 */
export async function listarSectores() {
  let response;
  try {
    response = await authFetch(BASE_URL);
  } catch (err) {
    if (err.message && !err.message.includes('servidor backend')) {
      throw err;
    }
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000).');
  }

  const data = await response.json().catch(() => ([]));

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener la lista de sectores.');
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Registrar un nuevo sector u oficina
 * POST /api/sectores
 * @param {Object} sectorData - { nombreSector, ... }
 */
export async function crearSector(sectorData) {
  const nombre = sectorData.nombreSector || sectorData.nombreOficina;
  const payload = {
    nombreSector: nombre ? nombre.trim() : ''
  };

  let response;
  try {
    response = await authFetch(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err.message && !err.message.includes('servidor backend')) {
      throw err;
    }
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000).');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al registrar el sector.');
  }

  return data;
}

