import { useState } from 'react';
import { 
  Laptop, 
  Printer, 
  Network, 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  FileDown, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Wrench, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Info, 
  X,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import ModalNuevoEquipo from '../components/ModalNuevoEquipo';
import ModalDetalleEquipo from '../components/ModalDetalleEquipo';

export default function Equipos() {
  // 1. ZONA JAVASCRIPT: Estados para pestañas, filtros y modales
  const [activeTab, setActiveTab] = useState('equipos'); // 'equipos' | 'sectores'
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'computadora' | 'impresora' | 'red'
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modales
  const [isModalNuevoEquipoOpen, setIsModalNuevoEquipoOpen] = useState(false);
  const [isModalSectorOpen, setIsModalSectorOpen] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);

  // Notificaciones Toast
  const [toastMessage, setToastMessage] = useState(null);

  const mostrarToast = (mensaje) => {
    setToastMessage(mensaje);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sectores Físicos del Tribunal Electoral
  const [sectores, setSectores] = useState([
    {
      idSector: 1,
      codigoSector: 'S-001',
      nombreOficina: 'Mesa de Entradas',
      ubicacion: 'Planta Baja - Hall Central',
      responsable: 'Dra. Carmen Fernández',
    },
    {
      idSector: 2,
      codigoSector: 'S-002',
      nombreOficina: 'Secretaría Electoral',
      ubicacion: 'Piso 1 - Edificio Principal',
      responsable: 'Dr. Alejandro Valdez',
    },
    {
      idSector: 3,
      codigoSector: 'S-003',
      nombreOficina: 'Sala de Cómputos y Servidores',
      ubicacion: 'Subsuelo B - Data Center',
      responsable: 'Ing. Roberto Gómez (Jefe TI)',
    },
    {
      idSector: 4,
      codigoSector: 'S-004',
      nombreOficina: 'Juzgado de Primera Instancia',
      ubicacion: 'Piso 2 - Ala Norte',
      responsable: 'Dra. Mariana Morales',
    },
  ]);

  // Lista de Equipos con atributos técnicos diferenciados por tipo
  const [equipos, setEquipos] = useState([
    {
      idEquipo: 1,
      codPatrimonial: 'PAT-2026-001',
      marcaModelo: 'Dell OptiPlex 3080 Desktop',
      tipoEquipo: 'computadora',
      numeroSerie: 'SN-78492019',
      ipFija: '192.168.10.45',
      mascaraSubred: '255.255.255.0',
      workgroup: 'TRIBUNAL_SEC',
      estadoOperativo: 'Operativo',
      idSector: 1,
      nombreSector: 'Mesa de Entradas',
      procesador: 'Intel Core i5-10400',
      memoriaRAM: '16GB DDR4',
      almacenamiento: '512GB SSD NVMe',
      sistemaOperativo: 'Windows 10 Pro 64-bit'
    },
    {
      idEquipo: 2,
      codPatrimonial: 'PAT-2026-002',
      marcaModelo: 'HP LaserJet Pro M402dn',
      tipoEquipo: 'impresora',
      numeroSerie: 'SN-VND903182',
      ipFija: '192.168.10.112',
      mascaraSubred: '255.255.255.0',
      workgroup: 'TRIBUNAL_SEC',
      estadoOperativo: 'Operativo',
      idSector: 2,
      nombreSector: 'Secretaría Electoral',
      tipoImpresion: 'Láser Monocromática',
      tonerCompatible: 'HP 85A Negro / CF226A',
      conexionImpresora: 'Red Ethernet (RJ-45)'
    },
    {
      idEquipo: 3,
      codPatrimonial: 'PAT-2026-003',
      marcaModelo: 'Lenovo ThinkCentre M70',
      tipoEquipo: 'computadora',
      numeroSerie: 'SN-LN8823190',
      ipFija: '192.168.10.48',
      mascaraSubred: '255.255.255.0',
      workgroup: 'TRIBUNAL_SEC',
      estadoOperativo: 'En Mantenimiento',
      idSector: 1,
      nombreSector: 'Mesa de Entradas',
      procesador: 'Intel Core i3-10100',
      memoriaRAM: '8GB DDR4',
      almacenamiento: '256GB SSD',
      sistemaOperativo: 'Windows 10 Pro 64-bit'
    },
    {
      idEquipo: 4,
      codPatrimonial: 'PAT-2026-004',
      marcaModelo: 'Brother HL-1212W',
      tipoEquipo: 'impresora',
      numeroSerie: 'SN-BR338190',
      ipFija: 'No aplica (USB Local)',
      mascaraSubred: 'N/A',
      workgroup: 'N/A',
      estadoOperativo: 'Operativo',
      idSector: 4,
      nombreSector: 'Juzgado de Primera Instancia',
      tipoImpresion: 'Láser Monocromática',
      tonerCompatible: 'Tóner Brother TN-1060',
      conexionImpresora: 'USB Local Directo'
    },
    {
      idEquipo: 5,
      codPatrimonial: 'PAT-2026-005',
      marcaModelo: 'Epson EcoTank L3250 Multifunción',
      tipoEquipo: 'impresora',
      numeroSerie: 'SN-EP994821',
      ipFija: '192.168.10.115',
      mascaraSubred: '255.255.255.0',
      workgroup: 'TRIBUNAL_SEC',
      estadoOperativo: 'Operativo',
      idSector: 1,
      nombreSector: 'Mesa de Entradas',
      tipoImpresion: 'Inyección de Tinta Continua',
      tonerCompatible: 'Botellas Tinta Epson 544',
      conexionImpresora: 'Wi-Fi Inalámbrico'
    },
    {
      idEquipo: 6,
      codPatrimonial: 'PAT-2026-006',
      marcaModelo: 'Laptop HP EliteBook G8',
      tipoEquipo: 'computadora',
      numeroSerie: 'SN-HP551920',
      ipFija: 'DHCP (Wi-Fi)',
      mascaraSubred: '255.255.255.0',
      workgroup: 'TRIBUNAL_SEC',
      estadoOperativo: 'En Depósito',
      idSector: 3,
      nombreSector: 'Sala de Cómputos y Servidores',
      procesador: 'Intel Core i7-1165G7',
      memoriaRAM: '16GB DDR4',
      almacenamiento: '512GB SSD NVMe',
      sistemaOperativo: 'Windows 11 Pro 64-bit'
    }
  ]);

  // Manejador para agregar nuevo equipo
  const handleGuardarEquipo = (nuevo) => {
    const itemConId = {
      ...nuevo,
      idEquipo: Date.now()
    };
    setEquipos([itemConId, ...equipos]);
    mostrarToast(`Equipo ${nuevo.codPatrimonial} registrado exitosamente.`);
  };

  // Manejador para actualizar equipo existente
  const handleUpdateEquipo = (actualizado) => {
    setEquipos((prev) =>
      prev.map((item) =>
        item.idEquipo === actualizado.idEquipo ? actualizado : item
      )
    );
    mostrarToast(`Equipo ${actualizado.codPatrimonial} actualizado.`);
  };

  // Manejador para dar de baja o cambiar estado
  const handleDeleteEquipo = (idEquipo) => {
    setEquipos((prev) =>
      prev.map((item) =>
        item.idEquipo === idEquipo
          ? { ...item, estadoOperativo: 'Baja' }
          : item
      )
    );
    mostrarToast('Equipo dado de baja patrimonial.');
  };

  // Acción rápida: Poner en Mantenimiento o Reactivar
  const handleToggleMantenimiento = (e, item) => {
    e.stopPropagation();
    const nuevoEstado = item.estadoOperativo === 'En Mantenimiento' ? 'Operativo' : 'En Mantenimiento';
    handleUpdateEquipo({
      ...item,
      estadoOperativo: nuevoEstado
    });
  };

  // Filtrado reactivo de Equipos
  const equiposFiltrados = equipos.filter((item) => {
    const texto = searchTerm.toLowerCase();
    const coincideTexto = 
      (item.codPatrimonial || '').toLowerCase().includes(texto) ||
      (item.marcaModelo || '').toLowerCase().includes(texto) ||
      (item.nombreSector || '').toLowerCase().includes(texto) ||
      (item.ipFija || '').toLowerCase().includes(texto);

    const coincideTipo = 
      filtroTipo === 'todos' || item.tipoEquipo === filtroTipo;

    const coincideEstado = 
      filtroEstado === 'todos' || item.estadoOperativo === filtroEstado;

    return coincideTexto && coincideTipo && coincideEstado;
  });

  // Filtrado reactivo de Sectores
  const sectoresFiltrados = sectores.filter((s) => {
    const texto = searchTerm.toLowerCase();
    return (
      s.codigoSector.toLowerCase().includes(texto) ||
      s.nombreOficina.toLowerCase().includes(texto) ||
      s.responsable.toLowerCase().includes(texto)
    );
  });

  // Renderizador de Badges de Estado Operativo
  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'Operativo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} />
            OPERATIVO
          </span>
        );
      case 'En Mantenimiento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench size={11} />
            EN REPARACIÓN
          </span>
        );
      case 'En Depósito':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            EN DEPÓSITO
          </span>
        );
      case 'Baja':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
            BAJA
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {estado}
          </span>
        );
    }
  };

  // Renderizador de Icono según Tipo de Equipo (Solo Computadora o Impresora)
  const renderTipoIcono = (tipo) => {
    if (tipo === 'impresora') {
      return (
        <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
          <Printer size={15} />
        </span>
      );
    }
    return (
      <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
        <Laptop size={15} />
      </span>
    );
  };

  return (
    <MainLayout activePage="equipos" pageTitle="Control de Equipos">
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        
        {/* Encabezado y Botones Principales */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                <ShieldCheck size={12} />
                Parque Patrimonial Institucional
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Gestión de Equipamiento</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administración de activos informáticos con especificaciones técnicas adaptadas por tipo de dispositivo.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => mostrarToast('Generando reporte patrimonial en PDF...')}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <FileDown size={15} />
              <span>Exportar</span>
            </button>
            <button
              type="button"
              onClick={() => activeTab === 'equipos' ? setIsModalNuevoEquipoOpen(true) : setIsModalSectorOpen(true)}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shadow-blue-500/20 cursor-pointer"
            >
              <Plus size={16} />
              <span>{activeTab === 'equipos' ? 'Nuevo Equipo' : 'Nuevo Sector'}</span>
            </button>
          </div>
        </div>

        {/* Selector de Pestañas (Equipos Informáticos / Sectores Físicos) */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setActiveTab('equipos'); setSearchTerm(''); }}
            className={`px-4 sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'equipos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Equipos Informáticos ({equipos.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('sectores'); setSearchTerm(''); }}
            className={`px-4 sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'sectores'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sectores Físicos ({sectores.length})
          </button>
        </div>

        {/* Barra de Filtros y Buscador */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'equipos' ? 'Buscar por código, marca/modelo, sector o IP...' : 'Buscar sector por nombre o responsable...'}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 focus:bg-white transition"
            />
          </div>

          {activeTab === 'equipos' && (
            <div className="flex items-center gap-2.5 justify-between md:justify-end flex-wrap">
              {/* Filtro por Tipo */}
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:border-blue-600 transition cursor-pointer"
              >
                <option value="todos">Todos los Tipos</option>
                <option value="computadora">Computadoras / Laptops</option>
                <option value="impresora">Impresoras / Escáneres</option>
              </select>

              {/* Filtro por Estado */}
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:border-blue-600 transition cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="Operativo">🟢 Operativo</option>
                <option value="En Mantenimiento">🟡 En Mantenimiento</option>
                <option value="En Depósito">🔵 En Depósito</option>
                <option value="Baja">⚪ Baja</option>
              </select>

              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                  {equiposFiltrados.length} Items
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Guía visual interactiva de doble clic */}
        {activeTab === 'equipos' && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/60 border border-blue-100 text-blue-800 rounded-xl text-xs">
            <Info size={15} className="text-blue-600 shrink-0" />
            <span>
              <strong>Tip de Operación:</strong> Presione <strong>doble clic</strong> sobre cualquier equipo para ver su ficha técnica detallada (con procesador y RAM si es PC, o tipo de tóner si es impresora). Use las acciones rápidas para ponerlo <strong>En Reparación</strong> o <strong>Darlo de Baja</strong>.
            </span>
          </div>
        )}

        {/* TABLA 1: Vista de Equipos Informáticos */}
        {activeTab === 'equipos' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-50/60 text-slate-400 uppercase font-semibold border-b border-slate-100 select-none">
                  <tr>
                    <th className="py-4 px-6">Cód. Patrimonial</th>
                    <th className="py-4 px-6">Dispositivo / Modelo</th>
                    <th className="py-4 px-6">Sector Asignado</th>
                    <th className="py-4 px-6">Dirección IP</th>
                    <th className="py-4 px-6 text-center">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {equiposFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No se encontraron equipos que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    equiposFiltrados.map((item) => (
                      <tr 
                        key={item.idEquipo} 
                        onDoubleClick={() => {
                          setEquipoSeleccionado(item);
                          setIsDetalleModalOpen(true);
                        }}
                        className="hover:bg-blue-50/40 transition cursor-pointer select-none group"
                        title="Doble clic para ver ficha técnica completa, editar o gestionar"
                      >
                        {/* Código Patrimonial */}
                        <td className="py-4 px-6 font-mono font-medium">
                          <div className="flex items-center gap-2">
                            {renderTipoIcono(item.tipoEquipo)}
                            <span className="font-bold text-slate-800 group-hover:text-blue-700 transition">
                              {item.codPatrimonial}
                            </span>
                          </div>
                        </td>

                        {/* Marca y Modelo */}
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-800">{item.marcaModelo}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            SN: {item.numeroSerie}
                            {item.procesador && item.procesador !== 'No aplica' && (
                              <span className="ml-1.5 text-slate-500 font-sans">• {item.procesador}</span>
                            )}
                            {item.tonerCompatible && (
                              <span className="ml-1.5 text-amber-600 font-sans">• {item.tonerCompatible}</span>
                            )}
                          </p>
                        </td>

                        {/* Sector Asignado */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin size={14} className="text-blue-500 shrink-0" />
                            <span className="font-medium">{item.nombreSector}</span>
                          </div>
                        </td>

                        {/* IP Fija */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                            <Network size={13} className="text-slate-400 shrink-0" />
                            <span>{item.ipFija}</span>
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="py-4 px-6 text-center">
                          {renderEstadoBadge(item.estadoOperativo)}
                        </td>

                        {/* Acciones Rápidas */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón Poner en Reparación / Restablecer */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleMantenimiento(e, item)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                item.estadoOperativo === 'En Mantenimiento'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              }`}
                              title={item.estadoOperativo === 'En Mantenimiento' ? 'Marcar como Operativo' : 'Enviar a Mantenimiento / Reparación'}
                            >
                              {item.estadoOperativo === 'En Mantenimiento' ? <CheckCircle2 size={14} /> : <Wrench size={14} />}
                            </button>

                            {/* Botón Ver Ficha */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEquipoSeleccionado(item);
                                setIsDetalleModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition cursor-pointer"
                              title="Ver ficha técnica completa"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Banner de Sincronización y Paginación */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={16} />
                <span className="tracking-wider uppercase text-[11px]">Inventario de Activos Sincronizado</span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="w-8 h-8 rounded-lg bg-blue-600 text-white font-semibold text-xs cursor-pointer">
                  1
                </button>
                <button type="button" className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TABLA 2: Vista de Sectores Físicos */}
        {activeTab === 'sectores' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50/60 text-slate-400 uppercase font-semibold border-b border-slate-100 select-none">
                  <tr>
                    <th className="py-4 px-6">Código de Sector</th>
                    <th className="py-4 px-6">Nombre de la Dependencia</th>
                    <th className="py-4 px-6">Ubicación Edilicia</th>
                    <th className="py-4 px-6">Responsable Asignado</th>
                    <th className="py-4 px-6 text-right">Equipos Asignados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sectoresFiltrados.map((item) => {
                    const cantEquipos = equipos.filter(
                      (e) => String(e.idSector) === String(item.idSector) || e.nombreSector === item.nombreOficina
                    ).length;

                    return (
                      <tr key={item.idSector} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 font-mono font-bold text-blue-700">
                          <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            {item.codigoSector}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">{item.nombreOficina}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin size={14} className="text-slate-400" />
                            <span>{item.ubicacion}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-medium">{item.responsable}</td>
                        <td className="py-4 px-6 text-right">
                          <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full text-[11px]">
                            {cantEquipos} equipos
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Institucional */}
        <div className="text-center pt-4 pb-2 text-[11px] text-slate-400 tracking-wider">
          © 2026 TRIBUNAL ELECTORAL PERMANENTE • MÓDULO DE CONTROL DE EQUIPOS
        </div>

      </div>

      {/* MODAL: Registrar Nuevo Equipo con campos dinámicos */}
      <ModalNuevoEquipo
        isOpen={isModalNuevoEquipoOpen}
        onClose={() => setIsModalNuevoEquipoOpen(false)}
        onSave={handleGuardarEquipo}
        sectores={sectores}
      />

      {/* MODAL: Ficha Técnica Detallada, Edición y Acciones (Poner en reparación, baja, etc.) */}
      <ModalDetalleEquipo
        isOpen={isDetalleModalOpen}
        equipo={equipoSeleccionado}
        sectores={sectores}
        onClose={() => {
          setIsDetalleModalOpen(false);
          setEquipoSeleccionado(null);
        }}
        onUpdate={handleUpdateEquipo}
        onDelete={handleDeleteEquipo}
      />

      {/* MODAL: Registrar Nuevo Sector */}
      {isModalSectorOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => setIsModalSectorOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Registrar Dependencia / Sector</h3>
                <p className="text-xs text-slate-400">Agregue una oficina física institucional</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalSectorOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const nuevoSec = {
                  idSector: sectores.length + 1,
                  codigoSector: form.codigoSector.value.trim(),
                  nombreOficina: form.nombreOficina.value.trim(),
                  ubicacion: form.ubicacion.value.trim(),
                  responsable: form.responsable.value.trim()
                };
                setSectores([...sectores, nuevoSec]);
                setIsModalSectorOpen(false);
                mostrarToast(`Sector ${nuevoSec.nombreOficina} registrado.`);
              }} 
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Código de Sector</label>
                <input 
                  name="codigoSector" 
                  required 
                  placeholder="Ej. S-005" 
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Dependencia</label>
                <input 
                  name="nombreOficina" 
                  required 
                  placeholder="Ej. Secretaría de Informática" 
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicación Edilicia</label>
                <input 
                  name="ubicacion" 
                  required 
                  placeholder="Ej. Piso 1 - Ala Este" 
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Funcionario Responsable</label>
                <input 
                  name="responsable" 
                  required 
                  placeholder="Ej. Lic. Carlos Duarte" 
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none" 
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalSectorOpen(false)} 
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Guardar Sector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span>{toastMessage}</span>
        </div>
      )}

    </MainLayout>
  );
}