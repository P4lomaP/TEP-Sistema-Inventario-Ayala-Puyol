import { useState } from 'react';
import { 
  X, 
  Plus, 
  Laptop, 
  Printer, 
  Cpu, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function ModalNuevoEquipo({ isOpen, onClose, onSave, sectores = [] }) {
  // Tipo de equipo seleccionado: limitado estrictamente a Computadoras e Impresoras
  const [tipoEquipo, setTipoEquipo] = useState('computadora'); // 'computadora' | 'impresora'

  // Estado del formulario unificado
  const [formData, setFormData] = useState({
    // Comunes
    codPatrimonial: '',
    marcaModelo: '',
    numeroSerie: '',
    idSector: sectores[0]?.idSector || 1,
    nombreSector: sectores[0]?.nombreOficina || 'Mesa de Entradas',
    estadoOperativo: 'Operativo',
    
    // Específicos de Computadoras (Desktop / All-in-One / Laptop)
    procesador: 'Intel Core i5-10400',
    memoriaRAM: '16GB DDR4',
    almacenamiento: '512GB SSD NVMe',
    sistemaOperativo: 'Windows 10 Pro 64-bit',
    ipFija: '',
    mascaraSubred: '255.255.255.0',
    workgroup: 'TRIBUNAL_SEC',

    // Específicos de Impresoras (Láser / Térmica / Multifunción)
    tipoImpresion: 'Láser Monocromática',
    tonerCompatible: 'Tóner Brother TN-1060',
    conexionImpresora: 'Red Ethernet (RJ-45)',
    formatoPapel: 'A4 / Oficio'
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'idSector') {
      const sectorObj = sectores.find((s) => String(s.idSector) === String(value));
      setFormData((prev) => ({
        ...prev,
        idSector: Number(value),
        nombreSector: sectorObj ? (sectorObj.nombreOficina || sectorObj.nombreSector) : prev.nombreSector
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.marcaModelo.trim() || !formData.numeroSerie.trim()) {
      setError('La marca/modelo y el número de serie son obligatorios.');
      return;
    }

    // Adaptar los atributos técnicos según el tipo de equipo
    let equipoNormalizado = {
      ...formData,
      tipoEquipo,
      codPatrimonial: formData.codPatrimonial.trim() || `PAT-2026-${Math.floor(100 + Math.random() * 900)}`
    };

    if (tipoEquipo === 'computadora') {
      equipoNormalizado = {
        ...equipoNormalizado,
        ipFija: formData.ipFija.trim() || 'DHCP (Automática)'
      };
    } else if (tipoEquipo === 'impresora') {
      equipoNormalizado = {
        ...equipoNormalizado,
        // Limpiamos atributos de computadoras que no aplican a impresoras
        procesador: 'No aplica',
        memoriaRAM: 'No aplica',
        almacenamiento: 'No aplica',
        sistemaOperativo: 'Firmware Propietario',
        ipFija: formData.conexionImpresora.includes('USB') ? 'No aplica (USB Local)' : (formData.ipFija.trim() || 'DHCP')
      };
    }

    setError('');
    onSave(equipoNormalizado);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-800">Registrar Equipo Patrimonial</h3>
            <p className="text-xs text-slate-400">
              Seleccione si registrará una Computadora o una Impresora institucional
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* SELECTOR DE TIPO DE EQUIPO (SOLO 2 OPCIONES: COMPUTADORA O IMPRESORA) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Tipo de Dispositivo a Inventariar
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opción 1: Computadoras */}
              <button
                type="button"
                onClick={() => setTipoEquipo('computadora')}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  tipoEquipo === 'computadora'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 shadow-xs ring-1 ring-blue-600/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${tipoEquipo === 'computadora' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'}`}>
                  <Laptop size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Computadora / Laptop</p>
                  <p className="text-[11px] text-slate-400">PC Escritorio, All-in-One, Notebook</p>
                </div>
              </button>

              {/* Opción 2: Impresoras */}
              <button
                type="button"
                onClick={() => setTipoEquipo('impresora')}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  tipoEquipo === 'impresora'
                    ? 'border-amber-600 bg-amber-50/60 text-amber-950 shadow-xs ring-1 ring-amber-600/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${tipoEquipo === 'impresora' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'}`}>
                  <Printer size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Impresora / Escáner</p>
                  <p className="text-[11px] text-slate-400">Láser, Térmica para Actas, Multifunción</p>
                </div>
              </button>
            </div>
          </div>

          {/* DATOS GENERALES / PATRIMONIALES (Comunes a ambos) */}
          <div className="pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              2. Datos Patrimoniales e Institucionales
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Código Patrimonial</label>
                  <input
                    type="text"
                    name="codPatrimonial"
                    value={formData.codPatrimonial}
                    onChange={handleChange}
                    placeholder="Ej. PAT-2026-001 (o autogenerar)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Marca y Modelo (*)</label>
                  <input
                    type="text"
                    name="marcaModelo"
                    value={formData.marcaModelo}
                    onChange={handleChange}
                    required
                    placeholder={
                      tipoEquipo === 'computadora' ? 'Ej. Dell OptiPlex 3080 / Lenovo ThinkCentre' :
                      'Ej. HP LaserJet Pro M402dn / Brother HL-1212W'
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Número de Serie (SN) (*)</label>
                  <input
                    type="text"
                    name="numeroSerie"
                    value={formData.numeroSerie}
                    onChange={handleChange}
                    required
                    placeholder="Ej. SN-89410294"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sector Asignado</label>
                  <select
                    name="idSector"
                    value={formData.idSector}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-medium"
                  >
                    <option value="Operativo">🟢 Operativo</option>
                    <option value="En Mantenimiento">🟡 En Mantenimiento</option>
                    <option value="En Depósito">🔵 En Depósito / Reserva</option>
                    <option value="Baja">⚪ Baja Patrimonial</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* CAMPOS CONDICIONALES: COMPUTADORAS */}
          {tipoEquipo === 'computadora' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
                <Cpu size={14} />
                <span>3. Especificaciones de Cómputo y Hardware</span>
              </label>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Procesador</label>
                    <input
                      type="text"
                      name="procesador"
                      value={formData.procesador}
                      onChange={handleChange}
                      placeholder="Ej. Intel Core i5-10400 / AMD Ryzen 5"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Memoria RAM</label>
                    <select
                      name="memoriaRAM"
                      value={formData.memoriaRAM}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    >
                      <option value="4GB DDR4">4GB DDR4</option>
                      <option value="8GB DDR4">8GB DDR4</option>
                      <option value="16GB DDR4">16GB DDR4 (Recomendado)</option>
                      <option value="32GB DDR4">32GB DDR4</option>
                      <option value="64GB DDR5">64GB DDR5</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Disco / Almacenamiento</label>
                    <input
                      type="text"
                      name="almacenamiento"
                      value={formData.almacenamiento}
                      onChange={handleChange}
                      placeholder="Ej. 512GB SSD NVMe / 1TB HDD"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Sistema Operativo</label>
                    <input
                      type="text"
                      name="sistemaOperativo"
                      value={formData.sistemaOperativo}
                      onChange={handleChange}
                      placeholder="Ej. Windows 10 Pro 64-bit / Windows 11"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">IP Fija Asignada</label>
                    <input
                      type="text"
                      name="ipFija"
                      value={formData.ipFija}
                      onChange={handleChange}
                      placeholder="Ej. 192.168.10.45 (o vacío)"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Máscara Subred</label>
                    <input
                      type="text"
                      name="mascaraSubred"
                      value={formData.mascaraSubred}
                      onChange={handleChange}
                      placeholder="255.255.255.0"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Workgroup / Dominio</label>
                    <input
                      type="text"
                      name="workgroup"
                      value={formData.workgroup}
                      onChange={handleChange}
                      placeholder="TRIBUNAL_SEC"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS CONDICIONALES: IMPRESORAS Y ESCÁNERES */}
          {tipoEquipo === 'impresora' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                <Printer size={14} />
                <span>3. Especificaciones de Impresión y Suministros</span>
              </label>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tecnología de Impresión</label>
                    <select
                      name="tipoImpresion"
                      value={formData.tipoImpresion}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    >
                      <option value="Láser Monocromática">Láser Monocromática (Oficina)</option>
                      <option value="Láser Color">Láser Color (Documentos Gráficos)</option>
                      <option value="Térmica para Actas/Tickets">Térmica para Actas / Votos / Tickets</option>
                      <option value="Multifunción (Imprime/Copia/Escaneo)">Multifunción con Escáner</option>
                      <option value="Inyección de Tinta Continua">Inyección de Tinta Continua</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Insumo / Tóner Compatible (Vinculado a Insumos)
                    </label>
                    <input
                      type="text"
                      name="tonerCompatible"
                      value={formData.tonerCompatible}
                      onChange={handleChange}
                      placeholder="Ej. Tóner Brother TN-1060 / HP 85A Negro"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Conexión</label>
                    <select
                      name="conexionImpresora"
                      value={formData.conexionImpresora}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    >
                      <option value="Red Ethernet (RJ-45)">Red Ethernet (Cable RJ-45)</option>
                      <option value="Wi-Fi Inalámbrico">Wi-Fi Inalámbrico</option>
                      <option value="USB Local Directo">USB Local Directo (Monopuesto)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">IP Fija en Red</label>
                    <input
                      type="text"
                      name="ipFija"
                      value={formData.ipFija}
                      onChange={handleChange}
                      placeholder="Ej. 192.168.10.112 (o N/A si es USB)"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Formato de Papel</label>
                    <select
                      name="formatoPapel"
                      value={formData.formatoPapel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    >
                      <option value="A4 / Oficio / Legal">A4 / Oficio / Legal</option>
                      <option value="Solo A4">Solo A4</option>
                      <option value="Rollo Térmico 80mm">Rollo Térmico 80mm (Actas)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOTONES PIE */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} />
              <span>Guardar Equipo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
