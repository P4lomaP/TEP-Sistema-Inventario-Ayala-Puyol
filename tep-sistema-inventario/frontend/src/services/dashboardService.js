import { authFetch } from './authService';

const BASE_URL = 'http://localhost:3000/api';

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

/**
 * Cargar datos consolidados para el Dashboard
 * Ejecuta consultas en paralelo para máxima eficiencia
 */
export async function getDashboardData() {
  try {
    const [equipos, insumos, movimientos] = await Promise.all([
      getEquipos(),
      getInsumos(),
      getMovimientos()
    ]);

    // 1. KPI Equipos Activos (estadoOperativo === 'Operativo')
    const equiposArray = Array.isArray(equipos) ? equipos : [];
    const equiposActivos = equiposArray.filter(
      (eq) => eq.estadoOperativo === 'Operativo'
    ).length;

    // 2. KPI Insumos y Alertas Críticas (stockActual <= stockSeguridad)
    const insumosArray = Array.isArray(insumos) ? insumos : [];
    const insumosCriticos = insumosArray.filter(
      (ins) => Number(ins.stockActual) <= Number(ins.stockSeguridad)
    ).length;

    const totalStockUnidades = insumosArray.reduce(
      (acc, ins) => acc + (Number(ins.stockActual) || 0),
      0
    );

    // 3. Últimos 5 movimientos
    const movimientosArray = Array.isArray(movimientos) ? movimientos : [];
    const ultimosMovimientos = movimientosArray.slice(0, 5);

    return {
      equipos: equiposArray,
      equiposActivos,
      totalEquipos: equiposArray.length,
      insumos: insumosArray,
      totalInsumos: insumosArray.length,
      totalStockUnidades,
      insumosCriticos,
      ultimosMovimientos
    };
  } catch (error) {
    console.error('Error al cargar datos del Dashboard:', error);
    throw error;
  }
}
