import { useState, useEffect } from 'react';
import { 
  X, 
  Laptop, 
  Printer, 
  Cpu, 
  HardDrive, 
  Network, 
  MapPin, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw,
  ArrowRightLeft,
  Building2,
  ShieldCheck
} from 'lucide-react';

export default function ModalDetalleEquipo({ 
  isOpen, 
  equipo, 
  sectores = [], 
  onClose, 
  onUpdate, 
  onDelete 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showBajaConfirm, setShowBajaConfirm] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (equipo) {
      setFormData({ ...equipo });
      setIsEditing(false);
      setShowBajaConfirm(false);
    }
  }, [equipo, isOpen]);

  if (!isOpen || !equipo || !formData) return null;

  const esImpresora = 
    formData.tipoEquipo === 'impresora' || 
    formData.marcaModelo.toLowerCase().includes('laserjet') || 
    formData.marcaModelo.toLowerCase().includes('impresora') || 
    formData.marcaModelo.toLowerCase().includes('brother') ||
    formData.marcaModelo.toLowerCase().includes('epson');

  const esComputadora = !esImpresora;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'idSector') {
      const sec = sectores.find((s) => String(s.idSector) === String(value));
      setFormData((prev) => ({
        ...prev,
        idSector: Number(value),
        nombreSector: sec ? (sec.nombreOficina || sec.nombreSector) : prev.nombreSector,
        sector: sec ? (sec.nombreOficina || sec.nombreSector) : prev.sector
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Guardar cambios de edición
  const handleSaveEdit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  // Acción rápida: Cambiar estado operativo
  const handleCambiarEstado = (nuevoEstado) => {
    const actualizado = {
      ...formData,
      estadoOperativo: nuevoEstado,
      estado: nuevoEstado.toUpperCase()
    };
    setFormData(actualizado);
    onUpdate(actualizado);
  };

  // Confirmar baja patrimonial
  const handleConfirmBaja = () => {
    onDelete(equipo.idEquipo || equipo.id);
    onClose();
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
            <div className={`p-2.5 rounded-xl ${
              esImpresora ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {esImpresora ? <Printer size={20} /> : <Laptop size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  {isEditing ? 'Editar Equipo Patrimonial' : 'Ficha Técnica de Equipo'}
                </h3>
                <span className="bg-slate-200/80 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {formData.codPatrimonial}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {formData.marcaModelo} • {formData.nombreSector || formData.sector}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* AVISO DE CONFIRMACIÓN DE BAJA */}
          {showBajaConfirm && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-800">¿Desea dar de baja este equipo?</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    El bien <strong>{formData.codPatrimonial} - {formData.marcaModelo}</strong> pasará a estado de <strong>Baja Patrimonial</strong>. Se mantendrá el historial de auditoría (RNF-03).
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200/60">
                <button
                  type="button"
                  onClick={() => setShowBajaConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBaja}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition cursor-pointer"
                >
                  Sí, Confirmar Baja
                </button>
              </div>
            </div>
          )}

          {/* MODO EDICIÓN */}
          {isEditing ? (
            <form id="form-edit-equipo" onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cód. Patrimonial</label>
                  <input
                    type="text"
                    name="codPatrimonial"
                    value={formData.codPatrimonial}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Marca y Modelo</label>
                  <input
                    type="text"
                    name="marcaModelo"
                    value={formData.marcaModelo}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sector Asignado</label>
                  <select
                    name="idSector"
                    value={formData.idSector}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 bg-white"
                  >
                    {sectores.map((sec) => (
                      <option key={sec.idSector} value={sec.idSector}>
                        {sec.nombreOficina || sec.nombreSector}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Estado Operativo</label>
                  <select
                    name="estadoOperativo"
                    value={formData.estadoOperativo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 bg-white"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                    <option value="En Depósito">En Depósito / Reserva</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              {/* Campos condicionales en modo edición */}
              {esComputadora && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Hardware y Sistema</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Procesador</label>
                      <input
                        type="text"
                        name="procesador"
                        value={formData.procesador || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Memoria RAM</label>
                      <input
                        type="text"
                        name="memoriaRAM"
                        value={formData.memoriaRAM || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Almacenamiento</label>
                      <input
                        type="text"
                        name="almacenamiento"
                        value={formData.almacenamiento || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sistema Operativo</label>
                      <input
                        type="text"
                        name="sistemaOperativo"
                        value={formData.sistemaOperativo || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {esImpresora && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold text-amber-700 uppercase">Configuración de Impresión</span>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tóner / Insumo Compatible</label>
                    <input
                      type="text"
                      name="tonerCompatible"
                      value={formData.tonerCompatible || ''}
                      onChange={handleChange}
                      placeholder="Ej. Tóner Brother TN-1060"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">IP Fija en Red</label>
                <input
                  type="text"
                  name="ipFija"
                  value={formData.ipFija || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </form>
          ) : (
            /* MODO VISUALIZACIÓN */
            <div className="space-y-4">
              {/* Barra de Estado y Acciones Rápidas */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Estado Operativo Actual</span>
                  <div className="mt-1">
                    {formData.estadoOperativo === 'Operativo' || formData.estado === 'OPERATIVO' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={14} />
                        Operativo en Servicio
                      </span>
                    ) : formData.estadoOperativo === 'En Mantenimiento' || formData.estado === 'EN REPARACIÓN' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Wrench size={14} />
                        En Mantenimiento Técnico
                      </span>
                    ) : formData.estadoOperativo === 'En Depósito' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        En Depósito / Reserva
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Baja Patrimonial
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones de cambio rápido de estado */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {formData.estadoOperativo !== 'En Mantenimiento' && formData.estado !== 'EN REPARACIÓN' && (
                    <button
                      type="button"
                      onClick={() => handleCambiarEstado('En Mantenimiento')}
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                      title="Enviar a servicio técnico"
                    >
                      <Wrench size={12} />
                      <span>A Reparación</span>
                    </button>
                  )}

                  {formData.estadoOperativo !== 'Operativo' && formData.estado !== 'OPERATIVO' && (
                    <button
                      type="button"
                      onClick={() => handleCambiarEstado('Operativo')}
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                      title="Restablecer a operativo"
                    >
                      <CheckCircle2 size={12} />
                      <span>A Operativo</span>
                    </button>
                  )}

                  {formData.estadoOperativo !== 'En Depósito' && (
                    <button
                      type="button"
                      onClick={() => handleCambiarEstado('En Depósito')}
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg transition cursor-pointer"
                      title="Guardar en reserva"
                    >
                      A Depósito
                    </button>
                  )}
                </div>
              </div>

              {/* Ficha Principal de Ubicación y Red */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-2xs flex items-start gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Sector / Dependencia</span>
                    <p className="font-bold text-slate-800 mt-0.5">{formData.nombreSector || formData.sector}</p>
                    <p className="text-[11px] text-slate-400">Asignación física</p>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-2xs flex items-start gap-2.5">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                    <Network size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Conectividad de Red</span>
                    <p className="font-bold text-slate-800 font-mono mt-0.5">{formData.ipFija || 'DHCP / No asignada'}</p>
                    <p className="text-[11px] text-slate-400">Máscara: {formData.mascaraSubred || '255.255.255.0'}</p>
                  </div>
                </div>
              </div>

              {/* ESPECIFICACIONES TÉCNICAS SEGÚN TIPO */}
              {esComputadora && (
                <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Cpu size={15} className="text-blue-600" />
                    <span>Especificaciones de Cómputo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Procesador</span>
                      <p className="font-bold text-slate-800 mt-0.5">{formData.procesador || 'Intel Core i5'}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Memoria RAM</span>
                      <p className="font-bold text-slate-800 mt-0.5">{formData.memoriaRAM || '16GB DDR4'}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Almacenamiento</span>
                      <p className="font-bold text-slate-800 mt-0.5">{formData.almacenamiento || '512GB SSD'}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Sistema Operativo</span>
                      <p className="font-bold text-slate-800 mt-0.5">{formData.sistemaOperativo || 'Windows 10 Pro'}</p>
                    </div>
                  </div>
                </div>
              )}

              {esImpresora && (
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <Printer size={15} className="text-amber-600" />
                    <span>Especificaciones de Impresión y Suministros</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-amber-100/70">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Tóner Compatible</span>
                      <p className="font-bold text-slate-800 mt-0.5">{formData.tonerCompatible || 'Tóner Láser Estándar'}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-amber-100/70">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Tecnología</span>
                      <p className="font-bold text-slate-800 mt-0.5">{formData.tipoImpresion || 'Láser Monocromática'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Número de Serie */}
              <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Número de Serie Oficial (S/N)</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {formData.numeroSerie || 'SN-NO-REGISTRADO'}
                </span>
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
                form="form-edit-equipo"
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={14} />
                <span>Guardar Cambios</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowBajaConfirm(true)}
                disabled={showBajaConfirm || formData.estadoOperativo === 'Baja' || formData.estado === 'BAJA'}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 size={14} />
                <span>Dar de Baja</span>
              </button>

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
                  <span>Editar Ficha</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
