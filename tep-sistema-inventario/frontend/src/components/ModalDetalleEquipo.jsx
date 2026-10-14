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
  ShieldCheck,
  History
} from 'lucide-react';
import { obtenerHistorialEquipo } from '../services/equiposService';

export default function ModalDetalleEquipo({ 
  isOpen, 
  equipo, 
  sectores = [], 
  insumos = [],
  equipos = [],
  onClose, 
  onUpdate, 
  onDelete,
  readOnly = false,
  canDelete = true
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showBajaConfirm, setShowBajaConfirm] = useState(false);
  const [motivoBajaInput, setMotivoBajaInput] = useState('');
  const [formData, setFormData] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
    if (equipo) {
      setFormData({ ...equipo });
      setIsEditing(false);
      setShowBajaConfirm(false);
      setMotivoBajaInput('');

      if (equipo.idEquipo) {
        setCargandoHistorial(true);
        obtenerHistorialEquipo(equipo.idEquipo)
          .then((data) => setHistorial(Array.isArray(data) ? data : []))
          .catch(() => setHistorial([]))
          .finally(() => setCargandoHistorial(false));
      }
    }
  }, [equipo, isOpen]);

  if (!isOpen || !equipo || !formData) return null;

  // Validación preventiva de conflictos de unicidad (S/N, Código Patrimonial, IP)
  const codPatEnUso = equipos.find(
    (eq) => Number(eq.idEquipo) !== Number(equipo.idEquipo) &&
            formData.codPatrimonial?.trim() &&
            eq.codPatrimonial?.toLowerCase().trim() === formData.codPatrimonial.toLowerCase().trim()
  );

  const serieEnUso = equipos.find(
    (eq) => Number(eq.idEquipo) !== Number(equipo.idEquipo) &&
            formData.numeroSerie?.trim() &&
            eq.numeroSerie?.toLowerCase().trim() === formData.numeroSerie.toLowerCase().trim()
  );

  const ipEnUso = equipos.find((eq) => {
    const ip = formData.ipFija?.trim();
    if (!ip || ip === '0.0.0.0' || ip.toLowerCase() === 'dhcp' || ip.toLowerCase().includes('no aplica')) {
      return false;
    }
    return Number(eq.idEquipo) !== Number(equipo.idEquipo) && eq.ipFija?.trim() === ip && eq.estadoOperativo !== 'Baja';
  });

  const esImpresora = 
    formData.tipoEquipo === 'impresora' || 
    formData.tipoEquipo === 'Impresora' ||
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
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (codPatEnUso) {
      alert(`Código patrimonial duplicado: El código "${formData.codPatrimonial}" ya pertenece al equipo "${codPatEnUso.marcaModelo}" (ID: ${codPatEnUso.idEquipo}). Cada bien patrimonial del TEP debe tener un código único.`);
      return;
    }
    if (ipEnUso && formData.estadoOperativo !== 'Baja') {
      alert(`Conflicto de red: La dirección IP "${formData.ipFija}" ya está asignada al equipo "${ipEnUso.marcaModelo}" (${ipEnUso.tipoEquipo}). Dos dispositivos activos en la red no pueden compartir la misma IP.`);
      return;
    }
    await onUpdate(formData);

    setIsEditing(false);

    // Recargar historial del equipo de inmediato para reflejar traslados o cambios
    if (equipo?.idEquipo) {
      setCargandoHistorial(true);
      obtenerHistorialEquipo(equipo.idEquipo)
        .then((data) => setHistorial(Array.isArray(data) ? data : []))
        .catch(() => setHistorial([]))
        .finally(() => setCargandoHistorial(false));
    }
  };

  // Acción rápida: Cambiar estado operativo
  const handleCambiarEstado = async (nuevoEstado) => {
    const motivo = nuevoEstado === 'En Mantenimiento'
      ? 'Envío a mantenimiento técnico / reparación'
      : nuevoEstado === 'Operativo'
      ? 'Retorno de servicio técnico - Restablecido a Operativo'
      : `Cambio de estado operativo a ${nuevoEstado}`;

    const actualizado = {
      ...formData,
      estadoOperativo: nuevoEstado,
      estado: nuevoEstado.toUpperCase(),
      motivoBaja: motivo
    };
    setFormData(actualizado);
    await onUpdate(actualizado);

    if (equipo?.idEquipo) {
      setCargandoHistorial(true);
      obtenerHistorialEquipo(equipo.idEquipo)
        .then((data) => setHistorial(Array.isArray(data) ? data : []))
        .catch(() => setHistorial([]))
        .finally(() => setCargandoHistorial(false));
    }
  };

  // Confirmar baja patrimonial
  const handleConfirmBaja = () => {
    onDelete(equipo.idEquipo || equipo.id, motivoBajaInput.trim() || 'Baja patrimonial / descarte definitivo');
    onClose();
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
            <div className={`p-2.5 rounded-xl ${
              esImpresora ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {esImpresora ? <Printer size={20} /> : <Laptop size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-gray-100">
                  {isEditing ? 'Editar Equipo Patrimonial' : 'Ficha Técnica de Equipo'}
                </h3>
                <span className="bg-slate-200/80 text-slate-700 dark:text-gray-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {formData.codPatrimonial || 'S/N Patrimonial'}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-400">
                {formData.marcaModelo} • {formData.nombreSector || formData.sector}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 dark:text-gray-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* AVISO DE CONFIRMACIÓN DE BAJA CON JUSTIFICACIÓN RN-02 */}
          {showBajaConfirm && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-rose-800">¿Desea dar de baja este equipo?</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    El bien <strong>{formData.codPatrimonial || 'Sin Código'} - {formData.marcaModelo}</strong> pasará a estado de <strong>Baja Patrimonial</strong>. Se mantendrá el historial de auditoría inmutable (RNF-03).
                  </p>
                  <div className="mt-2.5">
                    <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                      Motivo o Justificación de la Baja (Requisito RN-02):
                    </label>
                    <input
                      type="text"
                      value={motivoBajaInput}
                      onChange={(e) => setMotivoBajaInput(e.target.value)}
                      placeholder="Ej. Obsolescencia técnica / Falla irreparable / Descarte"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-rose-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200/60">
                <button
                  type="button"
                  onClick={() => setShowBajaConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-white rounded-lg transition cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Cód. Patrimonial</label>
                  <input
                    type="text"
                    name="codPatrimonial"
                    value={formData.codPatrimonial}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 text-xs border rounded-xl font-mono focus:outline-none transition ${
                      codPatEnUso 
                        ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-500' 
                        : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {codPatEnUso && (
                    <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                      <span>Conflicto: Ya asignado a {codPatEnUso.marcaModelo}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Marca y Modelo</label>
                  <input
                    type="text"
                    name="marcaModelo"
                    value={formData.marcaModelo}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 focus:outline-none dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Sector Asignado</label>
                  <select
                    name="idSector"
                    value={formData.idSector}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 bg-white dark:bg-slate-800 dark:text-white dark:placeholder-gray-400"
                  >
                    {sectores.map((sec) => (
                      <option key={sec.idSector} value={sec.idSector}>
                        {sec.nombreOficina || sec.nombreSector}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Estado Operativo</label>
                  <select
                    name="estadoOperativo"
                    value={formData.estadoOperativo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 bg-white dark:bg-slate-800 dark:text-white dark:placeholder-gray-400"
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
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Hardware y Sistema</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Procesador</label>
                      <input
                        type="text"
                        name="procesador"
                        value={formData.procesador || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Memoria RAM</label>
                      <input
                        type="text"
                        name="memoriaRAM"
                        value={formData.memoriaRAM || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Almacenamiento</label>
                      <input
                        type="text"
                        name="almacenamiento"
                        value={formData.almacenamiento || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Sistema Operativo</label>
                      <input
                        type="text"
                        name="sistemaOperativo"
                        value={formData.sistemaOperativo || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {esImpresora && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
                  <span className="text-[11px] font-bold text-amber-700 uppercase">Configuración de Impresión</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Insumo / Tóner Compatible</label>
                      <select
                        name="idInsumoCompatible"
                        value={formData.idInsumoCompatible || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white dark:placeholder-gray-400"
                      >
                        <option value="">-- Sin insumo específico asignado --</option>
                        {insumos.map((ins) => (
                          <option key={ins.idInsumo} value={ins.idInsumo}>
                            {ins.descripcion} ({ins.codigoInterno})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Tecnología de Impresión</label>
                      <input
                        type="text"
                        name="tecnologiaImpresion"
                        value={formData.tecnologiaImpresion || formData.tipoImpresion || ''}
                        onChange={handleChange}
                        placeholder="Ej. Láser Monocromática / Térmica"
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">IP Fija en Red</label>
                <input
                  type="text"
                  name="ipFija"
                  value={formData.ipFija || ''}
                  onChange={handleChange}
                  placeholder="Ej. 192.168.10.202"
                  className={`w-full px-3 py-2 text-xs border rounded-xl font-mono focus:outline-none transition ${
                    ipEnUso 
                      ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-500' 
                      : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
                {ipEnUso && (
                  <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                    <span>Conflicto: Ya asignada a {ipEnUso.marcaModelo} ({ipEnUso.tipoEquipo})</span>
                  </p>
                )}
              </div>
            </form>
          ) : (
            /* MODO VISUALIZACIÓN */
            <div className="space-y-4">
              {/* Barra de Estado y Acciones Rápidas */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-gray-400">Estado Operativo Actual</span>
                  <div className="mt-1">
                    {formData.estadoOperativo === 'Operativo' || formData.estado === 'OPERATIVO' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={14} />
                        Operativo en Servicio
                      </span>
                    ) : formData.estadoOperativo === 'En Mantenimiento' || formData.estado === 'EN REPARACIÓN' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Wrench size={14} />
                        En Mantenimiento Técnico
                      </span>
                    ) : formData.estadoOperativo === 'En Depósito' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        En Depósito / Reserva
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-slate-700">
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
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-lg transition cursor-pointer flex items-center gap-1"
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
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition cursor-pointer flex items-center gap-1"
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
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
                      title="Guardar en reserva"
                    >
                      A Depósito
                    </button>
                  )}
                </div>
              </div>

              {/* Ficha Principal de Ubicación y Red */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xs flex items-start gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-400">Sector / Dependencia</span>
                    <p className="font-bold text-slate-800 dark:text-gray-100 mt-0.5">{formData.nombreSector || formData.sector}</p>
                    <p className="text-[11px] text-slate-400 dark:text-gray-400">Asignación física</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xs flex items-start gap-2.5">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-gray-300 rounded-lg shrink-0">
                    <Network size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-400">Conectividad de Red</span>
                    <p className="font-bold text-slate-800 dark:text-gray-100 font-mono mt-0.5">{formData.ipFija || 'DHCP / No asignada'}</p>
                    <p className="text-[11px] text-slate-400 dark:text-gray-400">Máscara: {formData.mascaraSubred || '255.255.255.0'}</p>
                  </div>
                </div>
              </div>

              {/* ESPECIFICACIONES TÉCNICAS SEGÚN TIPO */}
              {esComputadora && (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-gray-200">
                    <Cpu size={15} className="text-blue-600 dark:text-blue-400" />
                    <span>Especificaciones de Cómputo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase">Procesador</span>
                      <p className="font-bold text-slate-800 dark:text-gray-100 mt-0.5">{formData.procesador || 'Intel Core i5'}</p>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase">Memoria RAM</span>
                      <p className="font-bold text-slate-800 dark:text-gray-100 mt-0.5">{formData.memoriaRAM || '16GB DDR4'}</p>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase">Almacenamiento</span>
                      <p className="font-bold text-slate-800 dark:text-gray-100 mt-0.5">{formData.almacenamiento || '512GB SSD'}</p>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase">Sistema Operativo</span>
                      <p className="font-bold text-slate-800 dark:text-gray-100 mt-0.5">{formData.sistemaOperativo || 'Windows 10 Pro'}</p>
                    </div>
                  </div>
                </div>
              )}

              {esImpresora && (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/60 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Printer size={15} className="text-amber-600 dark:text-amber-400" />
                    <span>Especificaciones de Impresión y Suministros</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-100/70 dark:border-amber-900/40">
                      <span className="text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase">Insumo Compatible</span>
                      <p className="font-bold text-slate-800 dark:text-gray-100 mt-0.5">
                        {formData.insumoCompatibleDescripcion || formData.tonerCompatible || 'Sin insumo asignado'}
                      </p>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-100/70 dark:border-amber-900/40">
                      <span className="text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase">Tecnología</span>
                      <p className="font-bold text-slate-800 dark:text-gray-100 mt-0.5">{formData.tecnologiaImpresion || formData.tipoImpresion || 'Láser Monocromática'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Número de Serie */}
              <div className="p-3 bg-slate-50/80 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-gray-300 font-medium">Número de Serie Oficial (S/N)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-gray-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {formData.numeroSerie || 'SN-NO-REGISTRADO'}
                </span>
              </div>

              {/* HISTORIAL Y TRAZABILIDAD (RN-02) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-gray-200">
                  <div className="flex items-center gap-1.5">
                    <History size={14} className="text-blue-600" />
                    <span>Trazabilidad e Historial del Equipo (RN-02)</span>
                  </div>
                  <span className="text-[10px] bg-slate-200/70 text-slate-600 dark:text-gray-300 font-mono px-2 py-0.5 rounded-full font-bold">
                    {historial.length} eventos
                  </span>
                </div>

                {cargandoHistorial ? (
                  <p className="text-xs text-slate-400 dark:text-gray-400 py-3 text-center">Consultando historial en base de datos...</p>
                ) : historial.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-gray-400 py-2 text-center italic">Sin registros de traslados anteriores.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {historial.map((h) => (
                      <div key={h.idHistorial} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-gray-100 flex items-center gap-1.5">
                            <span className="text-slate-500 dark:text-gray-300">{h.sectorAnterior}</span>
                            <ArrowRightLeft size={11} className="text-blue-500" />
                            <span className="text-blue-700">{h.sectorNuevo}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-gray-400 font-mono font-medium">
                            {h.fechaCambio}
                          </span>
                        </div>
                        {h.motivoBaja && (
                          <p className="text-[11px] text-slate-600 dark:text-gray-300 italic">
                            Motivo: {h.motivoBaja}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-200/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                form="form-edit-equipo"
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
                  onClick={() => setShowBajaConfirm(true)}
                  disabled={showBajaConfirm || formData.estadoOperativo === 'Baja' || formData.estado === 'BAJA'}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Trash2 size={14} />
                  <span>Dar de Baja</span>
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
