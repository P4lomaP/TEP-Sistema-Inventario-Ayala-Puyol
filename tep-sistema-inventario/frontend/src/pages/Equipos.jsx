import { useState, useEffect } from 'react';
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
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import ModalNuevoEquipo from '../components/ModalNuevoEquipo';
import ModalDetalleEquipo from '../components/ModalDetalleEquipo';
import { 
  listarEquipos, 
  crearEquipo, 
  actualizarEquipo, 
  darDeBajaEquipo 
} from '../services/equiposService';
import { 
  listarSectores, 
  crearSector 
} from '../services/sectoresService';
import { listarInsumos } from '../services/insumosService';

export default function Equipos() {
  // 1. ZONA JAVASCRIPT: Estados para datos del Backend, pestañas, filtros y modales
  const [equipos, setEquipos] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('equipos'); // 'equipos' | 'sectores'
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'computadora' | 'impresora'
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

  // Carga inicial y reactiva desde el Backend
  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [dataEquipos, dataSectores, dataInsumos] = await Promise.all([
        listarEquipos(),
        listarSectores(),
        listarInsumos().catch(() => [])
      ]);
      setEquipos(dataEquipos);
      setSectores(dataSectores);
      setInsumos(dataInsumos);
    } catch (err) {
      console.error('Error al cargar datos de inventario:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Manejador para agregar nuevo equipo conectado al Backend POST /api/equipos
  const handleGuardarEquipo = async (nuevo) => {
    try {
      const resp = await crearEquipo(nuevo);
      mostrarToast(resp.message || 'Equipo registrado exitosamente.');
      await cargarDatos();
    } catch (err) {
      mostrarToast(`Error: ${err.message}`);
    }
  };

  // Manejador para actualizar equipo existente conectado al Backend PUT /api/equipos/:id
  const handleUpdateEquipo = async (actualizado) => {
    try {
      const resp = await actualizarEquipo(actualizado.idEquipo, actualizado);
      mostrarToast(resp.message || 'Equipo actualizado exitosamente.');
      await cargarDatos();
    } catch (err) {
      mostrarToast(`Error: ${err.message}`);
    }
  };

  // Manejador para dar de baja patrimonial conectado al Backend DELETE /api/equipos/:id
  const handleDeleteEquipo = async (idEquipo, motivoBaja) => {
    try {
      const resp = await darDeBajaEquipo(idEquipo, motivoBaja);
      mostrarToast(resp.message || 'Equipo dado de baja patrimonial.');
      await cargarDatos();
    } catch (err) {
      mostrarToast(`Error: ${err.message}`);
    }
  };

  // Acción rápida: Poner en Mantenimiento o Reactivar
  const handleToggleMantenimiento = async (e, item) => {
    e.stopPropagation();
    const nuevoEstado = item.estadoOperativo === 'En Mantenimiento' ? 'Operativo' : 'En Mantenimiento';
    try {
      await actualizarEquipo(item.idEquipo, {
        ...item,
        estadoOperativo: nuevoEstado
      });
      mostrarToast(`Equipo ${item.codPatrimonial || item.marcaModelo} cambiado a: ${nuevoEstado}`);
      await cargarDatos();
    } catch (err) {
      mostrarToast(`Error: ${err.message}`);
    }
  };

  // Manejador para registrar un nuevo sector conectado al Backend POST /api/sectores
  const handleGuardarSector = async (nuevoSector) => {
    try {
      const resp = await crearSector(nuevoSector);
      mostrarToast(resp.message || 'Sector registrado exitosamente.');
      setIsModalSectorOpen(false);
      await cargarDatos();
    } catch (err) {
      mostrarToast(`Error: ${err.message}`);
    }
  };

  // Filtrado reactivo de Equipos
  const equiposFiltrados = equipos.filter((item) => {
    const texto = searchTerm.toLowerCase();
    const coincideTexto = 
      (item.codPatrimonial || '').toLowerCase().includes(texto) ||
      (item.marcaModelo || '').toLowerCase().includes(texto) ||
      (item.nombreSector || item.nombreOficina || '').toLowerCase().includes(texto) ||
      (item.ipFija || '').toLowerCase().includes(texto) ||
      (item.numeroSerie || '').toLowerCase().includes(texto);

    const tipoNormalizado = (item.tipoEquipo || '').toLowerCase();
    const coincideTipo = 
      filtroTipo === 'todos' || tipoNormalizado === filtroTipo.toLowerCase();

    const coincideEstado = 
      filtroEstado === 'todos' || item.estadoOperativo === filtroEstado;

    return coincideTexto && coincideTipo && coincideEstado;
  });

  // Filtrado reactivo de Sectores físicos por nombre
  const sectoresFiltrados = sectores.filter((s) => {
    const texto = searchTerm.toLowerCase().trim();
    const nombre = (s.nombreOficina || s.nombreSector || '').toLowerCase();
    return nombre.includes(texto);
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
              onClick={cargarDatos}
              title="Sincronizar con la base de datos"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-600' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
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

        {/* Mensaje de Error de Conexión */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={cargarDatos}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

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
              placeholder={activeTab === 'equipos' ? 'Buscar por código, marca/modelo, sector o IP...' : 'Buscar dependencia u oficina por nombre...'}
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 size={24} className="animate-spin text-blue-600" />
                          <span className="text-xs font-medium">Cargando parque patrimonial del TEP...</span>
                        </div>
                      </td>
                    </tr>
                  ) : equiposFiltrados.length === 0 ? (
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
                              {item.codPatrimonial || 'S/N Patrimonial'}
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
                            {(item.insumoCompatibleDescripcion || item.tonerCompatible) && (
                              <span className="ml-1.5 text-amber-600 font-sans">• {item.insumoCompatibleDescripcion || item.tonerCompatible}</span>
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
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead className="bg-slate-50/60 text-slate-400 uppercase font-semibold border-b border-slate-100 select-none">
                  <tr>
                    <th className="py-4 px-6">Nombre de la Dependencia / Oficina</th>
                    <th className="py-4 px-6 text-center">Estado Institucional</th>
                    <th className="py-4 px-6 text-right">Equipos Asignados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 size={24} className="animate-spin text-blue-600" />
                          <span className="text-xs font-medium">Cargando dependencias y sectores del TEP...</span>
                        </div>
                      </td>
                    </tr>
                  ) : sectoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-slate-400">
                        No se encontraron dependencias registradas en la base de datos.
                      </td>
                    </tr>
                  ) : (
                    sectoresFiltrados.map((item) => {
                      const cantEquipos = equipos.filter(
                        (e) => Number(e.idSector) === Number(item.idSector)
                      ).length;

                      return (
                        <tr key={item.idSector} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <Building2 size={16} />
                              </span>
                              <span className="font-bold text-slate-800 text-sm">
                                {item.nombreOficina || item.nombreSector}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} />
                              HABILITADO
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full text-[11px]">
                              {cantEquipos} {cantEquipos === 1 ? 'equipo' : 'equipos'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
        insumos={insumos}
        equipos={equipos}
      />

      {/* MODAL: Ficha Técnica Detallada, Edición y Acciones (Poner en reparación, baja, etc.) */}
      <ModalDetalleEquipo
        isOpen={isDetalleModalOpen}
        equipo={equipoSeleccionado}
        sectores={sectores}
        insumos={insumos}
        equipos={equipos}
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
                <p className="text-xs text-slate-400">Agregue una oficina física institucional (TEP)</p>
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
                const nombre = form.nombreOficina.value.trim();
                handleGuardarSector({ nombreSector: nombre });
              }} 
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre de la Dependencia u Oficina (*)
                </label>
                <input 
                  name="nombreOficina" 
                  required 
                  placeholder="Ej. Secretaría de Informática Electoral" 
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