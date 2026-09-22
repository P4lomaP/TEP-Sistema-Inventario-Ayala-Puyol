const BASE_URL = 'http://localhost:3000/api/movimientos';

/**
 * Obtener listado de todos los movimientos registrados
 * GET /api/movimientos
 */
export async function listarMovimientos() {
  let response;
  try {
    response = await fetch(BASE_URL);
  } catch {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000). Verifique que esté iniciado.');
  }

  const data = await response.json().catch(() => ([]));

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener la lista de movimientos.');
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Obtener un movimiento específico con sus detalles
 * GET /api/movimientos/:id
 * @param {number|string} idMovimiento
 */
export async function obtenerMovimientoPorId(idMovimiento) {
  const response = await fetch(`${BASE_URL}/${idMovimiento}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener los detalles del movimiento.');
  }

  return data;
}

/**
 * Registrar un nuevo movimiento de almacén (Egreso o Ingreso)
 * POST /api/movimientos
 * @param {Object} movimientoData
 * @param {string} movimientoData.tipoMovimiento - 'Egreso' | 'Ingreso'
 * @param {string} movimientoData.comprobanteRef - Código o número de remito
 * @param {string} [movimientoData.agenteReceptor] - Destino, sector y persona que recibe
 * @param {number} [movimientoData.idUsuario] - ID del usuario operador
 * @param {Array} movimientoData.detalles - Lista de insumos [{ idInsumo, cantidadAfectada, idEquipoDestino }]
 */
export async function crearMovimiento(movimientoData) {
  const payload = {
    tipoMovimiento: movimientoData.tipoMovimiento || 'Egreso',
    comprobanteRef: movimientoData.comprobanteRef?.trim() || `REM-${Date.now().toString().slice(-6)}`,
    agenteReceptor: movimientoData.agenteReceptor?.trim() || null,
    idUsuario: Number(movimientoData.idUsuario || 1),
    detalles: movimientoData.detalles.map(d => ({
      idInsumo: Number(d.idInsumo),
      cantidadAfectada: Number(d.cantidadAfectada),
      idEquipoDestino: d.idEquipoDestino ? Number(d.idEquipoDestino) : null
    }))
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al registrar el movimiento.');
  }

  return data;
}

/**
 * Anular un movimiento y revertir el stock
 * DELETE /api/movimientos/:id
 * @param {number|string} idMovimiento
 * @param {number|string} [idUsuario]
 */
export async function anularMovimiento(idMovimiento, idUsuario = 1) {
  const response = await fetch(`${BASE_URL}/${idMovimiento}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idUsuario: Number(idUsuario || 1),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al anular el movimiento.');
  }

  return data;
}
