import { useState, useEffect, useMemo } from 'react';
import { 
  Laptop, 
  Printer, 
  Network, 
  MapPin, 
  Search, 
  FileDown, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Wrench, 
  CheckCircle2, 
  HeartPulse, 
  Info, 
  X,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  ArrowRight,
  User,
  Download,
  Loader2,
  RefreshCw,
  FileText
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import ModalNuevoEquipo from '../components/ModalNuevoEquipo';
import ModalDetalleEquipo from '../components/ModalDetalleEquipo';
import { 
  listarEquipos, 
  crearEquipo, 
  actualizarEquipo, 
  darDeBajaEquipo, 
  obtenerHistorialEquipo 
} from '../services/equiposService';
import { listarSectores, crearSector } from '../services/sectoresService';
import { listarInsumos } from '../services/insumosService';
import { descargarReporteEquiposPDF } from '../services/reportesService';

export default function Equipos() {
  // Pestaña activa ('equipos' | 'sectores')
  const [activeTab, setActiveTab] = useState('equipos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'computadora' | 'impresora'
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Estados de datos conectados a base de datos
  const [equipos, setEquipos] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Modales
  const [isModalNuevoEquipoOpen, setIsModalNuevoEquipoOpen] = useState(false);
  const [isModalSectorOpen, setIsModalSectorOpen] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);

  // Modal para el Ciclo de Vida Patrimonial (Corazón)
  const [isCicloModalOpen, setIsCicloModalOpen] = useState(false);
  const [equipoCicloVida, setEquipoCicloVida] = useState(null);
  const [historialCiclo, setHistorialCiclo] = useState([]);
  const [cargandoCiclo, setCargandoCiclo] = useState(false);

  // Notificaciones Toast
  const [toastMessage, setToastMessage] = useState(null);

  const mostrarToast = (mensaje) => {
    setToastMessage(mensaje);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Carga inicial y recarga reactiva de datos desde el backend
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [dataEquipos, dataSectores, dataInsumos] = await Promise.all([
        listarEquipos().catch((err) => {
          console.error('Error al listar equipos:', err);
          return [];
        }),
        listarSectores().catch((err) => {
          console.error('Error al listar sectores:', err);
          return [];
        }),
        listarInsumos().catch((err) => {
          console.error('Error al listar insumos:', err);
          return [];
        })
      ]);
      setEquipos(dataEquipos);
      setSectores(dataSectores);
      setInsumos(dataInsumos);
    } catch (err) {
      console.error('Error al sincronizar con el servidor:', err);
      mostrarToast('Error al conectar con la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Manejador para registrar nuevo equipo
  const handleGuardarEquipo = async (nuevo) => {
    try {
      await crearEquipo(nuevo);
      mostrarToast(`Equipo ${nuevo.codPatrimonial || nuevo.marcaModelo} registrado exitosamente.`);
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al guardar el equipo.');
    }
  };

  // Manejador para actualizar equipo existente
  const handleUpdateEquipo = async (actualizado) => {
    try {
      await actualizarEquipo(actualizado.idEquipo, actualizado);
      mostrarToast(`Equipo ${actualizado.codPatrimonial || actualizado.marcaModelo} actualizado.`);
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al actualizar el equipo.');
    }
  };

  // Manejador para dar de baja patrimonial
  const handleDeleteEquipo = async (idEquipo, motivoBaja) => {
    try {
      await darDeBajaEquipo(idEquipo, motivoBaja);
      mostrarToast('Equipo dado de baja patrimonial.');
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al procesar la baja del equipo.');
    }
  };

  // Acción rápida: Poner en Mantenimiento o Reactivar a Operativo
  const handleToggleMantenimiento = async (e, item) => {
    e.stopPropagation();
    const nuevoEstado = item.estadoOperativo === 'En Mantenimiento' ? 'Operativo' : 'En Mantenimiento';
    const motivo = nuevoEstado === 'En Mantenimiento'
      ? 'Envío a mantenimiento técnico / reparación'
      : 'Retorno de servicio técnico - Restablecido a Operativo';

    try {
      await actualizarEquipo(item.idEquipo, {
        ...item,
        estadoOperativo: nuevoEstado,
        motivoBaja: motivo
      });
      mostrarToast(`Equipo ${item.codPatrimonial || item.marcaModelo} cambiado a ${nuevoEstado}.`);
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al modificar estado del equipo.');
    }
  };

  // Apertura y consulta del Ciclo de Vida Patrimonial (Corazón)
  const handleAbrirCicloVida = async (e, item) => {
    e.stopPropagation();
    // Tomar la versión más reciente del equipo desde el catálogo sincronizado
    const itemActualizado = equipos.find(eq => eq.idEquipo === item.idEquipo) || item;
    setEquipoCicloVida(itemActualizado);
    setHistorialCiclo([]);
    setCargandoCiclo(true);
    setIsCicloModalOpen(true);

    try {
      const data = await obtenerHistorialEquipo(item.idEquipo);
      setHistorialCiclo(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar ciclo de vida del equipo:', err);
      setHistorialCiclo([]);
    } finally {
      setCargandoCiclo(false);
    }
  };

  // Manejador para registrar nueva oficina / dependencia
  const handleGuardarSector = async (e) => {
    e.preventDefault();
    const form = e.target;
    const nombre = form.nombreOficina.value.trim();
    if (!nombre) return;

    try {
      await crearSector({ nombreSector: nombre });
      mostrarToast(`Sector ${nombre} registrado exitosamente.`);
      setIsModalSectorOpen(false);
      const dataSectores = await listarSectores();
      setSectores(dataSectores);
    } catch (err) {
      alert(err.message || 'Error al registrar el sector.');
    }
  };

  // Exportar reporte institucional en PDF
  const handleExportarPDF = async () => {
    setExportando(true);
    try {
      mostrarToast('Generando reporte patrimonial oficial en PDF...');
      await descargarReporteEquiposPDF();
      mostrarToast('Reporte PDF descargado con éxito.');
    } catch (err) {
      alert(err.message || 'Error al generar el reporte en PDF.');
    } finally {
      setExportando(false);
    }
  };

  // Generador e impresión oficial de la Hoja de Vida Patrimonial
  const handleDescargarHojaVida = (equipo, historial) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      mostrarToast('Por favor habilite las ventanas emergentes para generar el documento.');
      return;
    }
    const esImp = (equipo.tipoEquipo || '').toLowerCase() === 'impresora';
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Hoja de Vida Patrimonial - ${equipo.codPatrimonial || equipo.marcaModelo}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; text-transform: uppercase; margin: 0; }
          .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .box h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
          .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
          .row strong { color: #0f172a; }
          .timeline { margin-top: 25px; }
          .timeline h3 { font-size: 14px; text-transform: uppercase; color: #0f172a; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          .item { border-left: 3px solid #3b82f6; padding-left: 12px; margin-bottom: 16px; font-size: 12px; position: relative; }
          .item-head { font-weight: bold; color: #1e293b; display: flex; justify-content: space-between; margin-bottom: 4px; }
          .item-desc { color: #475569; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Tribunal Electoral Permanente</h1>
          <div class="sub">Hoja de Vida y Trazabilidad Patrimonial • Emitido el ${new Date().toLocaleDateString('es-AR')}</div>
        </div>

        <div class="grid">
          <div class="box">
            <h4>Datos del Activo Patrimonial</h4>
            <div class="row"><span>Código Patrimonial:</span><strong>${equipo.codPatrimonial || 'S/N'}</strong></div>
            <div class="row"><span>Tipo de Activo:</span><strong>${equipo.tipoEquipo || 'Equipo Informático'}</strong></div>
            <div class="row"><span>Marca y Modelo:</span><strong>${equipo.marcaModelo || 'N/D'}</strong></div>
            <div class="row"><span>Número de Serie:</span><strong>${equipo.numeroSerie || 'N/D'}</strong></div>
            <div class="row"><span>Estado Operativo:</span><strong>${equipo.estadoOperativo || 'Operativo'}</strong></div>
          </div>
          <div class="box">
            <h4>Ubicación y Conectividad</h4>
            <div class="row"><span>Sector / Dependencia:</span><strong>${equipo.nombreSector || 'No asignado'}</strong></div>
            <div class="row"><span>Dirección IP Fija:</span><strong>${equipo.ipFija || '0.0.0.0'}</strong></div>
            <div class="row"><span>Máscara de Subred:</span><strong>${equipo.mascaraSubred || '255.255.255.0'}</strong></div>
            <div class="row"><span>Grupo de Trabajo:</span><strong>${equipo.workgroup || 'WORKGROUP'}</strong></div>
            <div class="row"><span>${esImp ? 'Insumo Compatible' : 'Hardware Principal'}:</span><strong>${esImp ? (equipo.insumoCompatibleDescripcion || 'Sin insumo asignado') : (equipo.procesador || 'Intel/AMD') + ' • ' + (equipo.memoriaRAM || 'RAM')}</strong></div>
          </div>
        </div>

        <div class="timeline">
          <h3>Historial Cronológico de Trazabilidad Institucional</h3>
          ${historial && historial.length > 0 ? historial.map(h => `
            <div class="item">
              <div class="item-head">
                <span>[${h.tipoEvento}] ${h.titulo}</span>
                <span style="font-weight: normal; color: #64748b;">${h.fecha}</span>
              </div>
              <div class="item-desc">${h.descripcion}</div>
              ${h.origen && h.destino ? `<div style="font-size: 11px; color: #b45309; margin-top: 3px;">Origen: ${h.origen} ➔ Destino: ${h.destino}</div>` : ''}
              <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Operado por: ${h.operador || 'Sistema'}</div>
            </div>
          `).join('') : '<p style="font-size: 12px; color: #94a3b8;">Sin hitos registrados.</p>'}
        </div>

        <div class="footer">
          Documento oficial del Sistema de Inventario y Control de Activos • Tribunal Electoral Permanente
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Filtrado reactivo de Equipos
  const equiposFiltrados = useMemo(() => {
    return equipos.filter((item) => {
      const texto = searchTerm.toLowerCase();
      const coincideTexto = 
        (item.codPatrimonial || '').toLowerCase().includes(texto) ||
        (item.marcaModelo || '').toLowerCase().includes(texto) ||
        (item.nombreSector || '').toLowerCase().includes(texto) ||
        (item.ipFija || '').toLowerCase().includes(texto);

      const coincideTipo = 
        filtroTipo === 'todos' || 
        (filtroTipo === 'computadora' && item.tipoEquipo?.toLowerCase() === 'computadora') ||
        (filtroTipo === 'impresora' && item.tipoEquipo?.toLowerCase() === 'impresora');

      const coincideEstado = 
        filtroEstado === 'todos' || item.estadoOperativo === filtroEstado;

      return coincideTexto && coincideTipo && coincideEstado;
    });
  }, [equipos, searchTerm, filtroTipo, filtroEstado]);

  // Filtrado reactivo de Sectores
  const sectoresFiltrados = useMemo(() => {
    return sectores.filter((s) => {
      const texto = searchTerm.toLowerCase();
      const cod = (s.codigoSector || `SEC-${String(s.idSector).padStart(3, '0')}`).toLowerCase();
      const nom = (s.nombreOficina || s.nombreSector || '').toLowerCase();
      const resp = (s.responsable || '').toLowerCase();
      return cod.includes(texto) || nom.includes(texto) || resp.includes(texto);
    });
  }, [sectores, searchTerm]);

  // Paginación reactiva
  const totalPaginas = Math.ceil(equiposFiltrados.length / elementosPorPagina) || 1;
  const equiposPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return equiposFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [equiposFiltrados, paginaActual]);

  // Reset de página al filtrar
  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, filtroTipo, filtroEstado, activeTab]);

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
            {estado || 'N/D'}
          </span>
        );
    }
  };

  // Renderizador de Icono según Tipo de Equipo
  const renderTipoIcono = (tipo) => {
    if (tipo?.toLowerCase() === 'impresora') {
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
              Administración de activos informáticos, trazabilidad y control de ciclo de vida del Tribunal Electoral.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={cargarDatos}
              disabled={cargando}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition cursor-pointer"
              title="Refrescar catálogo"
            >
              <RefreshCw size={15} className={cargando ? 'animate-spin text-blue-600' : ''} />
            </button>
            <button
              type="button"
              onClick={handleExportarPDF}
              disabled={exportando}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {exportando ? <Loader2 size={15} className="animate-spin text-blue-600" /> : <FileDown size={15} />}
              <span>{exportando ? 'Exportando...' : 'Exportar PDF'}</span>
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
                <option value="impresora">Impresoras / Hardware</option>
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
                  {equiposFiltrados.length} Registros
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Guía visual interactiva */}
        {activeTab === 'equipos' && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/60 border border-blue-100 text-blue-800 rounded-xl text-xs">
            <Info size={15} className="text-blue-600 shrink-0" />
            <span>
              <strong>Operación de Inventario:</strong> Presione <strong>doble clic</strong> sobre cualquier equipo para ver o editar su ficha técnica completa. Presione el ícono del <strong className="text-rose-600">corazón</strong> para consultar su trazabilidad y ciclo de vida patrimonial en base de datos.
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
                  {cargando ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 size={24} className="animate-spin text-blue-600" />
                          <span>Cargando catálogo de equipos desde base de datos...</span>
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
                    equiposPaginados.map((item) => (
                      <tr 
                        key={item.idEquipo} 
                        onDoubleClick={() => {
                          setEquipoSeleccionado(item);
                          setIsDetalleModalOpen(true);
                        }}
                        className="hover:bg-blue-50/40 transition cursor-pointer select-none group"
                        title="Doble clic para ver ficha técnica completa, editar o dar de baja"
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
                            {item.insumoCompatibleDescripcion && (
                              <span className="ml-1.5 text-amber-600 font-sans">• {item.insumoCompatibleDescripcion}</span>
                            )}
                          </p>
                        </td>

                        {/* Sector Asignado */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin size={14} className="text-blue-500 shrink-0" />
                            <span className="font-medium">{item.nombreSector || item.nombreOficina || 'Sin sector'}</span>
                          </div>
                        </td>

                        {/* IP Fija */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                            <Network size={13} className="text-slate-400 shrink-0" />
                            <span>{item.ipFija || '0.0.0.0'}</span>
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="py-4 px-6 text-center">
                          {renderEstadoBadge(item.estadoOperativo)}
                        </td>

                        {/* Acciones Rápidas con el Corazón de Ciclo de Vida */}
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

                            {/* Botón Ciclo de Vida / Salud del Activo (Corazón) */}
                            <button
                              type="button"
                              onClick={(e) => handleAbrirCicloVida(e, item)}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-105 active:scale-95 rounded-lg border border-rose-200 transition cursor-pointer"
                              title="Consultar Ciclo de Vida y Trazabilidad del Activo"
                            >
                              <HeartPulse size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación y Resumen */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={16} />
                <span className="tracking-wider uppercase text-[11px]">Inventario Sincronizado en Tiempo Real</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  type="button" 
                  disabled={paginaActual <= 1}
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-600 font-semibold px-2">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button 
                  type="button" 
                  disabled={paginaActual >= totalPaginas}
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
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
                  {cargando ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={20} className="animate-spin text-blue-600" />
                          <span>Cargando dependencias...</span>
                        </div>
                      </td>
                    </tr>
                  ) : sectoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No se encontraron sectores registrados.
                      </td>
                    </tr>
                  ) : (
                    sectoresFiltrados.map((item) => {
                      const cantEquipos = equipos.filter(
                        (e) => String(e.idSector) === String(item.idSector) || e.nombreSector === item.nombreOficina
                      ).length;

                      return (
                        <tr key={item.idSector} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-6 font-mono font-bold text-blue-700">
                            <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100">
                              {item.codigoSector || `SEC-${String(item.idSector).padStart(3, '0')}`}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-800">{item.nombreOficina || item.nombreSector}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <MapPin size={14} className="text-slate-400" />
                              <span>{item.ubicacion || 'Edificio Tribunal Electoral'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-700 font-medium">{item.responsable || 'A cargo de Dependencia'}</td>
                          <td className="py-4 px-6 text-right">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full text-[11px]">
                              {cantEquipos} equipos
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

      {/* ========================================================================= */}
      {/* MODAL: CICLO DE VIDA Y LÍNEA DE TIEMPO PATRIMONIAL                      */}
      {/* ========================================================================= */}
      {isCicloModalOpen && equipoCicloVida && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => {
            setIsCicloModalOpen(false);
            setEquipoCicloVida(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                  <HeartPulse size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Ciclo de Vida Patrimonial
                  </h3>
                  <p className="text-xs text-slate-400">
                    Trazabilidad histórica completa y eventos de vida del activo institucional en base de datos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCicloModalOpen(false);
                  setEquipoCicloVida(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido en 2 Columnas: Ficha del Activo (Sin fotos irrelevantes) + Línea de Tiempo */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Columna Izquierda (4/12): Resumen Físico del Activo con Tarjeta Técnica */}
              <div className="md:col-span-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl p-5 space-y-4">
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ficha Técnica Oficial
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {equipoCicloVida.codPatrimonial || 'S/N Patrimonial'}
                  </span>
                </div>

                {/* Tarjeta de Dispositivo (Reemplazo moderno y limpio de la imagen de stock) */}
                <div className={`w-full py-5 rounded-2xl flex flex-col items-center justify-center border shadow-xs transition-all ${
                  equipoCicloVida.tipoEquipo?.toLowerCase() === 'impresora'
                    ? 'bg-gradient-to-b from-amber-50/80 to-amber-100/40 border-amber-200/80 text-amber-700'
                    : 'bg-gradient-to-b from-blue-50/80 to-blue-100/40 border-blue-200/80 text-blue-700'
                }`}>
                  <div className={`p-3.5 rounded-2xl shadow-sm mb-2.5 ${
                    equipoCicloVida.tipoEquipo?.toLowerCase() === 'impresora'
                      ? 'bg-white text-amber-600 border border-amber-100'
                      : 'bg-white text-blue-600 border border-blue-100'
                  }`}>
                    {equipoCicloVida.tipoEquipo?.toLowerCase() === 'impresora' ? (
                      <Printer size={32} />
                    ) : (
                      <Laptop size={32} />
                    )}
                  </div>
                  <strong className="text-sm font-bold text-slate-800 text-center px-3 leading-snug">
                    {equipoCicloVida.marcaModelo}
                  </strong>
                  <span className="text-[11px] font-mono text-slate-500 font-medium mt-0.5">
                    S/N: {equipoCicloVida.numeroSerie}
                  </span>
                  <div className="mt-2.5">
                    {renderEstadoBadge(equipoCicloVida.estadoOperativo)}
                  </div>
                </div>

                {/* Especificaciones Técnicas Clave */}
                <div className="space-y-2.5 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Tipo de Activo</span>
                    <strong className="text-slate-800">{equipoCicloVida.tipoEquipo || 'Equipo Informático'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Dependencia Asignada</span>
                    <span className="font-medium text-slate-700">{equipoCicloVida.nombreSector || equipoCicloVida.nombreOficina || 'Sin sector asignado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Dirección IP en Red</span>
                    <span className="font-mono text-slate-800">{equipoCicloVida.ipFija || '0.0.0.0'}</span>
                  </div>
                  {equipoCicloVida.procesador && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Procesador / Memoria</span>
                      <span>{equipoCicloVida.procesador} • {equipoCicloVida.memoriaRAM || 'RAM'}</span>
                    </div>
                  )}
                  {equipoCicloVida.insumoCompatibleDescripcion && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Insumo Compatible</span>
                      <span className="text-amber-700 font-medium">{equipoCicloVida.insumoCompatibleDescripcion}</span>
                    </div>
                  )}
                </div>

                {/* Botón Descargar Hoja de Vida Oficial */}
                <button
                  type="button"
                  onClick={() => handleDescargarHojaVida(equipoCicloVida, historialCiclo)}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Download size={14} className="text-slate-500" />
                  <span>Imprimir / Hoja de Vida</span>
                </button>
              </div>

              {/* Columna Derecha (8/12): Línea de Tiempo del Ciclo de Vida conectada a base de datos */}
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Línea de Tiempo Patrimonial
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Historial cronológico de eventos registrados en base de datos
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                    {historialCiclo.length} Hitos Registrados
                  </span>
                </div>

                {/* Contenedor Vertical de la Línea de Tiempo */}
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {cargandoCiclo ? (
                    <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="animate-spin text-blue-600" />
                      <span>Consultando trazabilidad institucional en base de datos...</span>
                    </div>
                  ) : historialCiclo.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100 p-4">
                      Sin eventos registrados en la línea de tiempo.
                    </div>
                  ) : (
                    historialCiclo.map((hito) => (
                      <div key={hito.id} className="relative group">
                        
                        {/* Círculo indicador de evento */}
                        <span className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${hito.dotColor}`} />

                        {/* Tarjeta del Hito */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs group-hover:border-slate-300 transition space-y-2">
                          
                          {/* Cabecera del hito con tipo de evento y fecha */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-800">{hito.titulo}</h5>
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${hito.badgeColor}`}>
                                {hito.tipoEvento}
                              </span>
                            </div>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <Calendar size={12} />
                              {hito.fecha}
                            </span>
                          </div>

                          {/* Descripción del evento */}
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {hito.descripcion}
                          </p>

                          {/* Detalle especial para Traslados o Entregas (Origen -> Destino) */}
                          {hito.origen && hito.destino && (
                            <div className="flex items-center gap-3 py-1.5 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700">
                              <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Origen</span>
                                <span className="font-semibold text-slate-700">{hito.origen}</span>
                              </div>
                              <ArrowRight size={14} className="text-blue-500 mt-2 shrink-0" />
                              <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Destino</span>
                                <span className="font-semibold text-blue-700">{hito.destino}</span>
                              </div>
                            </div>
                          )}

                          {/* Responsable técnico */}
                          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                            <span className="flex items-center gap-1.5">
                              <User size={12} className="text-slate-400" />
                              Registrado por <strong>{hito.operador || 'Sistema'}</strong>
                            </span>
                          </div>

                        </div>

                      </div>
                    ))
                  )}
                </div>

                <div className="text-center pt-2 pb-1 text-[11px] text-slate-400 italic">
                  Fin de los registros históricos del activo {equipoCicloVida.codPatrimonial || equipoCicloVida.marcaModelo}.
                </div>

              </div>

            </div>

            {/* Pie del Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCicloModalOpen(false);
                  setEquipoCicloVida(null);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cerrar Ciclo de Vida
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Registrar Nuevo Equipo con campos dinámicos */}
      <ModalNuevoEquipo
        isOpen={isModalNuevoEquipoOpen}
        onClose={() => setIsModalNuevoEquipoOpen(false)}
        onSave={handleGuardarEquipo}
        sectores={sectores}
        insumos={insumos}
        equipos={equipos}
      />

      {/* MODAL: Ficha Técnica Detallada, Edición y Acciones (Doble clic en fila) */}
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

      {/* MODAL: Registrar Nuevo Sector / Dependencia */}
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
                <p className="text-xs text-slate-400">Agregue una oficina física institucional al Tribunal</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalSectorOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGuardarSector} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Dependencia u Oficina</label>
                <input 
                  name="nombreOficina" 
                  required 
                  placeholder="Ej. Secretaría Electoral / Juzgado Civil" 
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
                  Guardar Dependencia
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