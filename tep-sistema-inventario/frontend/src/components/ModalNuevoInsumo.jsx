import { useState } from 'react';
import { X, PlusCircle, AlertCircle, Info, MapPin, Grid } from 'lucide-react';
import ModalSelectorEstante from './ModalSelectorEstante';
import { parsearUbicacion } from '../utils/shelfHelper';

export default function ModalNuevoInsumo({ isOpen, onClose, onSave }) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  // 1. ZONA JAVASCRIPT: Estados vinculados a las columnas de la tabla 'insumos'
  const [formData, setFormData] = useState({
    codigoInterno: '',
    descripcion: '',
    categoria: 'Insumo',
    stockActual: 0,
    stockSeguridad: 5,
    ubicacionFila: '',
    ubicacionColumna: '',
    fechaVencimiento: '',
    estadoActivo: 1
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Manejador genérico de campos con limpieza de fecha para periféricos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const nuevo = {
        ...prev,
        [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
      };
      // Si se selecciona la categoría Periférico, la fecha de vencimiento pasa automáticamente a vacía/null
      if (name === 'categoria' && value === 'Periférico') {
        nuevo.fechaVencimiento = '';
      }
      return nuevo;
    });
  };

  const esPeriferico = formData.categoria === 'Periférico';

  // 2. FUNCIÓN DE ENVÍO: Validación y guardado en backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.codigoInterno.trim() || !formData.descripcion.trim()) {
      setError('El código interno y la descripción son campos obligatorios.');
      return;
    }

    if (Number(formData.stockActual) < 0 || Number(formData.stockSeguridad) < 0) {
      setError('Las cantidades de stock no pueden ser negativas.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        stockActual: Number(formData.stockActual),
        stockSeguridad: Number(formData.stockSeguridad),
        // Si es periférico el valor enviado es null; si es insumo y no se ingresó fecha también es null
        fechaVencimiento: esPeriferico ? null : (formData.fechaVencimiento || null)
      });
      setFormData({
        codigoInterno: '',
        descripcion: '',
        categoria: 'Insumo',
        stockActual: 0,
        stockSeguridad: 5,
        ubicacionFila: '',
        ubicacionColumna: '',
        fechaVencimiento: '',
        estadoActivo: 1
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el insumo en el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. ZONA VISUAL (Modal con diseño Tailwind)
  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 max-h-[90vh] flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Encabezado del Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100">Registrar Nuevo Insumo / Periférico</h3>
            <p className="text-xs text-slate-400 dark:text-gray-400">Complete los datos técnicos para el inventario institucional</p>
          </div>
          <button 
            onClick={onClose} 
            type="button" 
            className="text-slate-400 dark:text-gray-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido / Formulario scrolleable */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Fila 1: Código Interno y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Código Interno</label>
              <input
                type="text"
                name="codigoInterno"
                value={formData.codigoInterno}
                onChange={handleChange}
                placeholder="Ej. INS-009 o PER-001"
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Categoría</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-medium text-slate-700 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
              >
                <option value="Insumo">Insumo (Consumibles, tóner, hojas, tintas)</option>
                <option value="Periférico">Periférico (Mouse, teclado, etc.)</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Descripción amplia */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Descripción del Insumo / Periférico</label>
            <textarea
              name="descripcion"
              rows={2}
              value={formData.descripcion}
              onChange={handleChange}
              placeholder={esPeriferico ? "Ej. Mouse Óptico USB Genius DX-120 Negro..." : "Ej. Tóner Láser HP 85A Negro original para impresora de secretaría..."}
              required
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
            />
          </div>

          {/* Fila 3: Stocks (Actual y Seguridad) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Stock Actual (Unidades)</label>
              <input
                type="number"
                name="stockActual"
                min="0"
                value={formData.stockActual}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Stock de Seguridad (Umbral Mínimo)</label>
              <input
                type="number"
                name="stockSeguridad"
                min="0"
                value={formData.stockSeguridad}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Fila 4: Ubicación física en depósito / Estantería */}
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

          {/* Fila 5: Vencimiento y Estado Activo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
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
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                />
              )}
            </div>
            <div className="flex items-center gap-2 pt-4 sm:pt-5">
              <input
                type="checkbox"
                id="estadoActivo"
                name="estadoActivo"
                checked={formData.estadoActivo === 1}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
              />
              <label htmlFor="estadoActivo" className="text-xs font-medium text-slate-700 dark:text-gray-200 cursor-pointer select-none">
                Insumo Activo para Despacho
              </label>
            </div>
          </div>

          {/* Botones de acción al pie del modal */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all duration-200 ease-in-out hover:brightness-110 active:scale-95 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <PlusCircle size={15} className={isSubmitting ? 'animate-spin' : ''} />
              <span>{isSubmitting ? 'Guardando en BD...' : 'Guardar Insumo'}</span>
            </button>
          </div>
        </form>

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