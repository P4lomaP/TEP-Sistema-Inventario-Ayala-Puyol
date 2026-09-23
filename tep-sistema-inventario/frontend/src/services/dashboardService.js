import { authFetch } from './authService';

const BASE_URL = 'http://localhost:3000/api';

/**
 * Cargar datos consolidados para el Dashboard directamente desde el backend
 * GET /api/dashboard
 */
export async function getDashboardData() {
  try {
    const response = await authFetch(`${BASE_URL}/dashboard`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener métricas del Dashboard.');
    }
    const data = await response.json();

    return {
      equiposActivos: data.kpis?.equiposActivos || 0,
      totalEquipos: data.kpis?.totalEquipos || 0,
      totalInsumos: data.kpis?.totalInsumos || 0,
      totalStockUnidades: data.kpis?.totalStockUnidades || 0,
      insumosCriticos: data.kpis?.insumosCriticos || 0,
      distribucionMensual: data.distribucionMensual || [],
      ultimosMovimientos: data.ultimosMovimientos || []
    };
  } catch (error) {
    console.error('Error al cargar datos del Dashboard:', error);
    throw error;
  }
}

/**
 * Obtener listado de equipos patrimoniales
 * GET /api/equipos
 */
export async function getEquipos() {
  const response = await authFetch(`${BASE_URL}/equipos`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener la lista de equipos.');
  }
  return await response.json();
}

/**
 * Obtener listado de insumos activos
 * GET /api/insumos
 */
export async function getInsumos() {
  const response = await authFetch(`${BASE_URL}/insumos`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener los insumos.');
  }
  return await response.json();
}

/**
 * Obtener listado histórico de movimientos
 * GET /api/movimientos
 */
export async function getMovimientos() {
  const response = await authFetch(`${BASE_URL}/movimientos`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al consultar los movimientos.');
  }
  return await response.json();
}
