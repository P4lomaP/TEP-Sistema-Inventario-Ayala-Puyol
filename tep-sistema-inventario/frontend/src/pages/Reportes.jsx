import { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  RotateCcw, 
  Search, 
  Calendar, 
  Building2, 
  Package, 
  TrendingUp, 
  ArrowLeftRight, 
  ShieldCheck, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Database,
  X,
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import BannerAuditorReadOnly from '../components/BannerAuditorReadOnly';
import { getStoredUser } from '../services/authService';
import { obtenerReporte, obtenerLogsAuditoria, descargarBackupSQL, descargarReporteEquiposPDF } from '../services/reportesService';
import { listarSectores } from '../services/sectoresService';

export default function Reportes() {
  const currentUser = getStoredUser();
  const rol = currentUser?.rolAcceso;
  const isAdmin = rol === 'Administrador';
  const isAuditor = (rol || '').toLowerCase().includes('auditor');
  // 1. Estados de filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos');
  const [tipoMovimiento, setTipoMovimiento] = useState('Todos'); // 'Todos' | 'Egreso' | 'Ingreso'

  // 2. Estados de datos reales desde el backend
  const [sectores, setSectores] = useState([]);
  const [kpis, setKpis] = useState({
    totalRegistros: 0,
    totalMovimientos: 0,
    totalUnidades: 0,
    totalOficinasAtendidas: 0,
    insumosCriticos: 0
  });
  const [distribucionSectores, setDistribucionSectores] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [logsAuditoria, setLogsAuditoria] = useState([]);
  
  // 3. Estados visuales y modales
  const [cargando, setCargando] = useState(true);
  const [descargandoBackup, setDescargandoBackup] = useState(false);
  const [descargandoPDFEquipos, setDescargandoPDFEquipos] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [busquedaLogs, setBusquedaLogs] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 8;

  const mostrarToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Cargar lista de sectores u oficinas para el dropdown
  useEffect(() => {
    listarSectores()
      .then((data) => {
        if (Array.isArray(data)) {
          setSectores(data);
        }
      })
      .catch(() => {});
  }, []);

  // Cargar reporte analítico desde el backend con los filtros actuales
  const cargarReporte = async () => {
    setCargando(true);
    try {
      const data = await obtenerReporte({
        fechaDesde,
        fechaHasta,
        sector: sectorSeleccionado,
        tipo: tipoMovimiento
      });

      setKpis(data.kpis || {
        totalRegistros: 0,
        totalMovimientos: 0,
        totalUnidades: 0,
        totalOficinasAtendidas: 0,
        insumosCriticos: 0
      });
      setDistribucionSectores(data.distribucionSectores || []);
      setTransacciones(data.transacciones || []);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error cargando reporte:', err);
      mostrarToast(err.message || 'Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarReporte();
  }, []);

  // Cargar logs reales al abrir el modal de auditoría
  const handleAbrirLogs = async () => {
    setShowLogsModal(true);
    try {
      const logs = await obtenerLogsAuditoria();
      setLogsAuditoria(Array.isArray(logs) ? logs : []);
    } catch (err) {
      mostrarToast(`Error al consultar logs: ${err.message}`);
    }
  };

  // Limpiar filtros y recargar
  const handleLimpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    setSectorSeleccionado('Todos');
    setTipoMovimiento('Todos');
    // Ejecutar recarga sin parámetros
    setCargando(true);
    obtenerReporte()
      .then(data => {
        setKpis(data.kpis);
        setDistribucionSectores(data.distribucionSectores);
        setTransacciones(data.transacciones);
        setPaginaActual(1);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  };

  // Descarga real de backup de base de datos SQL (RF-07.3)
  const handleDescargarBackup = async () => {
    setDescargandoBackup(true);
    try {
      await descargarBackupSQL();
      mostrarToast('✓ Copia de seguridad SQL generada y descargada.');
    } catch (err) {
      mostrarToast(`Error en backup: ${err.message}`);
    } finally {
      setDescargandoBackup(false);
    }
  };

  // Descargar reporte institucional de equipos en PDF (Paloma)
  const handleDescargarPDFEquipos = async () => {
    setDescargandoPDFEquipos(true);
    try {
      await descargarReporteEquiposPDF();
      mostrarToast('✓ Reporte de inventario de equipos en PDF descargado.');
    } catch (err) {
      mostrarToast(`Error al descargar PDF: ${err.message}`);
    } finally {
      setDescargandoPDFEquipos(false);
    }
  };

  // Exportar a archivo Excel / CSV con soporte UTF-8
  const handleExportarExcel = () => {
    if (transacciones.length === 0) {
      mostrarToast('No hay registros para exportar con los filtros actuales.');
      return;
    }

    const headers = ['Comprobante', 'Fecha', 'Tipo', 'Insumo', 'Codigo', 'Cantidad', 'Destino', 'Sector', 'Operador'];
    const rows = transacciones.map(t => [
      `"${t.comprobanteRef || 'S/N'}"`,
      `"${t.fechaHora || ''}"`,
      `"${t.tipoMovimiento || ''}"`,
      `"${(t.insumoDescripcion || '').replace(/"/g, '""')}"`,
      `"${t.codigoInterno || ''}"`,
      t.cantidadAfectada,
      `"${(t.equipoModelo ? `${t.equipoModelo} (${t.equipoCodPatrimonial || 'S/C'})` : (t.agenteReceptor || 'Sin destino')).replace(/"/g, '""')}"`,
      `"${(t.equipoSector || t.agenteReceptor || 'Almacén Central').replace(/"/g, '""')}"`,
      `"${t.usuarioNombre || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_inventario_tep_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    mostrarToast('✓ Reporte exportado en formato CSV compatible con Excel.');
  };

  // Exportar / Imprimir reporte en PDF
  const handleImprimirPDF = () => {
    if (transacciones.length === 0) {
      mostrarToast('No hay datos para generar el documento imprimible.');
      return;
    }
    window.print();
  };

  // Paginación de la tabla de transacciones
  const totalPaginas = Math.ceil(transacciones.length / registrosPorPagina) || 1;
  const transaccionesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return transacciones.slice(inicio, inicio + registrosPorPagina);
  }, [transacciones, paginaActual]);

  // Filtrado interno para el modal de auditoría
  const logsFiltrados = useMemo(() => {
    if (!busquedaLogs.trim()) return logsAuditoria;
    const q = busquedaLogs.toLowerCase();
    return logsAuditoria.filter(l => 
      (l.accionRealizada || '').toLowerCase().includes(q) ||
      (l.moduloAfectado || '').toLowerCase().includes(q) ||
      (l.usuarioNombre || '').toLowerCase().includes(q)
    );
  }, [logsAuditoria, busquedaLogs]);

  return (
    <MainLayout activePage="reportes" pageTitle="Reportes y Auditoría">
      <div className="space-y-6 max-w-7xl mx-auto select-none pb-8">
        
        {/* ================= ENCABEZADO Y BOTONES DE EXPORTACIÓN ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Reportes y Métricas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulte consumos de insumos, distribución por sector y registros operativos.
            </p>
          </div>

          {/* Botones de Acción y Exportación */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={handleDescargarBackup}
                disabled={descargandoBackup}
                title="Descargar volcado SQL completo de la base de datos (Exclusivo Administrador)"
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer shadow-2xs"
              >
                <Database size={14} className={descargandoBackup ? 'animate-spin text-blue-600' : 'text-slate-500'} />
                <span>{descargandoBackup ? 'Generando...' : 'Backup SQL'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDescargarPDFEquipos}
              disabled={descargandoPDFEquipos}
              title="Descargar reporte institucional de equipos activos en PDF (PDFKit)"
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer shadow-2xs"
            >
              <FileText size={14} className={descargandoPDFEquipos ? 'animate-spin text-blue-600' : 'text-blue-600'} />
              <span>{descargandoPDFEquipos ? 'Generando...' : 'Inventario PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportarExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={handleImprimirPDF}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Banner informativo de modo auditoría solo lectura */}
        {isAuditor && <BannerAuditorReadOnly modulo="Reportes y Auditoría" />}

        {/* ================= CRITERIOS DE FILTRADO ================= */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <Filter size={14} className="text-blue-600" />
              <span>Filtros de Búsqueda</span>
            </div>
            {cargando && (
              <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Actualizando...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Fecha Desde */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50 focus:bg-white transition"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50 focus:bg-white transition"
              />
            </div>

            {/* Oficina / Sector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Oficina / Sector Destino
              </label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={sectorSeleccionado}
                  onChange={(e) => setSectorSeleccionado(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50 focus:bg-white text-slate-700 cursor-pointer"
                >
                  <option value="Todos">Todas las Oficinas</option>
                  {sectores.map((s) => {
                    const nombre = s.nombreSector || s.nombreOficina;
                    return (
                      <option key={s.idSector || nombre} value={nombre}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Tipo de Movimiento */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tipo de Movimiento
              </label>
              <div className="relative">
                <ArrowLeftRight size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={tipoMovimiento}
                  onChange={(e) => setTipoMovimiento(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50 focus:bg-white text-slate-700 cursor-pointer"
                >
                  <option value="Todos">Todos los Movimientos</option>
                  <option value="Egreso">Salidas / Egresos de Stock</option>
                  <option value="Ingreso">Entradas / Compras</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={cargarReporte}
              disabled={cargando}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Search size={14} />
              <span>Generar Reporte</span>
            </button>
          </div>
        </div>

        {/* ================= 4 TARJETAS DE MÉTRICAS (KPIs) ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unidades Movidas</p>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">{kpis.totalUnidades}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">En {kpis.totalRegistros} transacciones</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Package size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oficinas Atendidas</p>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">{kpis.totalOficinasAtendidas}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Destinos habilitados</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Building2 size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Órdenes / Remitos</p>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">{kpis.totalMovimientos}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Comprobantes válidos</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <ArrowLeftRight size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alertas de Stock</p>
              <h4 className={`text-xl sm:text-2xl font-bold mt-0.5 ${kpis.insumosCriticos > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {kpis.insumosCriticos}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Bajo stock de seguridad</p>
            </div>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              kpis.insumosCriticos > 0 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <AlertCircle size={20} />
            </div>
          </div>

        </div>

        {/* ================= SECCIÓN CENTRAL: GRÁFICO + TABLA DETALLADA ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Gráfico de Consumo por Dependencia (5/12) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Distribución de Consumo por Sector</h3>
              <p className="text-xs text-slate-400">Porcentaje de insumos suministrados según destino</p>
            </div>

            {distribucionSectores.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Building2 size={24} className="mx-auto mb-2 text-slate-300" />
                <p>No se registran consumos con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Barras porcentuales horizontales modernas y limpias */}
                <div className="space-y-3 pt-2">
                  {distribucionSectores.map((s) => (
                    <div key={s.nombre} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={s.nombre}>
                          {s.nombre}
                        </span>
                        <span className="font-bold text-slate-900">
                          {s.unidades} un. <span className="text-slate-400 font-normal">({s.porcentaje}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${s.porcentaje}%`, backgroundColor: s.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Insight analítico breve */}
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                  <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    El sector <strong>{distribucionSectores[0]?.nombre}</strong> concentra el mayor consumo ({distribucionSectores[0]?.porcentaje}%) en este período.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de Registros del Reporte (7/12) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Vista Previa de Transacciones</h3>
                  <p className="text-xs text-slate-400">Detalle de movimientos en el período consultado</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {transacciones.length} registros
                </span>
              </div>

              {/* Tabla de registros */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3.5">Comprobante</th>
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3.5">Insumo</th>
                      <th className="py-3 px-2.5 text-center">Cant.</th>
                      <th className="py-3 px-3">Destino</th>
                      <th className="py-3 px-3">Operador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {transaccionesPaginadas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          <Package size={24} className="mx-auto mb-2 text-slate-300" />
                          <p>No se encontraron movimientos registrados para este filtro.</p>
                        </td>
                      </tr>
                    ) : (
                      transaccionesPaginadas.map((t) => {
                        const destinoTexto = t.equipoModelo 
                          ? `${t.equipoModelo} (${t.equipoCodPatrimonial || 'S/C'})`
                          : (t.equipoSector || t.agenteReceptor || 'Sin destino');

                        return (
                          <tr key={t.idDetalle || `${t.idMovimiento}-${t.idInsumo}`} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                              {t.comprobanteRef || 'S/N'}
                            </td>
                            <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                              {t.fechaCorta || t.fechaHora?.slice(0, 10)}
                            </td>
                            <td className="py-3 px-3.5 font-semibold text-slate-800">
                              <div className="truncate max-w-[160px]" title={t.insumoDescripcion}>
                                {t.insumoDescripcion}
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">{t.codigoInterno}</span>
                            </td>
                            <td className="py-3 px-2.5 text-center font-bold text-slate-900">
                              {t.cantidadAfectada}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              <span className="truncate block max-w-[140px]" title={destinoTexto}>
                                {destinoTexto}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                              {t.usuarioNombre}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {transacciones.length > registrosPorPagina && (
              <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 select-none">
                <span>
                  Página <strong>{paginaActual}</strong> de {totalPaginas}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ================= BARRA INFERIOR: ACCESO A LOGS DE AUDITORÍA ================= */}
        <div className="bg-[#1b2d45] text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-wide">Registro de Actividad y Auditoría</h4>
              <p className="text-[11px] text-slate-300">
                Historial de operaciones y acciones realizadas por los usuarios del sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAbrirLogs}
            className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Ver Registro de Auditoría
          </button>
        </div>

        {/* Footer Institucional */}
        <div className="text-center pt-2 pb-2 text-[11px] text-slate-400 tracking-wider">
          © 2026 TRIBUNAL ELECTORAL PERMANENTE • MÓDULO DE REPORTES Y AUDITORÍA
        </div>

      </div>

      {/* ================= MODAL: LOG DE AUDITORÍA ================= */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Registro de Auditoría</h3>
                  <p className="text-xs text-slate-400">Historial cronológico de operaciones del sistema</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Buscador dentro de los logs */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaLogs}
                onChange={(e) => setBusquedaLogs(e.target.value)}
                placeholder="Filtrar por usuario, acción o módulo..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Tabla de Logs */}
            <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl max-h-[420px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3">Módulo</th>
                    <th className="py-2.5 px-3">Acción Registrada</th>
                    <th className="py-2.5 px-3 text-right">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-400 text-xs">
                        No se encontraron registros de auditoría.
                      </td>
                    </tr>
                  ) : (
                    logsFiltrados.map((log) => (
                      <tr key={log.idLog} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.fechaHora}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold">
                            {log.moduloAfectado}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {log.accionRealizada}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                          {log.usuarioNombre}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-100">
              <span>Total registros en log: {logsAuditoria.length}</span>
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span>{toastMessage}</span>
        </div>
      )}

    </MainLayout>
  );
}