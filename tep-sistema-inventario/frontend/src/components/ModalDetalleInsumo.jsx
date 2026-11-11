import { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Trash2, 
  Box, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Save, 
  RotateCcw,
  AlertCircle,
  Info,
  Grid,
  Laptop,
  Printer,
  Check
} from 'lucide-react';
import ModalSelectorEstante from './ModalSelectorEstante';
import { parsearUbicacion } from '../utils/shelfHelper';
import { listarEquipos } from '../services/equiposService';
import { obtenerInsumoPorId } from '../services/insumosService';

export default function ModalDetalleInsumo({ 
  isOpen, 
  insumo, 
  onClose, 
  onUpdate, 
  onDelete,
  readOnly = false,
  canDelete = true
}) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState('');

  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [equiposVinculados, setEquiposVinculados] = useState([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sincronizar formData y consultar equipos compatibles desde el GET del backend
  useEffect(() => {
    if (insumo && isOpen) {
      const inicialesVinculados = Array.isArray(insumo.equiposCompatibles) ? insumo.equiposCompatibles : [];
      const inicialesIds = Array.isArray(insumo.equiposAsociados)
        ? insumo.equiposAsociados.map(Number)
        : inicialesVinculados.map((eq) => Number(eq.idEquipo));

      setFormData({
        idInsumo: insumo.idInsumo,
        codigoInterno: insumo.codigoInterno || '',
        descripcion: insumo.descripcion || '',
        categoria: insumo.categoria || 'Insumo',
        stockActual: insumo.stockActual ?? 0,
        stockSeguridad: insumo.stockSeguridad ?? 5,
        ubicacionFila: insumo.ubicacionFila || '',
        ubicacionColumna: insumo.ubicacionColumna || '',
        fechaVencimiento: insumo.fechaVencimiento === '9999-12-31' ? '' : (insumo.fechaVencimiento || ''),
        estadoActivo: insumo.estadoActivo ?? 1,
        equiposAsociados: inicialesIds
      });
      setEquiposVinculados(inicialesVinculados);
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setError('');

      setCargandoEquipos(true);
      Promise.all([
        listarEquipos().catch(() => []),
        obtenerInsumoPorId(insumo.idInsumo).catch(() => null)
      ])
        .then(([listaEquipos, detalleInsumo]) => {
          const activos = (Array.isArray(listaEquipos) ? listaEquipos : []).filter(
            (eq) => eq.estadoOperativo !== 'Baja'
          );
          setEquiposDisponibles(activos);

          if (detalleInsumo) {
            const vinculados = Array.isArray(detalleInsumo.equiposCompatibles)
              ? detalleInsumo.equiposCompatibles
              : [];
            const ids = Array.isArray(detalleInsumo.equiposAsociados)
              ? detalleInsumo.equiposAsociados.map(Number)
              : vinculados.map((eq) => Number(eq.idEquipo));

            setEquiposVinculados(vinculados);
            setFormData((prev) => (prev ? { ...prev, equiposAsociados: ids } : prev));
          }
        })
        .finally(() => setCargandoEquipos(false));
    }
  }, [insumo, isOpen]);

  // Manejador para tildar/destildar equipos compatibles en modo edición
  const handleToggleEquipo = (idEquipo) => {
    const idNum = Number(idEquipo);
    setFormData((prev) => {
      const actuales = Array.isArray(prev.equiposAsociados) ? prev.equiposAsociados : [];
      const yaSeleccionado = actuales.includes(idNum);
      return {
        ...prev,
        equiposAsociados: yaSeleccionado
          ? actuales.filter((id) => id !== idNum)
          : [...actuales, idNum]
      };
    });
  };

  if (!isOpen || !insumo || !formData) return null;

  const isCritico = formData.stockActual <= formData.stockSeguridad;
  const esPeriferico = formData.categoria === 'Periférico';

  // Manejador genérico de campos en modo edición con limpieza de fecha para periféricos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const nuevo = {
        ...prev,
        [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
      };
      if (name === 'categoria' && value === 'Periférico') {
        nuevo.fechaVencimiento = '';
      }
      return nuevo;
    });
  };

  // Guardar edición en backend
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!formData.codigoInterno.trim() || !formData.descripcion.trim()) {
      setError('El código y la descripción son obligatorios.');
      return;
    }
    if (Number(formData.stockActual) < 0 || Number(formData.stockSeguridad) < 0) {
      setError('El stock no puede ser un número negativo.');
      return;
    }

    const nuevosEquiposCompatibles = equiposDisponibles
      .filter((eq) => (formData.equiposAsociados || []).includes(Number(eq.idEquipo)))
      .map((eq) => ({
        idEquipo: eq.idEquipo,
        codPatrimonial: eq.codPatrimonial,
        marcaModelo: eq.marcaModelo,
        tipoEquipo: eq.tipoEquipo
      }));

    const payload = {
      ...formData,
      stockActual: Number(formData.stockActual),
      stockSeguridad: Number(formData.stockSeguridad),
      fechaVencimiento: esPeriferico ? null : (formData.fechaVencimiento || null),
      equiposAsociados: formData.equiposAsociados || [],
      equiposCompatibles: nuevosEquiposCompatibles
    };

    setIsSaving(true);
    setError('');
    try {
      await onUpdate(payload);
      setEquiposVinculados(nuevosEquiposCompatibles);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Error al actualizar el insumo en el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar baja lógica en backend
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete(insumo.idInsumo);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al dar de baja el insumo.');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 max-h-[90vh] flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              {isEditing ? <Edit3 size={20} /> : <Box size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-gray-100">
                  {isEditing ? 'Editar Ficha de Insumo' : 'Detalles del Insumo'}
                </h3>
                <span className="bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-gray-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {formData.codigoInterno}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-400">
                {isEditing ? 'Modifique los valores técnicos y guarde' : 'Información detallada registrada en el sistema'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* MODO EDICIÓN */}
          {isEditing ? (
            <form id="form-edit-insumo" onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Código Interno</label>
                  <input
                    type="text"
                    name="codigoInterno"
                    value={formData.codigoInterno}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Categoría</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-medium text-slate-700 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                  >
                    <option value="Insumo">Insumo (Consumibles, tóner, hojas, tintas)</option>
                    <option value="Periférico">Periférico (Mouse, teclado, etc.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Stock Actual (Uds.)</label>
                  <input
                    type="number"
                    min="0"
                    name="stockActual"
                    value={formData.stockActual}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Stock de Seguridad</label>
                  <input
                    type="number"
                    min="0"
                    name="stockSeguridad"
                    value={formData.stockSeguridad}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Ubicación física en depósito / Estantería */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">
                  Ubicación Física en Estantería (Depósito)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna) ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-gray-100">
                          {parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna) 
                            ? `Casilla ${parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna).coordenada}`
                            : 'Sin casilla asignada'}
                        </span>
                        {parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna) && (
                          <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-700/50">
                            Estante {parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna).fila} - Columna {parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna).columna}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-gray-400">
                        {formData.ubicacionFila || formData.ubicacionColumna 
                          ? `${formData.ubicacionFila || 'S/F'} • ${formData.ubicacionColumna || 'S/C'}`
                          : 'Haga clic para seleccionar una coordenada física del estante'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSelectorOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-gray-200 rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Grid size={13} className="text-blue-600 dark:text-blue-400" />
                      <span>{parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna) ? 'Cambiar Casilla' : 'Seleccionar en Estante'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Atajo de Asociación de Equipos Compatibles (Checkboxes pre-marcados) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300">
                    Equipos Compatibles (Opcional)
                  </label>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    {(formData.equiposAsociados || []).length} seleccionados
                  </span>
                </div>
                <div className="max-h-44 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {cargandoEquipos ? (
                    <p className="text-xs text-slate-400 dark:text-gray-400 py-4 text-center">
                      Cargando equipos disponibles...
                    </p>
                  ) : equiposDisponibles.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-gray-400 py-4 text-center">
                      No hay equipos activos disponibles para asociar.
                    </p>
                  ) : (
                    equiposDisponibles.map((eq) => {
                      const isChecked = (formData.equiposAsociados || []).includes(Number(eq.idEquipo));
                      const esImp = (eq.tipoEquipo || '').toLowerCase().includes('impresora');

                      return (
                        <label
                          key={eq.idEquipo}
                          className={`flex items-center justify-between gap-3 px-3.5 py-3 text-xs cursor-pointer transition-colors select-none group ${
                            isChecked
                              ? 'bg-blue-50/70 dark:bg-blue-950/35 hover:bg-blue-100/60 dark:hover:bg-blue-900/40'
                              : 'hover:bg-slate-100/80 dark:hover:bg-slate-700/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleEquipo(eq.idEquipo)}
                              className="peer sr-only accent-blue-600"
                            />
                            <span
                              className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0 ${
                                isChecked
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                  : 'bg-transparent border-slate-300 dark:border-slate-500 group-hover:border-blue-500 dark:group-hover:border-slate-400'
                              }`}
                            >
                              {isChecked && <Check size={11} strokeWidth={3} />}
                            </span>
                            {esImp ? (
                              <Printer size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                            ) : (
                              <Laptop size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white truncate transition-colors">
                              {eq.marcaModelo}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-400 shrink-0">
                            {eq.codPatrimonial || 'S/N'}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">
                    Fecha de Vencimiento / Caducidad
                  </label>
                  {esPeriferico ? (
                    <div className="w-full px-3 py-2 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-gray-400 flex items-center gap-1.5 select-none">
                      <Info size={14} className="text-slate-400 dark:text-gray-400 shrink-0" />
                      <span>No aplica a periféricos (sin vencimiento)</span>
                    </div>
                  ) : (
                    <input
                      type="date"
                      name="fechaVencimiento"
                      value={formData.fechaVencimiento}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="editEstadoActivo"
                    name="estadoActivo"
                    checked={formData.estadoActivo === 1}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                  />
                  <label htmlFor="editEstadoActivo" className="text-xs font-medium text-slate-700 dark:text-gray-200 cursor-pointer">
                    Insumo Activo para Despacho
                  </label>
                </div>
              </div>
            </form>
          ) : (
            /* MODO VISUALIZACIÓN DETALLADA */
            <div className="space-y-4">
              
              {/* Alerta de confirmación de eliminación si está activa */}
              {showDeleteConfirm && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-xl">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-800 dark:text-rose-200">¿Desea eliminar este insumo?</h4>
                      <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
                        El insumo <strong>{formData.codigoInterno} - {formData.descripcion}</strong> será quitado del catálogo institucional.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/50">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition"
                    >
                      Sí, Eliminar Definitivamente
                    </button>
                  </div>
                </div>
              )}

              {/* Título y descripción principal */}
              <div className="bg-slate-50/80 dark:bg-slate-700/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-400">Descripción</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    <Layers size={12} />
                    {formData.categoria}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 leading-snug">
                  {formData.descripcion}
                </h4>
              </div>

              {/* Métricas de Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border ${
                  isCritico 
                    ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' 
                    : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                }`}>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Stock Actual</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-2xl font-black ${isCritico ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {formData.stockActual}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-gray-400 font-medium">unidades</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                    {isCritico ? (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle size={13} /> Stock Crítico
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Nivel Óptimo
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Stock de Seguridad</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-slate-700 dark:text-gray-100">
                      {formData.stockSeguridad}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-gray-400 font-medium">umbral mín.</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400 dark:text-gray-400">
                    {formData.stockActual <= formData.stockSeguridad 
                      ? '⚠️ Reposición prioritaria' 
                      : 'Margen seguro'}
                  </p>
                </div>
              </div>

              {/* Grid de Especificaciones Técnicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Ubicación */}
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl flex items-start gap-3 shadow-2xs">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-400 tracking-wider">Ubicación Física</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-semibold text-slate-700 dark:text-gray-200">
                        {formData.ubicacionFila || 'Sin depósito asignado'}
                      </p>
                      {parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna) && (
                        <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-700/50">
                          Casilla {parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna).coordenada}
                        </span>
                      )}
                    </div>
                    {formData.ubicacionColumna && (
                      <p className="text-[11px] text-slate-400 dark:text-gray-400">Estante / Col: {formData.ubicacionColumna}</p>
                    )}
                  </div>
                </div>

                {/* Vencimiento */}
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl flex items-start gap-3 shadow-2xs">
                  <div className={`p-2 rounded-lg shrink-0 ${esPeriferico ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-gray-400' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'}`}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-400 tracking-wider">Caducidad / Garantía</span>
                    <p className={`font-semibold mt-0.5 ${esPeriferico ? 'text-slate-500 dark:text-gray-400' : 'text-slate-700 dark:text-gray-200'}`}>
                      {esPeriferico ? 'No aplica (Periférico)' : (formData.fechaVencimiento || 'No registrada')}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-gray-400">
                      {esPeriferico ? 'Sin fecha de vencimiento' : 'Control preventivo'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección de Solo Lectura: Equipos Compatibles */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-400 tracking-wider">
                    Equipos Compatibles
                  </span>
                  {equiposVinculados.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">
                      {equiposVinculados.length} {equiposVinculados.length === 1 ? 'equipo' : 'equipos'}
                    </span>
                  )}
                </div>
                {cargandoEquipos && equiposVinculados.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-gray-400 italic">
                    Consultando equipos compatibles...
                  </p>
                ) : equiposVinculados.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-400 italic">
                    Sin equipos asociados
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {equiposVinculados.map((eq) => (
                      <span
                        key={eq.idEquipo}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600"
                      >
                        <span>{eq.marcaModelo}</span>
                        {eq.codPatrimonial && (
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            ({eq.codPatrimonial})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Estado para Despacho */}
              <div className="p-3 bg-slate-50/80 dark:bg-slate-700/40 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-600 dark:text-gray-300">Estado para Despacho</span>
                {formData.estadoActivo === 1 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Activo y Disponible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Inactivo / Bloqueado
                  </span>
                )}
              </div>

            </div>
          )}
        </div>

        {/* PIE DE ACCIONES */}
        <div className="px-6 py-4 bg-slate-50/60 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                form="form-edit-insumo"
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all duration-200 ease-in-out hover:brightness-110 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={14} />
                <span>Guardar Cambios</span>
              </button>
            </>
          ) : readOnly ? (
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={showDeleteConfirm}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>Eliminar Insumo</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all duration-200 ease-in-out hover:brightness-110 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Editar Insumo</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal Selector Interactivo de Casilla de Estante */}
        <ModalSelectorEstante
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          coordenadaActual={parsearUbicacion(formData.ubicacionFila, formData.ubicacionColumna)?.coordenada}
          onSelect={(info) => {
            if (info) {
              setFormData((prev) => ({
                ...prev,
                ubicacionFila: info.ubicacionFila,
                ubicacionColumna: info.ubicacionColumna
              }));
            } else {
              setFormData((prev) => ({
                ...prev,
                ubicacionFila: '',
                ubicacionColumna: ''
              }));
            }
          }}
        />

      </div>
    </div>
  );
}
