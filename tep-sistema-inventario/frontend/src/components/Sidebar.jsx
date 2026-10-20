import { useState } from 'react';
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
  X,
  LogOut,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, logoutService } from '../services/authService';

export default function Sidebar({ activePage = 'dashboard', isOpen = true, onClose }) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentUser = getStoredUser();
  const rolNormalizado = (currentUser?.rolAcceso || currentUser?.rol || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const isAdmin = rolNormalizado === 'administrador';

  // Secciones jerárquicas del menú
  const menuSections = [
    {
      title: 'Panel Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
      ],
    },
    {
      title: 'Gestión y Logística',
      items: [
        { id: 'equipos', label: 'Equipos Patrimoniales', icon: Package, path: '/equipos' },
        { id: 'insumos', label: 'Catálogo de Insumos', icon: Layers, path: '/insumos' },
        { id: 'almacen', label: 'Depósito y Estantes', icon: Boxes, path: '/almacen' },
        { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight, path: '/movimientos' },
        { id: 'compatibilidad', label: 'Matriz de Compatibilidad', icon: Workflow, path: '/compatibilidad' },
      ],
    },
    {
      title: 'Auditoría y Control',
      items: [
        { id: 'reportes', label: 'Reportes y Auditoría', icon: FileText, path: '/reportes' },
        { id: 'usuarios', label: 'Usuarios y Roles', icon: ShieldCheck, path: '/usuarios', adminOnly: true },
      ],
    },
  ];

  const handleNavigate = (path) => {
    if (path) {
      navigate(path);
    }
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = () => {
    logoutService();
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#090d16] text-slate-700 dark:text-slate-300 min-h-screen flex flex-col flex-shrink-0 select-none transition-all duration-300 ease-in-out lg:static lg:z-auto border-r border-slate-200/90 dark:border-slate-800/80 shadow-lg lg:shadow-none
        ${isOpen 
          ? 'w-72 translate-x-0 lg:w-72 lg:opacity-100' 
          : 'w-72 -translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:opacity-0 pointer-events-none'
        }
      `}
    >
      {/* Contenedor interno rígido (288px / w-72) para evitar deformación durante la transición */}
      <div className="w-72 flex flex-col h-screen flex-shrink-0">
        
        {/* Cabecera Institucional (Logo & Branding) */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0b101d]/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div 
              onClick={() => handleNavigate('/dashboard')}
              className="flex items-center gap-3 min-w-0 cursor-pointer group"
            >
              {/* Contenedor del isotipo con efecto de cristal y marco brillante */}
              <div className="relative shrink-0">
                <motion.div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-400/30 to-indigo-500/20 dark:from-cyan-500/30 dark:via-blue-600/30 dark:to-cyan-400/20 blur-sm pointer-events-none"
                  animate={{
                    opacity: [0.35, 0.75, 0.35],
                    scale: [0.95, 1.06, 0.95],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  className="relative w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-cyan-500/40 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-500/10 flex items-center justify-center overflow-hidden p-1"
                  whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0] }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {/* Destello de luz */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/30 dark:via-cyan-300/20 to-transparent -skew-x-12 pointer-events-none z-10"
                    animate={{ x: ['-140%', '220%'] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatDelay: 2.5,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Logo institucional electoral (Mouse TEP) */}
                  <img
                    src="/images/logo-tep-icon.png"
                    alt="Logo TEP Inventario"
                    className="w-full h-full object-contain drop-shadow-[0_2px_6px_rgba(6,182,212,0.3)]"
                  />
                </motion.div>
              </div>

              {/* Títulos de marca */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                    TEP <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent font-extrabold">Inventario</span>
                  </h1>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate mt-0.5" title="Tribunal Electoral Permanente">
                  Tribunal Electoral Permanente
                </p>
              </div>
            </div>

            {/* Botón cerrar para móvil */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
              className="lg:hidden text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>

        </div>

        {/* Lista de Navegación Agrupada Jerárquicamente */}
        <nav className="flex-1 py-3 px-3 space-y-5 overflow-y-auto overflow-x-hidden">
          {menuSections.map((section, sIdx) => {
            // Filtrar ítems de la sección según permisos de administrador
            const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {/* Separador tipográfico de categoría */}
                <h3 className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase px-3 mb-1.5 select-none">
                  {section.title}
                </h3>

                {/* Enlaces de la sección */}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = 
                      activePage === item.id || 
                      (item.id === 'reportes' && (activePage === 'auditorias' || activePage === 'reportes' || activePage === 'backup'));

                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.path)}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer text-left relative group border-l-4
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700 font-bold border-blue-600 shadow-xs dark:bg-slate-800 dark:text-cyan-300 dark:font-bold dark:border-cyan-400 dark:shadow-md dark:shadow-cyan-950/40' 
                            : 'border-transparent text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white font-medium'
                          }
                        `}
                      >
                        {/* Contenedor del ícono */}
                        <div className={`
                          p-1.5 rounded-lg shrink-0 transition-all duration-200
                          ${isActive 
                            ? 'bg-blue-100 border border-blue-300 text-blue-600 dark:bg-cyan-500/20 dark:border-cyan-400/60 dark:text-cyan-300' 
                            : 'bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-cyan-300 dark:group-hover:border-cyan-500/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-700/60'
                          }
                        `}>
                          <Icon 
                            size={16} 
                            className={`
                              transition-all duration-200
                              ${isActive 
                                ? 'text-blue-600 dark:text-cyan-300 dark:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' 
                                : 'text-slate-500 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-cyan-300'
                              }
                            `} 
                          />
                        </div>

                        {/* Texto del ítem */}
                        <span className="truncate flex-1 tracking-tight">
                          {item.label}
                        </span>

                        {/* Chevron sutil al hover */}
                        <ChevronRight 
                          size={14} 
                          className={`
                            shrink-0 transition-all duration-200
                            ${isActive 
                              ? 'text-blue-600 dark:text-cyan-300 opacity-100' 
                              : 'text-slate-300 dark:text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 dark:group-hover:text-cyan-400'
                            }
                          `} 
                        />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Pie del Sidebar (Acciones Rápidas del Usuario y Logout) */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#070b13]/80 space-y-2.5">
          {/* Confirmación suave de logout */}
          <AnimatePresence>
            {showLogoutConfirm ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  <AlertTriangle size={15} />
                  <span>¿Cerrar sesión en el TEP?</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    Sí, Salir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-1.5 px-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-lg transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-rose-200 dark:group-hover:border-rose-800 text-slate-600 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    <LogOut size={15} />
                  </div>
                  <span>Cerrar Sesión</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                  Salir
                </span>
              </button>
            )}
          </AnimatePresence>

          {/* Texto discreto institucional */}
          <div className="pt-1 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-400 tracking-tight">
              © 2026 Tribunal Electoral Permanente
            </p>
          </div>
        </div>

      </div>
    </aside>
  );
}