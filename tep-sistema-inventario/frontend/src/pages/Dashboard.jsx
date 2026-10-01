import { useState, useEffect } from 'react';
import { 
  Package, 
  Activity, 
  AlertTriangle, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  MoreHorizontal,
  ChevronRight,
  RefreshCw,
  Clock,
  User,
  CheckCircle2,
  Inbox
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import BannerAuditorReadOnly from '../components/BannerAuditorReadOnly';
import { getDashboardData } from '../services/dashboardService';
import { getStoredUser } from '../services/authService';

export default function Dashboard() {
  const user = getStoredUser();
  const rolNormalizado = (user?.rolAcceso || user?.rol || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const isAuditor = rolNormalizado === 'auditor';

  // 1. Estados de datos reales desde el Backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    equiposActivos: 0,
    totalEquipos: 0,
    totalInsumos: 0,
    totalStockUnidades: 0,
    insumosCriticos: 0,
    distribucionMensual: [],
    ultimosMovimientos: []
  });

  // Función para cargar los datos consolidados desde el backend
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error al conectar con la API:', err);
      setError('No se pudo conectar con el servidor backend (http://localhost:3000). Verifique que esté encendido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Barras mensuales reales obtenidas desde el backend
  const mesesDefault = [
    { mes: 'Ene', valor: 8, unidades: 0 },
    { mes: 'Feb', valor: 8, unidades: 0 },
    { mes: 'Mar', valor: 8, unidades: 0 },
    { mes: 'Abr', valor: 8, unidades: 0 },
    { mes: 'May', valor: 8, unidades: 0 },
    { mes: 'Jun', valor: 8, unidades: 0 },
    { mes: 'Jul', valor: 8, unidades: 0 },
    { mes: 'Ago', valor: 8, unidades: 0 },
    { mes: 'Sep', valor: 8, unidades: 0 },
    { mes: 'Oct', valor: 8, unidades: 0 },
    { mes: 'Nov', valor: 8, unidades: 0 },
    { mes: 'Dic', valor: 8, unidades: 0 },
  ];

  const barrasGrafico = dashboardData.distribucionMensual && dashboardData.distribucionMensual.length === 12
    ? dashboardData.distribucionMensual
    : mesesDefault;

  // Helper para renderizar badge del tipo de movimiento
  const renderTipoBadge = (tipo) => {
    if (tipo === 'Ingreso') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <ArrowDownLeft size={13} />
          Ingreso
        </span>
      );
    }
    if (tipo === 'Egreso') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <ArrowUpRight size={13} />
          Egreso
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        <ArrowLeftRight size={13} />
        {tipo || 'Movimiento'}
      </span>
    );
  };

  return (
    <MainLayout activePage="dashboard" pageTitle="Dashboard">
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        
        {/* Banner Hero Institucional */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[140px] sm:min-h-[170px] flex items-center p-5 sm:p-8 text-white shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&auto=format&fit=crop&q=80"
            alt="Data Center"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-luminosity"
          />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1.5 sm:mb-2">Panel de Control Institucional</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              Bienvenido al sistema centralizado de gestión del Tribunal Electoral Permanente. Monitoreo en vivo de inventario, flota patrimonial y trazabilidad de movimientos.
            </p>
          </div>
        </div>

        {/* Banner de Modo Auditoría Solo Lectura */}
        {isAuditor && (
          <BannerAuditorReadOnly modulo="Panel de Control y Supervisión Global" />
        )}

        {/* Notificación de Error con botón de reintentar */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={cargarDatos}
              type="button"
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {/* Bloque de 3 KPIs conectados a endpoints reales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* KPI 1: Equipos Activos (GET /api/equipos -> estadoOperativo === 'Operativo') */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Equipos Activos</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                  {loading ? '...' : dashboardData.equiposActivos}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                  {loading ? '' : `de ${dashboardData.totalEquipos} registrados`}
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>En operación física</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package size={22} />
            </div>
          </div>

          {/* KPI 2: Total Insumos en Catálogo (GET /api/insumos) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Catálogo de Insumos</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                  {loading ? '...' : dashboardData.totalInsumos}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                  {loading ? '' : `ítems activos`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium mt-1">
                {loading ? '' : `${dashboardData.totalStockUnidades} unidades en depósito`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Activity size={22} />
            </div>
          </div>

          {/* KPI 3: Alertas Críticas (GET /api/insumos -> stockActual <= stockSeguridad) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700 border-l-4 border-l-rose-500 shadow-sm flex justify-between items-center sm:col-span-2 lg:col-span-1">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Alertas Críticas</p>
              <div className="flex items-baseline gap-2">
                <h3 className={`text-2xl sm:text-3xl font-black ${dashboardData.insumosCriticos > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                  {loading ? '...' : dashboardData.insumosCriticos}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                  {dashboardData.insumosCriticos === 1 ? 'insumo' : 'insumos'}
                </span>
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                {dashboardData.insumosCriticos > 0 ? 'Por debajo del umbral mínimo' : 'Inventario equilibrado'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        {/* Sección: Distribución Mensual de Insumos (Gráfico de Barras) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-700 gap-3 sm:gap-4">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white tracking-tight">Distribución Mensual de Insumos</h4>
              <p className="text-xs text-slate-400 dark:text-slate-400">Histórico de suministros despachados durante el año actual</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cargarDatos}
                title="Actualizar datos del servidor"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl transition cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refrescar</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl transition"
              >
                <span>Año 2026</span>
                <Filter size={14} className="text-slate-400 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Visualización de las 12 barras con scroll horizontal táctil para móviles */}
          <div className="overflow-x-auto pb-2 -mx-2 px-2 mt-4">
            <div className="h-52 sm:h-56 pt-6 sm:pt-8 pb-2 flex items-end justify-between gap-2 sm:gap-4 min-w-[500px]">
              {barrasGrafico.map((barra, index) => (
                <div 
                  key={index} 
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
                  title={`${barra.mes}: ${barra.unidades || 0} unidades despachadas`}
                >
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                    {barra.unidades || 0} un.
                  </div>
                  <div
                    style={{ height: `${barra.valor}%` }}
                    className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ${
                      (barra.unidades || 0) > 0 
                        ? 'bg-blue-600 group-hover:bg-blue-700 shadow-xs' 
                        : 'bg-slate-200 group-hover:bg-slate-300'
                    }`}
                  />
                  <span className="text-[11px] text-slate-400 dark:text-gray-400 font-medium">{barra.mes}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sección: Últimos 5 Movimientos (GET /api/movimientos -> slice(0, 5)) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-700 gap-3">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white tracking-tight">Últimos 5 Movimientos</h4>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                Registro de ingresos y egresos recientes del almacén
              </p>
            </div>
            <button
              type="button"
              onClick={cargarDatos}
              className="flex items-center self-start sm:self-auto gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <span>Actualizar lista</span>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Tabla de Registros responsive con scroll horizontal asegurado */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-200 uppercase font-bold text-[10px] border-b border-slate-100 dark:border-slate-700 select-none">
                <tr>
                  <th className="py-3.5 px-6">Comprobante / Ref</th>
                  <th className="py-3.5 px-6">Fecha y Hora</th>
                  <th className="py-3.5 px-6">Tipo</th>
                  <th className="py-3.5 px-6">Receptor / Destino</th>
                  <th className="py-3.5 px-6">Operador Responsable</th>
                  <th className="py-3.5 px-6 text-right">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-400">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <RefreshCw size={16} className="animate-spin text-blue-600" />
                        <span>Cargando movimientos...</span>
                      </div>
                    </td>
                  </tr>
                ) : dashboardData.ultimosMovimientos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-slate-300 dark:text-slate-600">
                          <Inbox size={28} />
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">No hay movimientos registrados recientemente.</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 max-w-sm">
                          Las transacciones de ingreso y egreso registradas aparecerán automáticamente aquí.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dashboardData.ultimosMovimientos.map((mov) => (
                    <tr key={mov.idMovimiento} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition">
                      {/* Comprobante */}
                      <td className="py-4 px-6 font-mono font-medium">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded text-[11px] font-bold border border-slate-200/60 dark:border-slate-600">
                          {mov.comprobanteRef || `MOV-#${mov.idMovimiento}`}
                        </span>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400 dark:text-slate-400" />
                          <span>{mov.fechaHora}</span>
                        </div>
                      </td>

                      {/* Tipo con pill */}
                      <td className="py-4 px-6">
                        {renderTipoBadge(mov.tipoMovimiento)}
                      </td>

                      {/* Receptor / Destino */}
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-white">
                        {mov.agenteReceptor || (
                          <span className="text-slate-400 dark:text-slate-400 font-normal italic">Depósito Central (Ingreso)</span>
                        )}
                      </td>

                      {/* Operador */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                          <User size={13} className="text-slate-400 dark:text-slate-400" />
                          <span className="font-medium">{mov.usuarioNombre || 'Sistema'}</span>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-4 px-6 text-right">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-medium px-2.5 py-1 rounded-full text-[11px] border border-slate-200/60 dark:border-slate-600">
                          {mov.usuarioRol || 'Operador'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}