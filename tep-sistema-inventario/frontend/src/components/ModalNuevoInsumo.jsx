import { useState } from 'react';
import { X, PlusCircle, AlertCircle } from 'lucide-react';

export default function ModalNuevoInsumo({ isOpen, onClose, onSave }) {
  // 1. ZONA JAVASCRIPT: Estados vinculados a las columnas de la tabla 'insumos'
  const [formData, setFormData] = useState({
    codigoInterno: '',
    descripcion: '',
    categoria: 'Hardware',
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

  // Manejador genérico de campos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

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
        stockSeguridad: Number(formData.stockSeguridad)
      });
      setFormData({
        codigoInterno: '',
        descripcion: '',
        categoria: 'Hardware',
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
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Encabezado del Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Registrar Nuevo Insumo</h3>
            <p className="text-xs text-slate-400">Complete los datos técnicos para el inventario institucional</p>
          </div>
          <button 
            onClick={onClose} 
            type="button" 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Código Interno</label>
              <input
                type="text"
                name="codigoInterno"
                value={formData.codigoInterno}
                onChange={handleChange}
                placeholder="Ej. INS-009"
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="Hardware">Hardware</option>
                <option value="Equipos">Equipos</option>
                <option value="Periféricos">Periféricos</option>
                <option value="Cables">Cables</option>
                <option value="Multimedia">Multimedia</option>
                <option value="Mobiliario">Mobiliario</option>
                <option value="Consumibles">Consumibles</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Descripción amplia */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción del Insumo</label>
            <textarea
              name="descripcion"
              rows={2}
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Ej. Tóner Láser HP 85A Negro original para impresora de secretaría..."
              required
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
            />
          </div>

          {/* Fila 3: Stocks (Actual y Seguridad) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Actual (Unidades)</label>
              <input
                type="number"
                name="stockActual"
                min="0"
                value={formData.stockActual}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stock de Seguridad (Umbral Mínimo)</label>
              <input
                type="number"
                name="stockSeguridad"
                min="0"
                value={formData.stockSeguridad}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Fila 4: Ubicación física en depósito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicación Fila / Depósito</label>
              <input
                type="text"
                name="ubicacionFila"
                value={formData.ubicacionFila}
                onChange={handleChange}
                placeholder="Ej. Almacén B-02"
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicación Columna / Estante</label>
              <input
                type="text"
                name="ubicacionColumna"
                value={formData.ubicacionColumna}
                onChange={handleChange}
                placeholder="Ej. Estante 4"
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Fila 5: Vencimiento y Estado Activo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Vencimiento / Garantía</label>
              <input
                type="date"
                name="fechaVencimiento"
                value={formData.fechaVencimiento}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700"
              />
            </div>
            <div className="flex items-center gap-2 pt-4 sm:pt-5">
              <input
                type="checkbox"
                id="estadoActivo"
                name="estadoActivo"
                checked={formData.estadoActivo === 1}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="estadoActivo" className="text-xs font-medium text-slate-700 cursor-pointer">
                Insumo Activo para Despacho
              </label>
            </div>
          </div>

          {/* Botones de acción al pie del modal */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <PlusCircle size={15} className={isSubmitting ? 'animate-spin' : ''} />
              <span>{isSubmitting ? 'Guardando en BD...' : 'Guardar Insumo'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}