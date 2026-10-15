import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  Menu, 
  User, 
  LogOut, 
  Shield, 
  Search, 
  ChevronRight,
  HelpCircle,
  X,
  Package,
  Layers,
  Boxes,
  ArrowLeftRight,
  Workflow,
  FileText,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser, logoutService } from '../services/authService';
import ThemeToggle from './ThemeToggle';

// Mapeo dinámico para la Miga de Pan (Breadcrumb inteligente)
const BREADCRUMBS_MAP = {
  '/dashboard': { section: 'Panel Principal', page: 'Dashboard', icon: LayoutGrid, color: 'text-blue-500' },
  '/equipos': { section: 'Gestión y Logística', page: 'Equipos Patrimoniales', icon: Package, color: 'text-cyan-500' },
  '/equipos-patrimoniales': { section: 'Gestión y Logística', page: 'Equipos Patrimoniales', icon: Package, color: 'text-cyan-500' },
  '/insumos': { section: 'Gestión y Logística', page: 'Catálogo de Insumos', icon: Layers, color: 'text-blue-500' },
  '/catalogo-insumos': { section: 'Gestión y Logística', page: 'Catálogo de Insumos', icon: Layers, color: 'text-blue-500' },
  '/almacen': { section: 'Gestión y Logística', page: 'Depósito y Estantes', icon: Boxes, color: 'text-indigo-500' },
  '/mapa-almacen': { section: 'Gestión y Logística', page: 'Depósito y Estantes', icon: Boxes, color: 'text-indigo-500' },
  '/deposito': { section: 'Gestión y Logística', page: 'Depósito y Estantes', icon: Boxes, color: 'text-indigo-500' },
  '/estantes': { section: 'Gestión y Logística', page: 'Depósito y Estantes', icon: Boxes, color: 'text-indigo-500' },
  '/movimientos': { section: 'Gestión y Logística', page: 'Movimientos', icon: ArrowLeftRight, color: 'text-cyan-500' },
  '/movement': { section: 'Gestión y Logística', page: 'Movimientos', icon: ArrowLeftRight, color: 'text-cyan-500' },
  '/compatibilidad': { section: 'Gestión y Logística', page: 'Matriz de Compatibilidad', icon: Workflow, color: 'text-emerald-500' },
  '/matriz-compatibilidad': { section: 'Gestión y Logística', page: 'Matriz de Compatibilidad', icon: Workflow, color: 'text-emerald-500' },
  '/reportes': { section: 'Auditoría y Control', page: 'Reportes y Auditoría', icon: FileText, color: 'text-amber-500' },
  '/auditorias': { section: 'Auditoría y Control', page: 'Reportes y Auditoría', icon: FileText, color: 'text-amber-500' },
  '/auditorias-reportes': { section: 'Auditoría y Control', page: 'Reportes y Auditoría', icon: FileText, color: 'text-amber-500' },
  '/backup': { section: 'Auditoría y Control', page: 'Reportes y Auditoría', icon: FileText, color: 'text-amber-500' },
  '/usuarios': { section: 'Auditoría y Control', page: 'Usuarios y Roles', icon: ShieldCheck, color: 'text-purple-500' },
  '/usuarios-roles': { section: 'Auditoría y Control', page: 'Usuarios y Roles', icon: ShieldCheck, color: 'text-purple-500' },
  '/perfil': { section: 'Operador', page: 'Mi Perfil', icon: User, color: 'text-blue-500' },
  '/profile': { section: 'Operador', page: 'Mi Perfil', icon: User, color: 'text-blue-500' },
};

// Ítems para búsqueda global en el Spotlight / Command Bar
const SPOTLIGHT_ITEMS = [
  { id: 'dashboard', title: 'Dashboard Principal', category: 'Panel Principal', path: '/dashboard', icon: LayoutGrid },
  { id: 'equipos', title: 'Equipos Informáticos y Hardware', category: 'Gestión y Logística', path: '/equipos', icon: Package },
  { id: 'insumos', title: 'Catálogo de Suministros e Insumos', category: 'Gestión y Logística', path: '/insumos', icon: Layers },
  { id: 'almacen', title: 'Depósito Físico y Estanterías', category: 'Gestión y Logística', path: '/almacen', icon: Boxes },
  { id: 'movimientos', title: 'Historial de Movimientos y Despachos', category: 'Gestión y Logística', path: '/movimientos', icon: ArrowLeftRight },
  { id: 'compatibilidad', title: 'Matriz de Compatibilidad Hardware-Insumos', category: 'Gestión y Logística', path: '/compatibilidad', icon: Workflow },
  { id: 'reportes', title: 'Reportes, Auditoría y Backups', category: 'Auditoría y Control', path: '/reportes', icon: FileText },
  { id: 'usuarios', title: 'Gestión de Usuarios y Roles', category: 'Auditoría y Control', path: '/usuarios', icon: ShieldCheck, adminOnly: true },
  { id: 'perfil', title: 'Configuración de Mi Perfil', category: 'Operador', path: '/perfil', icon: User },
];

export default function Navbar({ title, isSidebarOpen = true, onToggleSidebar }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const dropdownRef = useRef(null);
  const spotlightInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Resolución del Breadcrumb según location.pathname
  const normalizedPath = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const breadcrumb = BREADCRUMBS_MAP[normalizedPath] || {
    section: 'Sistema',
    page: title || 'Dashboard',
    icon: LayoutGrid,
    color: 'text-blue-500'
  };

  // Obtener usuario en sesión
  const currentUser = getStoredUser() || { username: 'Operador', rolAcceso: 'Administrador' };
  const userRole = (currentUser.rolAcceso || currentUser.rol || 'Administrador').toUpperCase();
  const isAdmin = userRole.includes('ADMINISTRADOR');

  // Atajo de teclado global Ctrl+K / Cmd+K para abrir el Spotlight
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      } else if (e.key === 'Escape' && isSpotlightOpen) {
        setIsSpotlightOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpotlightOpen]);

  // Foco automático en el input al abrir spotlight
  useEffect(() => {
    if (isSpotlightOpen && spotlightInputRef.current) {
      setTimeout(() => spotlightInputRef.current?.focus(), 50);
    }
  }, [isSpotlightOpen]);

  // Cerrar menú de perfil al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logoutService();
    navigate('/login');
  };

  // Filtrar ítems de spotlight
  const filteredSpotlightItems = SPOTLIGHT_ITEMS
    .filter(item => !item.adminOnly || isAdmin)
    .filter(item => 
      item.title.toLowerCase().includes(spotlightQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(spotlightQuery.toLowerCase())
    );

  // Selector de estilo de rol para el badge del usuario
  const getRoleBadgeClasses = (role) => {
    if (role.includes('ADMINISTRADOR') || role.includes('ADMIN')) {
      return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
    }
    if (role.includes('TECNICO') || role.includes('TÉCNICO')) {
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    }
    return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/85 dark:bg-[#0b101d]/85 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 select-none transition-colors duration-200">
        
        {/* LADO IZQUIERDO: Botón Menú + Miga de Pan Inteligente (Breadcrumb) */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <motion.button
            type="button"
            onClick={onToggleSidebar}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-xl transition cursor-pointer shrink-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
            title={isSidebarOpen ? 'Colapsar barra lateral' : 'Expandir barra lateral'}
            aria-label="Alternar barra lateral"
          >
            <Menu size={20} />
          </motion.button>

          {/* Breadcrumb Inteligente con Categoría y Sección Actual */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-400 min-w-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
              Sistema
            </span>
            <ChevronRight size={13} className="hidden sm:inline-block text-slate-400 dark:text-slate-400 shrink-0" />
            
            <span className="hidden md:inline-block text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
              {breadcrumb.section}
            </span>
            <ChevronRight size={13} className="hidden md:inline-block text-slate-400 dark:text-slate-400 shrink-0" />

            {/* Página actual activa con indicador de pulso */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-cyan-400 shadow-xs"></span>
              </span>
              <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight truncate max-w-[160px] sm:max-w-none">
                {breadcrumb.page}
              </h2>
            </div>
          </div>
        </div>

        {/* CENTRO: Buscador Rápido (Estilo Spotlight / Command Bar) */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4">
          <motion.button
            type="button"
            onClick={() => setIsSpotlightOpen(true)}
            whileHover={{ scale: 1.01 }}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700/60 bg-slate-100/70 dark:bg-slate-900/50 text-slate-400 dark:text-slate-400 text-xs sm:text-sm hover:border-blue-400 dark:hover:border-cyan-500/50 hover:bg-white dark:hover:bg-slate-900/80 transition-all cursor-pointer shadow-inner group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search size={15} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors" />
              <span className="text-slate-500 dark:text-slate-400 text-xs truncate">
                Buscar equipo, insumo o serie...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 shadow-2xs shrink-0">
              Ctrl K
            </kbd>
          </motion.button>
        </div>

        {/* LADO DERECHO: ThemeToggle + Tarjeta de Perfil */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Alternador de Tema (Dark / Light Mode) */}
          <ThemeToggle />

          {/* Tarjeta de Perfil del Operador (Diseño Pastilla de Alta Gama) */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full border border-slate-200 dark:border-slate-700/60 bg-slate-50/90 dark:bg-slate-800/40 p-1 pr-3 flex items-center gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer shadow-xs"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              {/* Avatar con anillo de gradiente y letras iniciales */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center ring-2 ring-cyan-500/30 shadow-xs uppercase">
                  {currentUser.username.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0b101d]"></span>
              </div>

              {/* Nombre y etiqueta de rol */}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-gray-100 leading-none truncate max-w-[110px]">
                  {currentUser.username}
                </p>
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border mt-0.5 tracking-wider ${getRoleBadgeClasses(userRole)}`}>
                  {userRole}
                </span>
              </div>

              <ChevronDown 
                size={14} 
                className={`text-slate-400 dark:text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-blue-600 dark:text-cyan-400' : ''}`} 
              />
            </motion.button>

            {/* Dropdown del Perfil */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#0c1424] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-1.5 z-50 text-left overflow-hidden"
                >
                  {/* Encabezado */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/50">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {currentUser.username}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Tribunal Electoral Permanente
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border" style={{}}>
                      <Shield size={11} className="text-cyan-500" />
                      <span className="font-bold text-slate-700 dark:text-slate-200">{userRole}</span>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div className="py-1 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/perfil');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-cyan-400 rounded-xl transition text-left cursor-pointer font-medium"
                    >
                      <User size={15} className="text-slate-400" />
                      <span>Mi Perfil de Operador</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setShowHelpModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-cyan-400 rounded-xl transition text-left cursor-pointer font-medium"
                    >
                      <HelpCircle size={15} className="text-slate-400" />
                      <span>Ayuda y Soporte Judicial</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800/80"></div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition text-left cursor-pointer font-semibold"
                    >
                      <LogOut size={15} className="text-rose-500" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </header>

      {/* MODAL SPOTLIGHT COMMAND BAR (Ctrl + K) */}
      <AnimatePresence>
        {isSpotlightOpen && (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 select-none"
            onClick={() => setIsSpotlightOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white dark:bg-[#0c1424] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden"
            >
              {/* Barra de búsqueda dentro del Spotlight */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <Search size={18} className="text-blue-600 dark:text-cyan-400 shrink-0" />
                <input
                  ref={spotlightInputRef}
                  type="text"
                  value={spotlightQuery}
                  onChange={(e) => setSpotlightQuery(e.target.value)}
                  placeholder="Escriba para buscar módulos, inventario o acciones..."
                  className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsSpotlightOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Resultados */}
              <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                {filteredSpotlightItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No se encontraron coincidencias para "{spotlightQuery}"
                  </div>
                ) : (
                  filteredSpotlightItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setIsSpotlightOpen(false);
                          navigate(item.path);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-slate-800/60 transition text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-cyan-500 dark:group-hover:text-black transition-colors">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400">
                              {item.category}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          Ir ›
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer con atajos */}
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400">
                <span>Navegación Rápida Institucional</span>
                <div className="flex items-center gap-2">
                  <span>Seleccionar <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">↵</kbd></span>
                  <span>Cerrar <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">ESC</kbd></span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE AYUDA / SOPORTE */}
      <AnimatePresence>
        {showHelpModal && (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#0c1424] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Centro de Soporte TEP</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Sistema de Inventario y Control de Pañol</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p><strong>Tribunal Electoral Permanente:</strong></p>
                <p>Para consultas operativas, asignación de equipos informáticos, suministros o solicitud de cambio de roles, comuníquese con el área de Informática o Administración.</p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• Atajo de teclado: <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">Ctrl + K</kbd> para búsqueda rápida</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
