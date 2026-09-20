const BASE_URL = 'http://localhost:3000/api/equipos';

/**
 * Obtener listado de todos los equipos con LEFT JOIN a Sectores e Insumos compatibles
 * GET /api/equipos
 */
export async function listarEquipos() {
  let response;
  try {
    response = await fetch(BASE_URL);
  } catch {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000). Verifique que esté iniciado.');
  }

  const data = await response.json().catch(() => ([]));

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener la lista de equipos.');
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Registrar un nuevo equipo informático (Computadora o Impresora)
 * POST /api/equipos
 * @param {Object} equipoData
 */
export async function crearEquipo(equipoData) {
  const esImpresora = 
    equipoData.tipoEquipo === 'impresora' || 
    equipoData.tipoEquipo === 'Impresora';

  const payload = {
    codPatrimonial: equipoData.codPatrimonial?.trim() || null,
    tipoEquipo: esImpresora ? 'Impresora' : 'Computadora',
    marcaModelo: equipoData.marcaModelo?.trim(),
    numeroSerie: equipoData.numeroSerie?.trim(),
    ipFija: equipoData.ipFija?.trim() || '0.0.0.0',
    mascaraSubred: equipoData.mascaraSubred?.trim() || '255.255.255.0',
    workgroup: equipoData.workgroup?.trim() || 'WORKGROUP',
    estadoOperativo: equipoData.estadoOperativo?.trim() || 'Operativo',
    idSector: Number(equipoData.idSector),

    // Específicos de Computadoras (NULL si es Impresora)
    procesador: !esImpresora && equipoData.procesador?.trim() ? equipoData.procesador.trim() : null,
    memoriaRAM: !esImpresora && equipoData.memoriaRAM?.trim() ? equipoData.memoriaRAM.trim() : null,
    almacenamiento: !esImpresora && equipoData.almacenamiento?.trim() ? equipoData.almacenamiento.trim() : null,
    sistemaOperativo: !esImpresora && equipoData.sistemaOperativo?.trim() ? equipoData.sistemaOperativo.trim() : null,

    // Específicos de Impresoras (NULL si es Computadora)
    tecnologiaImpresion: esImpresora ? (equipoData.tecnologiaImpresion || equipoData.tipoImpresion || '').trim() || null : null,
    tipoConexion: esImpresora ? (equipoData.tipoConexion || equipoData.conexionImpresora || '').trim() || null : null,
    formatoPapel: esImpresora ? (equipoData.formatoPapel?.trim() || null) : null,
    idInsumoCompatible: esImpresora && equipoData.idInsumoCompatible ? Number(equipoData.idInsumoCompatible) : null
  };

  let response;
  try {
    response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000).');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al registrar el nuevo equipo.');
  }

  return data;
}

/**
 * Actualizar datos de un equipo existente
 * PUT /api/equipos/:id
 * @param {number|string} idEquipo
 * @param {Object} equipoData
 */
export async function actualizarEquipo(idEquipo, equipoData) {
  const esImpresora = 
    equipoData.tipoEquipo === 'impresora' || 
    equipoData.tipoEquipo === 'Impresora';

  const payload = {
    codPatrimonial: equipoData.codPatrimonial?.trim() || null,
    tipoEquipo: esImpresora ? 'Impresora' : 'Computadora',
    marcaModelo: equipoData.marcaModelo?.trim(),
    numeroSerie: equipoData.numeroSerie?.trim(),
    ipFija: equipoData.ipFija?.trim() || '0.0.0.0',
    mascaraSubred: equipoData.mascaraSubred?.trim() || '255.255.255.0',
    workgroup: equipoData.workgroup?.trim() || 'WORKGROUP',
    estadoOperativo: equipoData.estadoOperativo?.trim() || 'Operativo',
    idSector: Number(equipoData.idSector),

    // Específicos de Computadoras
    procesador: !esImpresora && equipoData.procesador?.trim() ? equipoData.procesador.trim() : null,
    memoriaRAM: !esImpresora && equipoData.memoriaRAM?.trim() ? equipoData.memoriaRAM.trim() : null,
    almacenamiento: !esImpresora && equipoData.almacenamiento?.trim() ? equipoData.almacenamiento.trim() : null,
    sistemaOperativo: !esImpresora && equipoData.sistemaOperativo?.trim() ? equipoData.sistemaOperativo.trim() : null,

    // Específicos de Impresoras
    tecnologiaImpresion: esImpresora ? (equipoData.tecnologiaImpresion || equipoData.tipoImpresion || '').trim() || null : null,
    tipoConexion: esImpresora ? (equipoData.tipoConexion || equipoData.conexionImpresora || '').trim() || null : null,
    formatoPapel: esImpresora ? (equipoData.formatoPapel?.trim() || null) : null,
    idInsumoCompatible: esImpresora && equipoData.idInsumoCompatible ? Number(equipoData.idInsumoCompatible) : null,

    // Motivo de justificación (RN-02)
    motivoBaja: equipoData.motivoBaja?.trim() || null
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}/${idEquipo}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000).');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al actualizar el equipo.');
  }

  return data;
}

/**
 * Dar de baja lógica a un equipo (estadoOperativo = 'Baja')
 * DELETE /api/equipos/:id
 * @param {number|string} idEquipo
 * @param {string} motivoBaja
 */
export async function darDeBajaEquipo(idEquipo, motivoBaja = 'Baja patrimonial / descarte definitivo') {
  let response;
  try {
    response = await fetch(`${BASE_URL}/${idEquipo}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ motivoBaja }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000).');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error al procesar la baja del equipo.');
  }

  return data;
}

/**
 * Obtener la trazabilidad e historial de traslados/bajas de un equipo
 * GET /api/equipos/:id/historial
 * @param {number|string} idEquipo
 */
export async function obtenerHistorialEquipo(idEquipo) {
  let response;
  try {
    response = await fetch(`${BASE_URL}/${idEquipo}/historial`);
  } catch {
    throw new Error('No se pudo conectar con el servidor backend (http://localhost:3000).');
  }

  const data = await response.json().catch(() => ([]));

  if (!response.ok) {
    throw new Error(data.message || 'Error al consultar el historial del equipo.');
  }

  return Array.isArray(data) ? data : [];
}
