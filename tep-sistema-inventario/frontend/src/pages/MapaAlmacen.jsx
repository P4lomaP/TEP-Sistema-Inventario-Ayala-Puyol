import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  Minus, 
  MapPin, 
  Package, 
  Layers, 
  Printer, 
  RefreshCw, 
  X, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  Info
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import BannerAuditorReadOnly from '../components/BannerAuditorReadOnly';
import { getStoredUser } from '../services/authService';
import { listarInsumos } from '../services/insumosService';
import { listarEquipos } from '../services/equiposService';
import { 
  FILAS_DISPONIBLES, 
  cargarDimensionesEstante, 
  guardarDimensionesEstante, 
  parsearUbicacion, 
  cargarEquiposEstante, 
  guardarEquipoEstante,
  validarReduccionFila,
  validarReduccionColumna,
  calcularDimensionesMinimas
} from '../utils/shelfHelper';

export default function MapaAlmacen() {
  const currentUser = getStoredUser();
  const rol = currentUser?.rolAcceso || currentUser?.rol || '';
  const isAuditor = rol.toLowerCase().includes('auditor');
  const isAdmin = rol.toLowerCase().includes('administrador');

  // Estados de datos
  const [insumos, setInsumos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [equiposMap, setEquiposMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dimensiones del Estante
  const [dimensiones, setDimensiones] = useState(() => cargarDimensionesEstante());

  // Búsqueda y Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todas'); // 'todas', 'ocupadas', 'vacias', 'insumos', 'equipos'

  // Casilla seleccionada para el Panel Lateral
  const [casillaSeleccionada, setCasillaSeleccionada] = useState(null);

  // Estado de Bloqueo / Alerta de Integridad Física
  const [alertaIntegridad, setAlertaIntegridad] = useState(null);

  // Cargar datos desde Backend y LocalStorage
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataIns, dataEq] = await Promise.all([
        listarInsumos(),
        listarEquipos()
      ]);
      setInsumos(Array.isArray(dataIns) ? dataIns : []);
      setEquipos(Array.isArray(dataEq) ? dataEq : []);
      setEquiposMap(cargarEquiposEstante());
    } catch (err) {
      console.error('Error al sincronizar datos del almacén:', err);
      setError('No se pudo conectar con el catálogo de insumos y equipos en el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial y escucha reactiva de eventos entre ventanas y foco
  useEffect(() => {
    cargarDatos();

    const handleActualizacionEquipos = () => {
      setEquiposMap(cargarEquiposEstante());
    };

    const handleFocus = () => {
      cargarDatos();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleActualizacionEquipos);
    window.addEventListener('tep_shelf_equipment_updated', handleActualizacionEquipos);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleActualizacionEquipos);
      window.removeEventListener('tep_shelf_equipment_updated', handleActualizacionEquipos);
    };
  }, [cargarDatos]);

  // Mapear elementos por celda usando el normalizador robusto
  const matrizOcupacion = useMemo(() => {
    const mapa = {};

    // Insumos desde MySQL
    insumos.forEach((ins) => {
      const parsed = parsearUbicacion(ins.ubicacionFila, ins.ubicacionColumna);
      if (parsed) {
        const coord = parsed.coordenada;
        if (!mapa[coord]) mapa[coord] = { insumos: [], equipos: [] };
        mapa[coord].insumos.push(ins);
      }
    });

    // Equipos en depósito
    equipos.forEach((eq) => {
      const coord = equiposMap[eq.idEquipo];
      if (coord) {
        if (!mapa[coord]) mapa[coord] = { insumos: [], equipos: [] };
        mapa[coord].equipos.push(eq);
      }
    });

    return mapa;
  }, [insumos, equipos, equiposMap]);

  // Auto-ajuste de seguridad: asegurar que la cuadrícula abarque todos los ítems almacenados
  useEffect(() => {
    if (!loading && Object.keys(matrizOcupacion).length > 0) {
      const minDims = calcularDimensionesMinimas(matrizOcupacion, dimensiones);
      if (minDims.filas > dimensiones.filas || minDims.columnas > dimensiones.columnas) {
        const expandidas = {
          filas: Math.max(dimensiones.filas, minDims.filas),
          columnas: Math.max(dimensiones.columnas, minDims.columnas)
        };
        setDimensiones(expandidas);
        guardarDimensionesEstante(expandidas);
      }
    }
  }, [matrizOcupacion, loading]);

  // Estado de bloqueo preventivo para los botones [-]
  const validacionFilaActual = useMemo(() => {
    if (dimensiones.filas <= 2) return { seguro: false, motivoMin: true };
    const filaLetra = FILAS_DISPONIBLES[dimensiones.filas - 1];
    return validarReduccionFila(filaLetra, dimensiones.columnas, matrizOcupacion);
  }, [dimensiones, matrizOcupacion]);

  const validacionColumnaActual = useMemo(() => {
    if (dimensiones.columnas <= 2) return { seguro: false, motivoMin: true };
    const colNum = dimensiones.columnas;
    return validarReduccionColumna(colNum, dimensiones.filas, matrizOcupacion);
  }, [dimensiones, matrizOcupacion]);

  // Modificar dimensiones con Validación Estricta de Integridad Física
  const handleCambiarDimensiones = (tipo, cambio) => {
    if (isAuditor) return;
    setAlertaIntegridad(null);

    // Si se intenta reducir, validar que no existan materiales guardados
    if (cambio < 0) {
      if (tipo === 'filas') {
        if (dimensiones.filas <= 2) return;
        const filaLetra = FILAS_DISPONIBLES[dimensiones.filas - 1];
        const val = validarReduccionFila(filaLetra, dimensiones.columnas, matrizOcupacion);
        if (!val.seguro) {
          const nombres = val.items.slice(0, 3).map(i => `${i.coordenada}: ${i.nombre}`).join(' • ');
          const mas = val.items.length > 3 ? ` (+${val.items.length - 3} adicionales)` : '';
          setAlertaIntegridad({
            tipo: 'error',
            titulo: `Bloqueo de Integridad Física: Fila ${filaLetra} Ocupada`,
            mensaje: `No se puede eliminar la Fila ${filaLetra} porque contiene ${val.cantidad} artículo(s) almacenado(s) (${nombres}${mas}). Para evitar pérdida visual de stock, reubique o retire los materiales antes de reducir la estantería.`,
            items: val.items
          });
          return;
        }
      } else if (tipo === 'columnas') {
        if (dimensiones.columnas <= 2) return;
        const colNum = dimensiones.columnas;
        const val = validarReduccionColumna(colNum, dimensiones.filas, matrizOcupacion);
        if (!val.seguro) {
          const nombres = val.items.slice(0, 3).map(i => `${i.coordenada}: ${i.nombre}`).join(' • ');
          const mas = val.items.length > 3 ? ` (+${val.items.length - 3} adicionales)` : '';
          setAlertaIntegridad({
            tipo: 'error',
            titulo: `Bloqueo de Integridad Física: Columna ${colNum} Ocupada`,
            mensaje: `No se puede eliminar la Columna ${colNum} porque contiene ${val.cantidad} artículo(s) almacenado(s) (${nombres}${mas}). Para evitar pérdida visual de stock, reubique o retire los materiales antes de reducir la estantería.`,
            items: val.items
          });
          return;
        }
      }
    }

    setDimensiones((prev) => {
      let nuevas = { ...prev };
      if (tipo === 'filas') {
        const val = prev.filas + cambio;
        if (val >= 2 && val <= 10) nuevas.filas = val;
      } else if (tipo === 'columnas') {
        const val = prev.columnas + cambio;
        if (val >= 2 && val <= 20) nuevas.columnas = val;
      }
      guardarDimensionesEstante(nuevas);
      return nuevas;
    });
  };

  // Totales y estadísticas del almacén
  const estadisticas = useMemo(() => {
    const totalCasillas = dimensiones.filas * dimensiones.columnas;
    let casillasOcupadas = 0;

    const filasActuales = FILAS_DISPONIBLES.slice(0, dimensiones.filas);
    for (let f of filasActuales) {
      for (let c = 1; c <= dimensiones.columnas; c++) {
        const coord = `${f}${c}`;
        const celda = matrizOcupacion[coord];
        if (celda && (celda.insumos?.length > 0 || celda.equipos?.length > 0)) {
          casillasOcupadas++;
        }
      }
    }

    const totalInsumosUbicados = Object.values(matrizOcupacion).reduce(
      (sum, celda) => sum + (celda.insumos?.length || 0),
      0
    );

    const totalEquiposUbicados = Object.values(matrizOcupacion).reduce(
      (sum, celda) => sum + (celda.equipos?.length || 0),
      0
    );

    const porcentajeOcupacion = totalCasillas > 0 
      ? Math.round((casillasOcupadas / totalCasillas) * 100) 
      : 0;

    return {
      totalCasillas,
      casillasOcupadas,
      casillasLibres: totalCasillas - casillasOcupadas,
      porcentajeOcupacion,
      totalInsumosUbicados,
      totalEquiposUbicados
    };
  }, [dimensiones, matrizOcupacion]);

  // Lista de equipos en depósito sin casilla asignada
  const equiposEnDepositoSinCasilla = useMemo(() => {
    return equipos.filter(
      (eq) => eq.estadoOperativo === 'En Depósito' && !equiposMap[eq.idEquipo]
    );
  }, [equipos, equiposMap]);

  // Asignar un equipo a la casilla seleccionada
  const handleAsignarEquipo = (idEquipo) => {
    if (!casillaSeleccionada || isAuditor) return;
    const nuevoMap = guardarEquipoEstante(idEquipo, casillaSeleccionada);
    setEquiposMap(nuevoMap);
  };

  // Quitar un equipo de su casilla
  const handleQuitarEquipo = (idEquipo) => {
    if (isAuditor) return;
    const nuevoMap = guardarEquipoEstante(idEquipo, null);
    setEquiposMap(nuevoMap);
  };

  // Imprimir Etiqueta Oficial de Casilla
  const handleImprimirEtiqueta = (coord) => {
    if (!coord) return;
    const datosCasilla = matrizOcupacion[coord] || { insumos: [], equipos: [] };
    const filaLetra = coord.charAt(0);
    const colNum = coord.slice(1);

    const contenidoInsumos = datosCasilla.insumos.length > 0 
      ? datosCasilla.insumos.map(i => `
        <tr>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-family: monospace;">${i.codigoInterno}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${i.descripcion}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center;">${i.categoria}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${i.stockActual} u.</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #94a3b8; font-style: italic;">Sin insumos asignados</td></tr>';

    const contenidoEquipos = datosCasilla.equipos.length > 0 
      ? datosCasilla.equipos.map(e => `
        <tr>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-family: monospace;">${e.codPatrimonial || 'S/N'}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${e.marcaModelo}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${e.numeroSerie}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${e.estadoOperativo}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #94a3b8; font-style: italic;">Sin equipos asignados</td></tr>';

    const fechaHoy = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const ventanaImpresion = window.open('', '_blank', 'width=750,height=800');
    ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Etiqueta de Casilla - ${coord}</title>
        <style>
          @page { size: auto; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 15px; }
          .contenedor { border: 2px dashed #0284c7; padding: 20px; border-radius: 12px; background: #fff; }
          .encabezado { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .titulo-institucional { font-size: 13px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitulo { font-size: 11px; color: #64748b; margin-top: 2px; }
          .badge-coord { background: #0284c7; color: white; padding: 8px 18px; border-radius: 8px; font-size: 26px; font-weight: 900; letter-spacing: 2px; font-family: monospace; }
          .seccion-titulo { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; margin-top: 15px; margin-bottom: 6px; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #f1f5f9; padding: 6px; text-align: left; font-weight: 700; color: #334155; }
          .codigo-barras-sim { text-align: center; margin: 15px 0 8px 0; font-family: 'Courier New', Courier, monospace; font-size: 20px; letter-spacing: 8px; font-weight: bold; color: #0f172a; }
          .pie { margin-top: 20px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="contenedor">
          <div class="encabezado">
            <div>
              <div class="titulo-institucional">Tribunal Electoral de la Provincia</div>
              <div class="subtitulo">Sistema Integral de Inventario y Control de Pañol</div>
              <div style="font-size: 11px; margin-top: 4px; font-weight: 600; color: #0284c7;">
                Ubicación Física: Estante ${filaLetra} — Casilla / Columna ${colNum}
              </div>
            </div>
            <div class="badge-coord">${coord}</div>
          </div>

          <div class="codigo-barras-sim">||| | ||||| | ||| |||| | ${coord} | |||| ||| |</div>

          <div class="seccion-titulo">Insumos y Suministros Alojados</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Cód. Interno</th>
                <th style="width: 45%;">Descripción</th>
                <th style="width: 15%; text-align: center;">Categoría</th>
                <th style="width: 15%; text-align: right;">Stock</th>
              </tr>
            </thead>
            <tbody>
              ${contenidoInsumos}
            </tbody>
          </table>

          <div class="seccion-titulo" style="margin-top: 18px;">Equipos Patrimoniales en Reserva</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Cód. Patrimonial</th>
                <th style="width: 40%;">Marca / Modelo</th>
                <th style="width: 20%; text-align: center;">N° Serie</th>
                <th style="width: 15%; text-align: right;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${contenidoEquipos}
            </tbody>
          </table>

          <div class="pie">
            <span>Fecha de emisión: ${fechaHoy}</span>
            <span>Firma Pañolero / Responsable: _______________________</span>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  const filas = FILAS_DISPONIBLES.slice(0, dimensiones.filas);
  const columnas = Array.from({ length: dimensiones.columnas }, (_, i) => i + 1);

  // Filtrado de casillas
  const cumpleFiltro = (coord) => {
    const celda = matrizOcupacion[coord] || { insumos: [], equipos: [] };
    const numInsumos = celda.insumos.length;
    const numEquipos = celda.equipos.length;
    const tieneElementos = numInsumos > 0 || numEquipos > 0;

    // Filtro por tipo
    if (filtroTipo === 'ocupadas' && !tieneElementos) return false;
    if (filtroTipo === 'vacias' && tieneElementos) return false;
    if (filtroTipo === 'insumos' && numInsumos === 0) return false;
    if (filtroTipo === 'equipos' && numEquipos === 0) return false;

    // Filtro por texto de búsqueda
    if (filtroTexto.trim()) {
      const q = filtroTexto.toLowerCase();
      const coincideCoord = coord.toLowerCase().includes(q);
      const coincideInsumo = celda.insumos.some(
        (i) => i.codigoInterno?.toLowerCase().includes(q) || i.descripcion?.toLowerCase().includes(q)
      );
      const coincideEquipo = celda.equipos.some(
        (e) => e.codPatrimonial?.toLowerCase().includes(q) || 
               e.marcaModelo?.toLowerCase().includes(q) || 
               e.numeroSerie?.toLowerCase().includes(q)
      );
      return coincideCoord || coincideInsumo || coincideEquipo;
    }

    return true;
  };

  const detalleCasilla = casillaSeleccionada ? matrizOcupacion[casillaSeleccionada] || { insumos: [], equipos: [] } : null;

  return (
    <MainLayout activePage="almacen">
      <div className="space-y-6">
        {/* Banner de Auditor */}
        {isAuditor && <BannerAuditorReadOnly />}

        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 tracking-tight">
                Depósito y Estantes
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-300 mt-1">
              Mapa visual de cuadrícula física, control de casillas y localización de suministros del Tribunal Electoral
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cargarDatos}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-gray-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Sincronizar cuadrícula con la base de datos"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
          </div>
        </div>

        {/* BANNER DE ALERTA DE INTEGRIDAD FÍSICA (Si se intentó reducir con material almacenado) */}
        {alertaIntegridad && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                    {alertaIntegridad.titulo}
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    {alertaIntegridad.mensaje}
                  </p>
                  {alertaIntegridad.items && alertaIntegridad.items.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {alertaIntegridad.items.map((it, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100/90 text-amber-950 font-mono text-[11px] rounded-md border border-amber-200"
                        >
                          <span className="font-bold">{it.coordenada}:</span> {it.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlertaIntegridad(null)}
                className="text-amber-700 hover:text-amber-900 p-1.5 rounded-lg hover:bg-amber-100 transition cursor-pointer shrink-0"
                aria-label="Cerrar alerta"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}


        {/* Panel de Control de Redimensión y Filtros */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            {/* Controles de Redimensión con Protección de Integridad */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-gray-200">Dimensión de Estantería:</span>
              </div>

              {/* Selector de Filas */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-700 rounded-xl p-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">Filas (A-{filas[filas.length - 1]}):</span>
                <button
                  type="button"
                  onClick={() => handleCambiarDimensiones('filas', -1)}
                  disabled={isAuditor || dimensiones.filas <= 2}
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-lg border transition cursor-pointer relative
                    ${!validacionFilaActual.seguro && !validacionFilaActual.motivoMin
                      ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40'}
                  `}
                  title={
                    !validacionFilaActual.seguro && !validacionFilaActual.motivoMin
                      ? `Bloqueo de Integridad: La fila ${FILAS_DISPONIBLES[dimensiones.filas - 1]} contiene ${validacionFilaActual.cantidad} artículo(s). Clic para ver detalles.`
                      : 'Reducir fila'
                  }
                >
                  {!validacionFilaActual.seguro && !validacionFilaActual.motivoMin ? (
                    <Lock size={12} className="text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Minus size={13} />
                  )}
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-800 dark:text-white">{dimensiones.filas}</span>
                <button
                  type="button"
                  onClick={() => handleCambiarDimensiones('filas', 1)}
                  disabled={isAuditor || dimensiones.filas >= 10}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-40 cursor-pointer"
                  title="Añadir fila"
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Selector de Columnas */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-700 rounded-xl p-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">Columnas (1-{dimensiones.columnas}):</span>
                <button
                  type="button"
                  onClick={() => handleCambiarDimensiones('columnas', -1)}
                  disabled={isAuditor || dimensiones.columnas <= 2}
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-lg border transition cursor-pointer relative
                    ${!validacionColumnaActual.seguro && !validacionColumnaActual.motivoMin
                      ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40'}
                  `}
                  title={
                    !validacionColumnaActual.seguro && !validacionColumnaActual.motivoMin
                      ? `Bloqueo de Integridad: La columna ${dimensiones.columnas} contiene ${validacionColumnaActual.cantidad} artículo(s). Clic para ver detalles.`
                      : 'Reducir columna'
                  }
                >
                  {!validacionColumnaActual.seguro && !validacionColumnaActual.motivoMin ? (
                    <Lock size={12} className="text-amber-600" />
                  ) : (
                    <Minus size={13} />
                  )}
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-800 dark:text-gray-100">{dimensiones.columnas}</span>
                <button
                  type="button"
                  onClick={() => handleCambiarDimensiones('columnas', 1)}
                  disabled={isAuditor || dimensiones.columnas >= 20}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition disabled:opacity-40 cursor-pointer"
                  title="Añadir columna"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Leyenda de Colores */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-gray-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></span>
                Vacía
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-100 border border-blue-200"></span>
                Insumos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-200"></span>
                Equipos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-100 border border-indigo-200"></span>
                Mixta
              </span>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Buscador de artículos en la matriz */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" />
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Buscar insumo, código o serie en estantería..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-700 dark:text-white dark:placeholder-slate-400 transition"
              />
              {filtroTexto && (
                <button
                  type="button"
                  onClick={() => setFiltroTexto('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Pestañas de Filtro rápido */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
              {[
                { id: 'todas', label: 'Todas' },
                { id: 'ocupadas', label: 'Ocupadas' },
                { id: 'vacias', label: 'Vacías' },
                { id: 'insumos', label: 'Con Insumos' },
                { id: 'equipos', label: 'Con Equipos' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroTipo(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                    filtroTipo === tab.id
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tablero Visual del Estante (Grid Principal) */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[650px] inline-block w-full">
              {/* Encabezado de Columnas */}
              <div 
                className="grid gap-3 mb-3"
                style={{ gridTemplateColumns: `56px repeat(${dimensiones.columnas}, minmax(0, 1fr))` }}
              >
                <div className="flex items-center justify-center font-bold text-xs text-slate-400 dark:text-gray-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl py-2 border border-slate-200/50">
                  F \ C
                </div>
                {columnas.map((col) => (
                  <div 
                    key={col}
                    className="text-center font-bold text-xs text-slate-700 dark:text-gray-200 bg-slate-50 dark:bg-slate-700/50 py-2 rounded-xl border border-slate-200/60 uppercase tracking-wider"
                  >
                    Columna {col}
                  </div>
                ))}
              </div>

              {/* Filas de la Cuadrícula */}
              <div className="space-y-3">
                {filas.map((fila) => (
                  <div 
                    key={fila}
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `56px repeat(${dimensiones.columnas}, minmax(0, 1fr))` }}
                  >
                    {/* Indicador de Fila */}
                    <div className="flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-700/60 rounded-2xl border border-slate-200/70 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 text-sm">
                      <span>Fila</span>
                      <span className="text-base text-blue-700 dark:text-blue-400 font-black">{fila}</span>
                    </div>

                    {/* Celdas / Casillas */}
                    {columnas.map((col) => {
                      const coord = `${fila}${col}`;
                      const celda = matrizOcupacion[coord] || { insumos: [], equipos: [] };
                      const numInsumos = celda.insumos.length;
                      const numEquipos = celda.equipos.length;
                      const tieneInsumos = numInsumos > 0;
                      const tieneEquipos = numEquipos > 0;
                      const isSelected = casillaSeleccionada === coord;
                      const coincide = cumpleFiltro(coord);

                      let estadoClase = 'bg-slate-50/50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600';
                      let badgeClase = 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300';

                      if (tieneInsumos && tieneEquipos) {
                        estadoClase = 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40';
                        badgeClase = 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300';
                      } else if (tieneInsumos) {
                        estadoClase = 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-900/40';
                        badgeClase = 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300';
                      } else if (tieneEquipos) {
                        estadoClase = 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-100/50 dark:hover:bg-amber-900/40';
                        badgeClase = 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300';
                      }

                      if (!coincide) {
                        estadoClase += ' opacity-30 grayscale';
                      }

                      return (
                        <button
                          key={coord}
                          type="button"
                          onClick={() => setCasillaSeleccionada(coord)}
                          className={`
                            relative p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[110px]
                            ${isSelected ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-100/70 dark:bg-blue-950/80 shadow-md' : estadoClase}
                          `}
                        >
                          {/* Cabecera de celda: Coordenada + Estado */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-sm font-black text-slate-800 dark:text-white">
                              {coord}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeClase}`}>
                              {tieneInsumos && tieneEquipos
                                ? 'Mixta'
                                : tieneInsumos
                                ? 'Insumos'
                                : tieneEquipos
                                ? 'Equipos'
                                : 'Vacía'}
                            </span>
                          </div>

                          {/* Contenido / Miniatura de ocupación */}
                          <div className="space-y-1 my-1.5">
                            {tieneInsumos && (
                              <div className="flex items-center gap-1.5 text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                                <Layers size={12} className="shrink-0 text-blue-600 dark:text-blue-400" />
                                <span>{numInsumos} insumo(s)</span>
                              </div>
                            )}
                            {tieneEquipos && (
                              <div className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                                <Package size={12} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                <span>{numEquipos} equipo(s)</span>
                              </div>
                            )}
                            {!tieneInsumos && !tieneEquipos && (
                              <span className="text-[11px] text-slate-300 dark:text-slate-500 italic block">
                                Disponible
                              </span>
                            )}
                          </div>

                          {/* Pie de celda: vista previa rápida */}
                          <div className="pt-1 border-t border-slate-200/50 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400">
                            <span className="truncate max-w-[100px] font-medium">
                              {tieneInsumos
                                ? celda.insumos[0].codigoInterno
                                : tieneEquipos
                                ? celda.equipos[0].marcaModelo
                                : 'Sin asignar'}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              Ver ›
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral / Drawer de Detalle de Casilla Seleccionada */}
        {casillaSeleccionada && (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-end select-none"
            onClick={() => setCasillaSeleccionada(null)}
          >
            <div 
              className="relative w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Encabezado del Panel Lateral */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black font-mono text-xl shadow-xs">
                    {casillaSeleccionada}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                      Casilla {casillaSeleccionada}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400">
                      Estante {casillaSeleccionada.charAt(0)} — Columna {casillaSeleccionada.slice(1)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCasillaSeleccionada(null)}
                  className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                  aria-label="Cerrar panel"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenido Scrolleable */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                
                {/* Botón de Impresión de Etiqueta */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-700 dark:to-slate-750 rounded-2xl border border-blue-100 dark:border-slate-600 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">Etiqueta Oficial de Casilla</h4>
                    <p className="text-[11px] text-blue-700/80 dark:text-slate-300 mt-0.5">
                      Rótulo institucional con código y contenido para pegar en la estantería física
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleImprimirEtiqueta(casillaSeleccionada)}
                    className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Printer size={14} />
                    <span>Imprimir</span>
                  </button>
                </div>

                {/* Sección 1: Insumos Alojados */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>Insumos y Suministros ({detalleCasilla.insumos.length})</span>
                    </span>
                  </div>

                  {detalleCasilla.insumos.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 dark:text-slate-400">
                      No hay insumos registrados en esta casilla.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detalleCasilla.insumos.map((ins) => (
                        <div 
                          key={ins.idInsumo}
                          className="p-3.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-xl space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 px-1.5 py-0.5 rounded">
                                {ins.codigoInterno}
                              </span>
                              <h5 className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                                {ins.descripcion}
                              </h5>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                              Stock: {ins.stockActual} u.
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700">
                            <span>Categoría: {ins.categoria}</span>
                            <span>Seguridad: {ins.stockSeguridad} u.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sección 2: Equipos Patrimoniales en Depósito */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
                      <Package size={14} className="text-amber-600 dark:text-amber-400" />
                      <span>Equipos en Depósito ({detalleCasilla.equipos.length})</span>
                    </span>
                  </div>

                  {detalleCasilla.equipos.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 dark:text-slate-400">
                      No hay equipos informáticos asignados a esta casilla.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detalleCasilla.equipos.map((eq) => (
                        <div 
                          key={eq.idEquipo}
                          className="p-3.5 bg-amber-50/50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 rounded-xl space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded">
                                {eq.codPatrimonial || 'S/N Patrimonial'}
                              </span>
                              <h5 className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                                {eq.marcaModelo}
                              </h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                Serie: {eq.numeroSerie}
                              </p>
                            </div>
                            {!isAuditor && (
                              <button
                                type="button"
                                onClick={() => handleQuitarEquipo(eq.idEquipo)}
                                className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition cursor-pointer"
                                title="Quitar equipo de esta casilla"
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 pt-1 border-t border-amber-200/50 dark:border-amber-800/40">
                            <span>Tipo: {eq.tipoEquipo}</span>
                            <span className="font-semibold text-amber-700 dark:text-amber-400">{eq.estadoOperativo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Asignador de Equipos en Reserva a esta Casilla */}
                  {!isAuditor && equiposEnDepositoSinCasilla.length > 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Plus size={14} className="text-blue-600 dark:text-blue-400" />
                        <span>Asignar equipo en reserva a esta casilla:</span>
                      </span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAsignarEquipo(Number(e.target.value));
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="" disabled>-- Seleccione un equipo para almacenar aquí --</option>
                        {equiposEnDepositoSinCasilla.map((eq) => (
                          <option key={eq.idEquipo} value={eq.idEquipo}>
                            {eq.marcaModelo} (Serie: {eq.numeroSerie})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 dark:text-gray-400">
                        Solo se listan equipos con estado "En Depósito" que aún no tengan casilla asignada.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Pie del Panel Lateral */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setCasillaSeleccionada(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
