import { authFetch } from './authService';
import { API_BASE } from './apiConfig';

const BASE_URL = API_BASE;

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
