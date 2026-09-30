/**
 * Utilidades para el manejo de coordenadas físicas y estanterías del Depósito/Pañol
 * Mapea 'ubicacionFila' y 'ubicacionColumna' a coordenadas institucionales tipo A1, B3, C2, etc.
 */

export const FILAS_DISPONIBLES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

/**
 * Normaliza y extrae letra de fila y número de columna desde texto o valores numéricos
 * Admite todos los formatos institucionales:
 * - "Fila 1" / "Columna 1" -> A1
 * - "Fila A" / "Columna 1" -> A1
 * - "1" / "1" -> A1
 * - "A" / "1" -> A1
 * - "Estante B" / "Caja 4" -> B4
 * - "Estante A" / "Caja 2" -> A2
 * - "B1" / "Estante 1" -> B1
 * - "B-02" / "4" -> B4
 * - "Fila 3" / "Columna 2" -> C2
 */
export function parsearUbicacion(ubicacionFila, ubicacionColumna) {
  if (!ubicacionFila && !ubicacionColumna) return null;

  const strFila = String(ubicacionFila || '').toUpperCase().trim();
  const strCol = String(ubicacionColumna || '').toUpperCase().trim();

  // Limpieza de palabras de prefijo para evitar falsos positivos con letras como 'E' (ESTANTE) o 'F' (FILA)
  const cleanFila = strFila.replace(/\b(ESTANTE|FILA|NIVEL|ALMACEN|ALMACÉN|SECTOR|CAJA|COLUMNA)\b/gi, ' ').trim();
  const cleanCol = strCol.replace(/\b(ESTANTE|FILA|NIVEL|ALMACEN|ALMACÉN|SECTOR|CAJA|COLUMNA)\b/gi, ' ').trim();

  // Caso directo conjunto (ej: "B4", "A-1", "B-04")
  const matchDirecto = `${strFila} ${strCol}`.match(/\b([A-J])-?0*([1-9]|1[0-9]|20)\b/);

  let fila = null;
  let columna = null;

  // 1. Extraer Letra de Fila (A-J) desde cleanFila
  const letraFila = cleanFila.match(/\b([A-J])\b/) || cleanFila.match(/([A-J])/);
  if (letraFila) {
    fila = letraFila[1];
  } else {
    // Si no tiene letra, verificar si vino como número de fila (ej: Fila 1 -> A, Fila 2 -> B, Fila 3 -> C)
    const numFila = cleanFila.match(/\b([1-9]|10)\b/);
    if (numFila) {
      const idx = parseInt(numFila[1], 10) - 1;
      if (idx >= 0 && idx < FILAS_DISPONIBLES.length) {
        fila = FILAS_DISPONIBLES[idx];
      }
    }
  }

  // 2. Extraer Columna (1-20) desde cleanCol
  const numCol = cleanCol.match(/\b([0-9]{1,2})\b/) || cleanCol.match(/([0-9]{1,2})/);
  if (numCol) {
    columna = parseInt(numCol[1], 10);
  } else if (matchDirecto) {
    columna = parseInt(matchDirecto[2], 10);
  }

  // Si aún falta fila o columna, revisar el match directo conjunto
  if (!fila && matchDirecto) fila = matchDirecto[1];
  if (!columna && matchDirecto) columna = parseInt(matchDirecto[2], 10);

  // Si fila sigue sin letra, revisar si vino en cleanCol
  if (!fila) {
    const letraCol = cleanCol.match(/\b([A-J])\b/) || cleanCol.match(/([A-J])/);
    if (letraCol) fila = letraCol[1];
  }

  // Si columna sigue vacía pero cleanFila tiene número extra (ej: B1 o Estante B Caja 2)
  if (!columna) {
    const numEnFila = cleanFila.match(/\b([0-9]{1,2})\b/) || cleanFila.match(/([0-9]{1,2})/);
    if (numEnFila) columna = parseInt(numEnFila[1], 10);
  }

  if (fila && columna) {
    return {
      fila,
      columna,
      coordenada: `${fila}${columna}`
    };
  }

  if (fila) {
    return {
      fila,
      columna: 1,
      coordenada: `${fila}1`
    };
  }

  return null;
}

/**
 * Formatea los valores normalizados que se guardan en MySQL
 */
export function formatearCoordenada(fila, columna) {
  let f = String(fila).toUpperCase().trim();
  // Si fila viene como número 1-10, convertir a letra
  if (/^[1-9]|10$/.test(f)) {
    const idx = parseInt(f, 10) - 1;
    if (idx >= 0 && idx < FILAS_DISPONIBLES.length) {
      f = FILAS_DISPONIBLES[idx];
    }
  }
  const c = parseInt(columna, 10);
  return {
    ubicacionFila: `Fila ${f}`,
    ubicacionColumna: `Columna ${c}`,
    coordenada: `${f}${c}`,
    etiqueta: `Estante ${f} - Casilla ${c}`
  };
}

/**
 * Cargar dimensiones del estante desde localStorage con valores por defecto (4x5)
 */
export function cargarDimensionesEstante() {
  try {
    const raw = localStorage.getItem('tep_shelf_dimensions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.filas >= 2 && parsed.filas <= 10 && parsed.columnas >= 2 && parsed.columnas <= 10) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error al leer dimensiones de estante:', e);
  }
  return { filas: 4, columnas: 5 }; // Por defecto A-D x 1-5
}

/**
 * Guardar dimensiones del estante en localStorage
 */
export function guardarDimensionesEstante(dimensiones) {
  try {
    localStorage.setItem('tep_shelf_dimensions', JSON.stringify(dimensiones));
  } catch (e) {
    console.error('Error al guardar dimensiones de estante:', e);
  }
}

/**
 * Obtener mapa de equipos asignados a estantes (localStorage)
 */
export function cargarEquiposEstante() {
  try {
    const raw = localStorage.getItem('tep_equipos_shelf_locations');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer equipos de estante:', e);
  }
  return {};
}

/**
 * Asignar un equipo a una coordenada de estante y notificar evento reactivo
 */
export function guardarEquipoEstante(idEquipo, coordenada) {
  try {
    const actuales = cargarEquiposEstante();
    if (coordenada) {
      actuales[idEquipo] = coordenada;
    } else {
      delete actuales[idEquipo];
    }
    localStorage.setItem('tep_equipos_shelf_locations', JSON.stringify(actuales));
    // Notificar a otras vistas/componentes del cambio
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tep_shelf_equipment_updated', { 
        detail: { idEquipo, coordenada } 
      }));
    }
    return actuales;
  } catch (e) {
    console.error('Error al guardar ubicación de equipo en estante:', e);
    return {};
  }
}

/**
 * Validación de Integridad Física: Verifica si es seguro reducir una fila
 * Devuelve falso si existen insumos o equipos almacenados en esa fila.
 */
export function validarReduccionFila(filaLetra, columnasTotal, matrizOcupacion) {
  const items = [];
  for (let c = 1; c <= columnasTotal; c++) {
    const coord = `${filaLetra}${c}`;
    const celda = matrizOcupacion[coord];
    if (celda) {
      (celda.insumos || []).forEach(ins => {
        items.push({
          tipo: 'insumo',
          coordenada: coord,
          nombre: ins.descripcion || ins.codigoInterno,
          codigo: ins.codigoInterno,
          cantidad: ins.stockActual
        });
      });
      (celda.equipos || []).forEach(eq => {
        items.push({
          tipo: 'equipo',
          coordenada: coord,
          nombre: eq.marcaModelo,
          codigo: eq.codPatrimonial || eq.numeroSerie,
          serie: eq.numeroSerie
        });
      });
    }
  }
  return {
    seguro: items.length === 0,
    items,
    cantidad: items.length
  };
}

/**
 * Validación de Integridad Física: Verifica si es seguro reducir una columna
 * Devuelve falso si existen insumos o equipos almacenados en esa columna.
 */
export function validarReduccionColumna(columnaNum, filasTotal, matrizOcupacion) {
  const items = [];
  const filas = FILAS_DISPONIBLES.slice(0, filasTotal);
  for (let f of filas) {
    const coord = `${f}${columnaNum}`;
    const celda = matrizOcupacion[coord];
    if (celda) {
      (celda.insumos || []).forEach(ins => {
        items.push({
          tipo: 'insumo',
          coordenada: coord,
          nombre: ins.descripcion || ins.codigoInterno,
          codigo: ins.codigoInterno,
          cantidad: ins.stockActual
        });
      });
      (celda.equipos || []).forEach(eq => {
        items.push({
          tipo: 'equipo',
          coordenada: coord,
          nombre: eq.marcaModelo,
          codigo: eq.codPatrimonial || eq.numeroSerie,
          serie: eq.numeroSerie
        });
      });
    }
  }
  return {
    seguro: items.length === 0,
    items,
    cantidad: items.length
  };
}

/**
 * Auto-ajuste de seguridad: Calcula las dimensiones mínimas para que ningún
 * material registrado quede fuera del mapa visual.
 */
export function calcularDimensionesMinimas(matrizOcupacion, dimensionesBase = { filas: 4, columnas: 5 }) {
  let maxFilaIdx = Math.max(dimensionesBase.filas - 1, 3); // mínimo fila D (índice 3)
  let maxCol = Math.max(dimensionesBase.columnas, 5); // mínimo 5 columnas

  Object.entries(matrizOcupacion).forEach(([coord, celda]) => {
    const tieneInsumos = celda.insumos && celda.insumos.length > 0;
    const tieneEquipos = celda.equipos && celda.equipos.length > 0;
    if (tieneInsumos || tieneEquipos) {
      const filaLetra = coord.charAt(0);
      const colNum = parseInt(coord.slice(1), 10);
      const idx = FILAS_DISPONIBLES.indexOf(filaLetra);
      if (idx > maxFilaIdx) maxFilaIdx = idx;
      if (colNum > maxCol) maxCol = colNum;
    }
  });

  return {
    filas: Math.min(maxFilaIdx + 1, FILAS_DISPONIBLES.length),
    columnas: Math.min(maxCol, 20)
  };
}
