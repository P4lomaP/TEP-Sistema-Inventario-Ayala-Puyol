import { useState, useMemo, useEffect } from 'react';
import { X, Check, Grid, MapPin, Layers, Info } from 'lucide-react';
import { 
  FILAS_DISPONIBLES, 
  cargarDimensionesEstante, 
  parsearUbicacion, 
  formatearCoordenada
} from '../utils/shelfHelper';
import { listarInsumos } from '../services/insumosService';

export default function ModalSelectorEstante({
  isOpen,
  onClose,
  onSelect,
  coordenadaActual = '',
  insumos = []
}) {
  const dimensiones = useMemo(() => cargarDimensionesEstante(), [isOpen]);

  // Cargar inventario de insumos automáticamente si no fue inyectado por props
  const [internalInsumos, setInternalInsumos] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (!insumos || insumos.length === 0) {
        listarInsumos().then(d => setInternalInsumos(Array.isArray(d) ? d : [])).catch(() => {});
      }
    }
  }, [isOpen, insumos]);

  const effectiveInsumos = (insumos && insumos.length > 0) ? insumos : internalInsumos;

  // Normalizar coordenada inicial seleccionada
  const [seleccionada, setSeleccionada] = useState(() => {
    if (!coordenadaActual) return null;
    const parsed = parsearUbicacion(coordenadaActual, '');
    return parsed ? parsed.coordenada : coordenadaActual.toUpperCase().trim();
  });

  useEffect(() => {
    if (isOpen) {
      if (!coordenadaActual) {
        setSeleccionada(null);
      } else {
        const parsed = parsearUbicacion(coordenadaActual, '');
        setSeleccionada(parsed ? parsed.coordenada : String(coordenadaActual).toUpperCase().trim());
      }
    }
  }, [isOpen, coordenadaActual]);

  // Mapear ocupación por casilla (exclusivamente insumos)
  const ocupacionMapa = useMemo(() => {
    const mapa = {};

    // Insumos
    effectiveInsumos.forEach((ins) => {
      const parsed = parsearUbicacion(ins.ubicacionFila, ins.ubicacionColumna);
      if (parsed) {
        const coord = parsed.coordenada;
        if (!mapa[coord]) mapa[coord] = { insumos: [] };
        mapa[coord].insumos.push(ins);
      }
    });

    return mapa;
  }, [effectiveInsumos]);

  if (!isOpen) return null;

  const filas = FILAS_DISPONIBLES.slice(0, dimensiones.filas);
  const columnas = Array.from({ length: dimensiones.columnas }, (_, i) => i + 1);

  const handleConfirmar = () => {
    if (!seleccionada) {
      onSelect(null);
      onClose();
      return;
    }

    const filaLetra = seleccionada.charAt(0);
    const colNum = parseInt(seleccionada.slice(1), 10);
    const info = formatearCoordenada(filaLetra, colNum);

    onSelect(info);
    onClose();
  };

  const handleLimpiar = () => {
    setSeleccionada(null);
  };

  const detalleSeleccionada = seleccionada ? ocupacionMapa[seleccionada] : null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[92vh] flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Grid size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-gray-100">Seleccionar Casilla del Estante</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Haga clic en una casilla de la cuadrícula física para asignarle su posición en el depósito
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido scrolleable: Matriz del Estante */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Leyenda rápida */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></span>
                Vacía
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800"></span>
                Con Insumos
              </span>
            </div>
            <span className="font-semibold text-slate-600 dark:text-gray-300">
              Estantería: {dimensiones.filas} Filas × {dimensiones.columnas} Columnas
            </span>
          </div>

          {/* Cuadrícula interactiva */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[500px] inline-block w-full">
              {/* Encabezado de Columnas */}
              <div 
                className="grid gap-2 mb-2"
                style={{ gridTemplateColumns: `48px repeat(${dimensiones.columnas}, minmax(0, 1fr))` }}
              >
                <div className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center">
                  F \ C
                </div>
                {columnas.map((col) => (
                  <div 
                    key={col} 
                    className="text-center text-xs font-bold text-slate-600 dark:text-gray-200 bg-slate-100/80 dark:bg-slate-800/90 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700"
                  >
                    Columna {col}
                  </div>
                ))}
              </div>

              {/* Filas */}
              <div className="space-y-2">
                {filas.map((fila) => (
                  <div 
                    key={fila}
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `48px repeat(${dimensiones.columnas}, minmax(0, 1fr))` }}
                  >
                    {/* Etiqueta de Fila */}
                    <div className="flex items-center justify-center font-bold text-xs text-slate-700 dark:text-gray-200 bg-slate-100/90 dark:bg-slate-800/90 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      Fila {fila}
                    </div>

                    {/* Celdas de la fila */}
                    {columnas.map((col) => {
                      const coord = `${fila}${col}`;
                      const isSel = seleccionada === coord;
                      const ocup = ocupacionMapa[coord];
                      const numInsumos = ocup?.insumos?.length || 0;
                      const tieneInsumos = numInsumos > 0;

                      let bgStyle = 'bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100';
                      if (tieneInsumos) {
                        bgStyle = 'bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200';
                      }

                      return (
                        <button
                          key={coord}
                          type="button"
                          onClick={() => setSeleccionada(coord)}
                          className={`
                            relative p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[68px]
                            ${isSel 
                              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-100/70 dark:bg-blue-900/50 shadow-md font-bold text-blue-950 dark:text-white' 
                              : bgStyle}
                          `}
                        >
                          {/* Coordenada */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-bold tracking-tight">{coord}</span>
                            {isSel && (
                              <span className="w-3.5 h-3.5 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0">
                                <Check size={10} strokeWidth={3} />
                              </span>
                            )}
                          </div>

                          {/* Indicadores de ocupación */}
                          <div className="flex items-center gap-1 mt-1 text-[10px]">
                            {tieneInsumos ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/50 dark:border-blue-700/50" title={`${numInsumos} insumos`}>
                                <Layers size={10} />
                                {numInsumos}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Libre</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel informativo de la casilla actualmente seleccionada */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {seleccionada ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                      <MapPin size={15} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-gray-100">
                        Casilla Seleccionada: {seleccionada} (Fila {seleccionada.charAt(0)} - Columna {seleccionada.slice(1)})
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-gray-300">
                        {detalleSeleccionada?.insumos?.length
                          ? `Actualmente aloja ${detalleSeleccionada.insumos.length} insumo(s)`
                          : 'Casilla completamente vacía y disponible para almacenamiento'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLimpiar}
                    className="text-[11px] text-slate-500 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 font-medium px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Desmarcar
                  </button>
                </div>

                {/* Vista previa de lo que hay en la casilla */}
                {detalleSeleccionada && detalleSeleccionada.insumos?.length > 0 && (
                  <div className="max-h-24 overflow-y-auto space-y-1 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700">
                    {detalleSeleccionada.insumos.map((i) => (
                      <div key={i.idInsumo} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-gray-300 bg-white dark:bg-slate-800/90 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                        <span className="truncate max-w-[320px] font-medium">📦 {i.codigoInterno} - {i.descripcion}</span>
                        <span className="font-semibold text-slate-700 dark:text-gray-200 shrink-0">Stock: {i.stockActual}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-400">
                <Info size={15} />
                <span>No hay ninguna casilla seleccionada. El insumo se guardará sin coordenada física asignada.</span>
              </div>
            )}
          </div>
        </div>

        {/* Pie con botones */}
        <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLimpiar}
            className="text-xs font-semibold text-slate-500 dark:text-gray-300 hover:text-slate-700 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/60 transition cursor-pointer"
          >
            Sin Ubicación
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Confirmar Asignación</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
