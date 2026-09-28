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
  Info
} from 'lucide-react';

export default function ModalDetalleInsumo({ 
  isOpen, 
  insumo, 
  onClose, 
  onUpdate, 
  onDelete,
  readOnly = false,
  canDelete = true
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sincronizar formData cuando cambia el insumo seleccionado
  useEffect(() => {
    if (insumo) {
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
        estadoActivo: insumo.estadoActivo ?? 1
      });
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setError('');
    }
  }, [insumo, isOpen]);

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

    const payload = {
      ...formData,
      stockActual: Number(formData.stockActual),
      stockSeguridad: Number(formData.stockSeguridad),
      fechaVencimiento: esPeriferico ? null : (formData.fechaVencimiento || null)
    };

    setIsSaving(true);
    setError('');
    try {
      await onUpdate(payload);
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
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
              {isEditing ? <Edit3 size={20} /> : <Box size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  {isEditing ? 'Editar Ficha de Insumo' : 'Detalles del Insumo'}
                </h3>
                <span className="bg-slate-200/70 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {formData.codigoInterno}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Modifique los valores técnicos y guarde' : 'Información detallada registrada en el sistema'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* MODO EDICIÓN */}
          {isEditing ? (
            <form id="form-edit-insumo" onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Código Interno</label>
                  <input
                    type="text"
                    name="codigoInterno"
                    value={formData.codigoInterno}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-medium text-slate-700"
                  >
                    <option value="Insumo">Insumo (Consumibles, tóner, hojas, tintas)</option>
                    <option value="Periférico">Periférico (Mouse, teclado, etc.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Actual (Uds.)</label>
                  <input
                    type="number"
                    min="0"
                    name="stockActual"
                    value={formData.stockActual}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stock de Seguridad</label>
                  <input
                    type="number"
                    min="0"
                    name="stockSeguridad"
                    value={formData.stockSeguridad}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicación Fila / Depósito</label>
                  <input
                    type="text"
                    name="ubicacionFila"
                    value={formData.ubicacionFila}
                    onChange={handleChange}
                    placeholder="Ej. Almacén A-1"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicación Columna / Estante</label>
                  <input
                    type="text"
                    name="ubicacionColumna"
                    value={formData.ubicacionColumna}
                    onChange={handleChange}
                    placeholder="Ej. Estante 3"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Fecha de Vencimiento / Caducidad
                  </label>
                  {esPeriferico ? (
                    <div className="w-full px-3 py-2 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 flex items-center gap-1.5 select-none">
                      <Info size={14} className="text-slate-400 shrink-0" />
                      <span>No aplica a periféricos (sin vencimiento)</span>
                    </div>
                  ) : (
                    <input
                      type="date"
                      name="fechaVencimiento"
                      value={formData.fechaVencimiento}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700"
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
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="editEstadoActivo" className="text-xs font-medium text-slate-700 cursor-pointer">
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
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-800">¿Desea eliminar este insumo?</h4>
                      <p className="text-xs text-rose-600 mt-0.5">
                        El insumo <strong>{formData.codigoInterno} - {formData.descripcion}</strong> será quitado del catálogo institucional.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200/60">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg transition"
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
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Descripción</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    <Layers size={12} />
                    {formData.categoria}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 leading-snug">
                  {formData.descripcion}
                </h4>
              </div>

              {/* Métricas de Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border ${
                  isCritico 
                    ? 'bg-rose-50/50 border-rose-200' 
                    : 'bg-emerald-50/50 border-emerald-200'
                }`}>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock Actual</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-2xl font-black ${isCritico ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formData.stockActual}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">unidades</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                    {isCritico ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertTriangle size={13} /> Stock Crítico
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Nivel Óptimo
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock de Seguridad</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-slate-700">
                      {formData.stockSeguridad}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">umbral mín.</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {formData.stockActual <= formData.stockSeguridad 
                      ? '⚠️ Reposición prioritaria' 
                      : 'Margen seguro'}
                  </p>
                </div>
              </div>

              {/* Grid de Especificaciones Técnicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Ubicación */}
                <div className="p-3.5 bg-white border border-slate-100 rounded-xl flex items-start gap-3 shadow-2xs">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ubicación Física</span>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {formData.ubicacionFila || 'Sin depósito asignado'}
                    </p>
                    {formData.ubicacionColumna && (
                      <p className="text-[11px] text-slate-400">Estante / Col: {formData.ubicacionColumna}</p>
                    )}
                  </div>
                </div>

                {/* Vencimiento */}
                <div className="p-3.5 bg-white border border-slate-100 rounded-xl flex items-start gap-3 shadow-2xs">
                  <div className={`p-2 rounded-lg shrink-0 ${esPeriferico ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600'}`}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Caducidad / Garantía</span>
                    <p className={`font-semibold mt-0.5 ${esPeriferico ? 'text-slate-500' : 'text-slate-700'}`}>
                      {esPeriferico ? 'No aplica (Periférico)' : (formData.fechaVencimiento || 'No registrada')}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {esPeriferico ? 'Sin fecha de vencimiento' : 'Control preventivo'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estado para Despacho */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Estado para Despacho</span>
                {formData.estadoActivo === 1 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Activo y Disponible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Inactivo / Bloqueado
                  </span>
                )}
              </div>

            </div>
          )}
        </div>

        {/* PIE DE ACCIONES */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                form="form-edit-insumo"
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
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
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>Eliminar Insumo</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Editar Insumo</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
