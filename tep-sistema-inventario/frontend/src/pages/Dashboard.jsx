import { 
  Package, 
  Activity, 
  AlertTriangle, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import MainLayout from '../components/MainLayout';

export default function Dashboard() {
  // Datos simulados para los últimos 5 movimientos
  const movimientos = [
    {
      id: 'MOV-8842',
      hora: '14:25',
      tipo: 'Entrada',
      colorTipo: 'text-emerald-600 bg-emerald-50',
      iconoTipo: ArrowDownLeft,
      articulo: 'Monitor Dell UltraSharp 27"',
      destino: 'Almacén Central',
      usuario: 'Carlos Ruiz',
    },
    {
      id: 'MOV-8841',
      hora: '13:10',
      tipo: 'Salida',
      colorTipo: 'text-amber-600 bg-amber-50',
      iconoTipo: ArrowUpRight,
      articulo: 'Laptop HP EliteBook G8',
      destino: 'Depto. IT',
      usuario: 'Lucía Méndez',
    },
    {
      id: 'MOV-8840',
      hora: '11:45',
      tipo: 'Transferencia',
      colorTipo: 'text-blue-600 bg-blue-50',
      iconoTipo: ArrowLeftRight,
      articulo: 'Teclado Mecánico RGB',
      destino: 'Sede Norte',
      usuario: 'Marco Polo',
    },
  ];

  // Alturas porcentuales simuladas para las 12 barras mensuales
  const barrasGrafico = [
    { mes: 'Ene', valor: 42 },
    { mes: 'Feb', valor: 38 },
    { mes: 'Mar', valor: 62 },
    { mes: 'Abr', valor: 54 },
    { mes: 'May', valor: 78 },
    { mes: 'Jun', valor: 66 },
    { mes: 'Jul', valor: 58 },
    { mes: 'Ago', valor: 82 },
    { mes: 'Sep', valor: 70 },
    { mes: 'Oct', valor: 86 },
    { mes: 'Nov', valor: 80 },
    { mes: 'Dic', valor: 95 },
  ];

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
              Bienvenido al sistema centralizado de gestión. Supervise activos críticos, rastree movimientos de suministros y mantenga la eficiencia operativa de su institución en tiempo real.
            </p>
          </div>
        </div>

        {/* Bloque de 3 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* KPI 1: Equipos Activos */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Equipos Activos</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">30</h3>
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <Package size={22} />
            </div>
          </div>

          {/* KPI 2: Usuarios */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Usuarios</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">10</h3>
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <Activity size={22} />
            </div>
          </div>

          {/* KPI 3: Alertas Críticas */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 border-l-4 border-l-rose-500 shadow-sm flex justify-between items-center sm:col-span-2 lg:col-span-1">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alertas Críticas</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">3</h3>
              <p className="text-xs text-rose-600 font-medium mt-0.5">Insumos bajo umbral</p>
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        {/* Sección: Distribución Mensual de Insumos (Gráfico de Barras) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 sm:pb-6 border-b border-slate-100 gap-3 sm:gap-4">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">Distribución Mensual de Insumos</h4>
              <p className="text-xs text-slate-400">Histórico de suministros despachados durante el año actual</p>
            </div>
            <button
              type="button"
              className="flex items-center self-start sm:self-auto gap-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition"
            >
              <span>Últimos 12 meses</span>
              <Filter size={14} className="text-slate-400" />
            </button>
          </div>

          {/* Visualización de las 12 barras con scroll horizontal táctil para móviles */}
          <div className="overflow-x-auto pb-2 -mx-2 px-2 mt-4">
            <div className="h-52 sm:h-56 pt-6 sm:pt-8 pb-2 flex items-end justify-between gap-2 sm:gap-4 min-w-[500px]">
              {barrasGrafico.map((barra, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div
                    style={{ height: `${barra.valor}%` }}
                    className="w-full max-w-[40px] bg-[#162740] group-hover:bg-blue-600 rounded-t-md transition-all duration-300"
                  />
                  <span className="text-[11px] text-slate-400 font-medium">{barra.mes}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sección: Últimos 5 Movimientos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 gap-3">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">Últimos 5 Movimientos</h4>
              <p className="text-xs text-slate-400">Registro detallado de transacciones recientes de activos</p>
            </div>
            <button
              type="button"
              className="flex items-center self-start sm:self-auto gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition"
            >
              <span>Ver Todo</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Tabla de Registros responsive con scroll horizontal asegurado */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="bg-slate-50/60 text-slate-400 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Hora</th>
                  <th className="py-3.5 px-6">Tipo</th>
                  <th className="py-3.5 px-6">Artículo</th>
                  <th className="py-3.5 px-6">Destino</th>
                  <th className="py-3.5 px-6">Usuario</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {movimientos.map((mov) => {
                  const Icono = mov.iconoTipo;
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 font-medium text-slate-600">{mov.id}</td>
                      <td className="py-4 px-6 text-slate-500">{mov.hora}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${mov.colorTipo}`}>
                          <Icono size={13} />
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{mov.articulo}</td>
                      <td className="py-4 px-6 text-slate-500">{mov.destino}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-full text-[11px]">
                          {mov.usuario}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}