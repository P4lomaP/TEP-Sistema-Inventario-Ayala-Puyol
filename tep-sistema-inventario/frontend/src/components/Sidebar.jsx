import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Package, 
  Layers, 
  Boxes,
  ArrowLeftRight, 
  Workflow, 
  FileText, 
  ShieldCheck,
  Vote,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getStoredUser } from '../services/authService';

export default function Sidebar({ activePage = 'dashboard', isOpen = true, onClose }) {
  const navigate = useNavigate();

  const currentUser = getStoredUser();
  const rolNormalizado = (currentUser?.rolAcceso || currentUser?.rol || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const isAdmin = rolNormalizado === 'administrador';

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
    { id: 'equipos', label: 'Equipos Patrimoniales', icon: Package, path: '/equipos' },
    { id: 'insumos', label: 'Catálogos de Insumos', icon: Layers, path: '/insumos' },
    { id: 'almacen', label: 'Depósito y Estantes', icon: Boxes, path: '/almacen' },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight, path: '/movimientos' },
    { id: 'compatibilidad', label: 'Matriz de Compatibilidad', icon: Workflow, path: '/compatibilidad' },
    { id: 'reportes', label: 'Reportes y Auditoría', icon: FileText, path: '/reportes' },
    { id: 'usuarios', label: 'Usuarios y Roles', icon: ShieldCheck, path: '/usuarios', adminOnly: true },
  ];

  const menuItems = allMenuItems.filter(item => !item.adminOnly || isAdmin);

  const handleNavigate = (path) => {
    if (path) {
      navigate(path);
    }
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 bg-[#0d1b2a] dark:bg-slate-950 text-slate-300 min-h-screen flex flex-col flex-shrink-0 select-none transition-all duration-300 ease-in-out lg:static lg:z-auto border-r border-slate-800/60 dark:border-slate-800/80
        ${isOpen 
          ? 'w-64 translate-x-0 shadow-2xl lg:shadow-none lg:w-64 lg:opacity-100' 
          : 'w-64 -translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:opacity-0 pointer-events-none'
        }
      `}
    >
      {/* Contenedor interno rígido (256px) para evitar deformación durante la transición */}
      <div className="w-64 flex flex-col min-h-screen flex-shrink-0">
        {/* Logotipo y Título Institucional */}
        <div 
          onClick={() => handleNavigate('/dashboard')}
          className="h-16 sm:h-20 flex items-center justify-between px-5 sm:px-6 border-b border-slate-800/60 cursor-pointer hover:bg-slate-800/30 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Logotipo Animado Original del Tribunal Electoral Permanente */}
            <div className="relative shrink-0">
              {/* Halo de resplandor ambiental pulsante */}
              <motion.div
                className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600/30 via-cyan-500/25 to-indigo-600/30 blur-sm pointer-events-none"
                animate={{
                  opacity: [0.35, 0.75, 0.35],
                  scale: [0.95, 1.08, 0.95],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Contenedor del emblema con gradiente y bordes institucionales */}
              <motion.div
                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/25 via-[#132238] to-[#0a121e] border border-blue-400/35 shadow-lg shadow-blue-500/10 flex items-center justify-center overflow-hidden"
                whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {/* Destello de luz / Shimmer sheen periódico */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent -skew-x-12 pointer-events-none"
                  animate={{
                    x: ['-140%', '220%'],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    repeatDelay: 2.2,
                    ease: "easeInOut",
                  }}
                />

                {/* Ícono institucional electoral flotante */}
                <motion.div
                  animate={{
                    y: [0, -2, 0],
                    rotate: [0, -1.5, 1.5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-cyan-400 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] flex items-center justify-center"
                >
                  <Vote size={22} strokeWidth={2.2} />
                </motion.div>
              </motion.div>

              {/* Micro-indicador pulsante de estado institucional "Permanente" */}
              <span 
                className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none" 
                title="Tribunal Electoral Activo y Permanente"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 border border-[#0d1b2a] shadow-xs"></span>
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <motion.div
                className="flex items-center gap-1.5"
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.h1 
                  className="text-xs sm:text-sm font-extrabold tracking-tight leading-tight flex items-center gap-1.5"
                  animate={{
                    filter: [
                      'drop-shadow(0 0 0px rgba(56, 189, 248, 0))',
                      'drop-shadow(0 0 6px rgba(56, 189, 248, 0.55))',
                      'drop-shadow(0 0 0px rgba(56, 189, 248, 0))',
                    ],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <span className="text-white font-black tracking-wide">TEP</span>
                  <motion.span
                    className="bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400 bg-clip-text text-transparent font-extrabold"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    Inventario
                  </motion.span>
                </motion.h1>

                {/* Micro destello pulsante decorativo */}
                <motion.span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]"
                  animate={{
                    scale: [0.8, 1.35, 0.8],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>

              <p 
                className="text-[10px] sm:text-[11px] text-blue-400 dark:text-blue-400 font-semibold tracking-tight leading-tight mt-0.5" 
                title="Tribunal Electoral Permanente"
              >
                Tribunal Electoral Permanente
              </p>
            </div>
          </div>

          {/* Botón cerrar visible solo en móvil */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onClose) onClose();
            }}
            className="lg:hidden text-slate-400 dark:text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 py-4 sm:py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id || (item.id === 'reportes' && (activePage === 'auditorias' || activePage === 'reportes' || activePage === 'backup'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.path)}
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