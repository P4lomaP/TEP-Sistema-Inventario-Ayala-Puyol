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

export default function ModalNuevoEquipo({ isOpen, onClose, onSave, sectores = [], insumos = [], equipos = [] }) {
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
    idInsumoCompatible: '',
    conexionImpresora: 'Red Ethernet (RJ-45)',
    formatoPapel: 'A4 / Oficio'
  });

  const [error, setError] = useState('');

  // Detección preventiva de conflictos de unicidad (S/N, Código Patrimonial, IP)
  const serieEnUso = equipos.find(
    (eq) => formData.numeroSerie?.trim() && 
            eq.numeroSerie?.toLowerCase().trim() === formData.numeroSerie.toLowerCase().trim()
  );

  const codPatEnUso = equipos.find(
    (eq) => formData.codPatrimonial?.trim() && 
            eq.codPatrimonial?.toLowerCase().trim() === formData.codPatrimonial.toLowerCase().trim()
  );

  const ipEnUso = equipos.find((eq) => {
    const ip = formData.ipFija?.trim();
    if (!ip || ip === '0.0.0.0' || ip.toLowerCase() === 'dhcp' || ip.toLowerCase().includes('no aplica')) {
      return false;
    }
    return eq.ipFija?.trim() === ip && eq.estadoOperativo !== 'Baja';
  });

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

    if (!formData.idSector) {
      setError('Debe seleccionar un sector asignado.');
      return;
    }

    // Validación preventiva de Número de Serie Único
    if (serieEnUso) {
      setError(`Número de serie duplicado: El serial "${formData.numeroSerie.trim()}" ya está registrado en el equipo "${serieEnUso.marcaModelo}" (ID: ${serieEnUso.idEquipo}). Cada dispositivo debe tener un serial de fábrica único.`);
      return;
    }

    // Validación preventiva de Código Patrimonial Único
    if (codPatEnUso) {
      setError(`Código patrimonial duplicado: El código "${formData.codPatrimonial.trim()}" ya pertenece al equipo "${codPatEnUso.marcaModelo}" (ID: ${codPatEnUso.idEquipo}). Cada bien patrimonial del TEP debe tener un código único.`);
      return;
    }

    // Validación preventiva de colisión de red
    if (ipEnUso && formData.estadoOperativo !== 'Baja') {
      setError(`Conflicto de red: La dirección IP "${formData.ipFija}" ya está asignada al equipo "${ipEnUso.marcaModelo}" (${ipEnUso.tipoEquipo}). Dos dispositivos activos en red no pueden compartir la misma IP.`);
      return;
    }

    const esImp = tipoEquipo === 'impresora';

    const equipoNormalizado = {
      codPatrimonial: formData.codPatrimonial.trim() || null,
      tipoEquipo: esImp ? 'Impresora' : 'Computadora',
      marcaModelo: formData.marcaModelo.trim(),
      numeroSerie: formData.numeroSerie.trim(),
      idSector: Number(formData.idSector),
      nombreSector: formData.nombreSector,
      estadoOperativo: formData.estadoOperativo || 'Operativo',
      ipFija: formData.ipFija.trim() || '0.0.0.0',
      mascaraSubred: formData.mascaraSubred.trim() || '255.255.255.0',
      workgroup: formData.workgroup.trim() || 'TRIBUNAL_SEC',

      // Atributos de PC
      procesador: !esImp ? formData.procesador.trim() : null,
      memoriaRAM: !esImp ? formData.memoriaRAM.trim() : null,
      almacenamiento: !esImp ? formData.almacenamiento.trim() : null,
      sistemaOperativo: !esImp ? formData.sistemaOperativo.trim() : null,

      // Atributos de Impresora
      tecnologiaImpresion: esImp ? formData.tipoImpresion : null,
      tipoConexion: esImp ? formData.conexionImpresora : null,
      formatoPapel: esImp ? formData.formatoPapel : null,
      idInsumoCompatible: esImp && formData.idInsumoCompatible ? Number(formData.idInsumoCompatible) : null
    };

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
        className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 max-h-[90vh] flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-gray-100">Registrar Equipo Patrimonial</h3>
            <p className="text-xs text-slate-400 dark:text-gray-400">
              Seleccione si registrará una Computadora o una Impresora institucional
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 dark:text-gray-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-300 mb-2">
              1. Tipo de Dispositivo a Inventariar
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opción 1: Computadoras */}
              <button
                type="button"
                onClick={() => setTipoEquipo('computadora')}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  tipoEquipo === 'computadora'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-600 text-blue-950 dark:text-white shadow-xs ring-1 ring-blue-600/30 dark:border-blue-500'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-600/80 bg-white dark:bg-slate-700 text-slate-600 dark:text-gray-300'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${tipoEquipo === 'computadora' ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-gray-400'}`}>
                  <Laptop size={20} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${tipoEquipo === 'computadora' ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-gray-100'}`}>Computadora / Laptop</p>
                  <p className={`text-[11px] ${tipoEquipo === 'computadora' ? 'text-slate-400 dark:text-blue-100' : 'text-slate-400 dark:text-gray-400'}`}>PC Escritorio, All-in-One, Notebook</p>
                </div>
              </button>

              {/* Opción 2: Impresoras */}
              <button
                type="button"
                onClick={() => setTipoEquipo('impresora')}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                  tipoEquipo === 'impresora'
                    ? 'border-amber-600 bg-amber-50/60 dark:bg-blue-600 text-amber-950 dark:text-white shadow-xs ring-1 ring-amber-600/30 dark:border-blue-500'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-600/80 bg-white dark:bg-slate-700 text-slate-600 dark:text-gray-300'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${tipoEquipo === 'impresora' ? 'bg-amber-600 dark:bg-blue-700 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-gray-400'}`}>
                  <Printer size={20} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${tipoEquipo === 'impresora' ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-gray-100'}`}>Impresora / Escáner</p>
                  <p className={`text-[11px] ${tipoEquipo === 'impresora' ? 'text-slate-400 dark:text-blue-100' : 'text-slate-400 dark:text-gray-400'}`}>Láser, Térmica para Actas, Multifunción</p>
                </div>
              </button>
            </div>
          </div>

          {/* DATOS GENERALES / PATRIMONIALES (Comunes a ambos) */}
          <div className="pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-300 mb-2">
              2. Datos Patrimoniales e Institucionales
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Código Patrimonial</label>
                  <input
                    type="text"
                    name="codPatrimonial"
                    value={formData.codPatrimonial}
                    onChange={handleChange}
                    placeholder="Ej. PAT-2026-001 (o autogenerar)"
                    className={`w-full px-3 py-2 text-xs border rounded-xl font-mono focus:outline-none transition ${
                      codPatEnUso
                        ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-500'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                  {codPatEnUso && (
                    <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                      <span>Ya asignado a: {codPatEnUso.marcaModelo}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Marca y Modelo (*)</label>
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Número de Serie (SN) (*)</label>
                  <input
                    type="text"
                    name="numeroSerie"
                    value={formData.numeroSerie}
                    onChange={handleChange}
                    required
                    placeholder="Ej. SN-89410294"
                    className={`w-full px-3 py-2 text-xs border rounded-xl font-mono focus:outline-none transition ${
                      serieEnUso
                        ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-500'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                  {serieEnUso && (
                    <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                      <span>Ya registrado en: {serieEnUso.marcaModelo}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Sector Asignado</label>
                  <select
                    name="idSector"
                    value={formData.idSector}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-medium dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
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
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
                <Cpu size={14} />
                <span>3. Especificaciones de Cómputo y Hardware</span>
              </label>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Procesador</label>
                    <input
                      type="text"
                      name="procesador"
                      value={formData.procesador}
                      onChange={handleChange}
                      placeholder="Ej. Intel Core i5-10400 / AMD Ryzen 5"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Memoria RAM</label>
                    <select
                      name="memoriaRAM"
                      value={formData.memoriaRAM}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
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
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Disco / Almacenamiento</label>
                    <input
                      type="text"
                      name="almacenamiento"
                      value={formData.almacenamiento}
                      onChange={handleChange}
                      placeholder="Ej. 512GB SSD NVMe / 1TB HDD"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Sistema Operativo</label>
                    <input
                      type="text"
                      name="sistemaOperativo"
                      value={formData.sistemaOperativo}
                      onChange={handleChange}
                      placeholder="Ej. Windows 10 Pro 64-bit / Windows 11"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">IP Fija Asignada</label>
                    <input
                      type="text"
                      name="ipFija"
                      value={formData.ipFija}
                      onChange={handleChange}
                      placeholder="Ej. 192.168.10.45 (o vacío)"
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 font-mono transition ${
                        ipEnUso 
                          ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-500 focus:ring-amber-500' 
                          : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600'
                      }`}
                    />
                    {ipEnUso && (
                      <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0 text-amber-600" />
                        <span>En uso por: {ipEnUso.marcaModelo} ({ipEnUso.tipoEquipo})</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Máscara Subred</label>
                    <input
                      type="text"
                      name="mascaraSubred"
                      value={formData.mascaraSubred}
                      onChange={handleChange}
                      placeholder="255.255.255.0"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Workgroup / Dominio</label>
                    <input
                      type="text"
                      name="workgroup"
                      value={formData.workgroup}
                      onChange={handleChange}
                      placeholder="TRIBUNAL_SEC"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS CONDICIONALES: IMPRESORAS Y ESCÁNERES */}
          {tipoEquipo === 'impresora' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                <Printer size={14} />
                <span>3. Especificaciones de Impresión y Suministros</span>
              </label>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Tecnología de Impresión</label>
                    <select
                      name="tipoImpresion"
                      value={formData.tipoImpresion}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    >
                      <option value="Láser Monocromática">Láser Monocromática (Oficina)</option>
                      <option value="Láser Color">Láser Color (Documentos Gráficos)</option>
                      <option value="Térmica para Actas/Tickets">Térmica para Actas / Votos / Tickets</option>
                      <option value="Multifunción (Imprime/Copia/Escaneo)">Multifunción con Escáner</option>
                      <option value="Inyección de Tinta Continua">Inyección de Tinta Continua</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">
                      Insumo / Tóner Compatible (Catálogo TEP)
                    </label>
                    <select
                      name="idInsumoCompatible"
                      value={formData.idInsumoCompatible}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    >
                      <option value="">-- Sin insumo asignado --</option>
                      {insumos.map((ins) => (
                        <option key={ins.idInsumo} value={ins.idInsumo}>
                          {ins.descripcion} ({ins.codigoInterno})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Tipo de Conexión</label>
                    <select
                      name="conexionImpresora"
                      value={formData.conexionImpresora}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    >
                      <option value="Red Ethernet (RJ-45)">Red Ethernet (Cable RJ-45)</option>
                      <option value="Wi-Fi Inalámbrico">Wi-Fi Inalámbrico</option>
                      <option value="USB Local Directo">USB Local Directo (Monopuesto)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">IP Fija en Red</label>
                    <input
                      type="text"
                      name="ipFija"
                      value={formData.ipFija}
                      onChange={handleChange}
                      placeholder="Ej. 192.168.10.112 (o N/A si es USB)"
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 font-mono transition ${
                        ipEnUso 
                          ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-500 focus:ring-amber-500' 
                          : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600'
                      }`}
                    />
                    {ipEnUso && (
                      <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0 text-amber-600" />
                        <span>En uso por: {ipEnUso.marcaModelo} ({ipEnUso.tipoEquipo})</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">Formato de Papel</label>
                    <select
                      name="formatoPapel"
                      value={formData.formatoPapel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
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
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all duration-200 ease-in-out hover:brightness-110 active:scale-95 flex items-center gap-2 cursor-pointer"
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
