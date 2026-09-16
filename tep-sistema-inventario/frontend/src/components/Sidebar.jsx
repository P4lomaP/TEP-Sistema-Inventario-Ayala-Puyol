import { 
  LayoutGrid, 
  Package, 
  Layers, 
  ArrowLeftRight, 
  Workflow, 
  FileText, 
  ShieldCheck,
  X
} from 'lucide-react';

export default function Sidebar({ activePage = 'dashboard', isOpen = true, onClose }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'equipos', label: 'Equipos Patrimoniales', icon: Package },
    { id: 'insumos', label: 'Catálogos de Insumos', icon: Layers },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'compatibilidad', label: 'Matriz de Compatibilidad', icon: Workflow },
    { id: 'auditorias', label: 'Auditorias y Reportes', icon: FileText },
    { id: 'usuarios', label: 'Usuarios y Roles', icon: ShieldCheck },
  ];

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 bg-[#0d1b2a] text-slate-300 min-h-screen flex flex-col flex-shrink-0 select-none
        transition-all duration-300 ease-in-out
        lg:static lg:z-auto
        ${isOpen 
          ? 'w-64 translate-x-0 shadow-2xl lg:shadow-none lg:w-64 lg:opacity-100' 
          : 'w-64 -translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:opacity-0 pointer-events-none'
        }
      `}
    >
      {/* Contenedor interno rígido (256px) para evitar deformación durante la transición */}
      <div className="w-64 flex flex-col min-h-screen flex-shrink-0">
        {/* Logotipo y Título Institucional */}
        <div className="h-16 sm:h-20 flex items-center justify-between px-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <LayoutGrid size={22} />
            </div>
            <div>
              <h1 className="text-white text-sm font-bold tracking-wide leading-tight">Institutional</h1>
              <p className="text-[11px] sm:text-xs text-slate-400">Tribunal Electoral</p>
            </div>
          </div>

          {/* Botón cerrar visible solo en móvil */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 py-4 sm:py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onClose && window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1b2d45] text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#132238]'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}