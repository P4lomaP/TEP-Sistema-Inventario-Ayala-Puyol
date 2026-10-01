import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, User, LogOut, Shield } from 'lucide-react';
import { getStoredUser, logoutService } from '../services/authService';
import ThemeToggle from './ThemeToggle';

// Diccionario dinámico estricto de títulos según la ruta activa
const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/equipos': 'Equipos Patrimoniales',
  '/equipos-patrimoniales': 'Equipos Patrimoniales',
  '/insumos': 'Catálogos de Insumos',
  '/catalogo-insumos': 'Catálogos de Insumos',
  '/almacen': 'Depósito y Estantes',
  '/mapa-almacen': 'Depósito y Estantes',
  '/deposito': 'Depósito y Estantes',
  '/estantes': 'Depósito y Estantes',
  '/movimientos': 'Movimientos',
  '/movement': 'Movimientos',
  '/compatibilidad': 'Matriz de Compatibilidad',
  '/matriz-compatibilidad': 'Matriz de Compatibilidad',
  '/reportes': 'Reportes y Auditoría',
  '/auditorias': 'Reportes y Auditoría',
  '/auditorias-reportes': 'Reportes y Auditoría',
  '/backup': 'Reportes y Auditoría',
  '/usuarios': 'Usuarios y Roles',
  '/usuarios-roles': 'Usuarios y Roles',
  '/perfil': 'Mi Perfil',
  '/profile': 'Mi Perfil',
};

export default function Navbar({ title, isSidebarOpen = true, onToggleSidebar }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Resolución dinámica estricta del título según location.pathname
  const normalizedPath = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const currentTitle = ROUTE_TITLES[normalizedPath] || title || 'Dashboard';

  // Obtener usuario almacenado en sesión
  const currentUser = getStoredUser() || { username: 'Operador', rolAcceso: 'Administrador' };

  // Cerrar el menú desplegable al hacer clic fuera
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

  return (
    <header className="h-16 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 select-none relative z-30">
      {/* Izquierda: Botón Menú (para móvil y pantalla completa) + Título activo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          title={isSidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
          aria-label="Alternar barra lateral"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
          <h2 className="text-sm sm:text-base font-semibold tracking-tight text-slate-800 dark:text-white truncate max-w-[160px] sm:max-w-none">
            {currentTitle}
          </h2>
        </div>
      </div>

      {/* Derecha: Selector de Tema + Perfil de Usuario con Menú Desplegable */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition cursor-pointer text-left"
          aria-expanded={isProfileOpen}
          aria-haspopup="true"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 dark:text-gray-100 leading-tight">{currentUser.username}</p>
            <p className="text-[11px] text-slate-400 dark:text-gray-400">{currentUser.rolAcceso}</p>
          </div>
          <div className="relative flex items-center gap-1.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs uppercase">
              {currentUser.username.charAt(0)}
            </div>
            <ChevronDown 
              size={14} 
              className={`text-slate-500 dark:text-gray-300 transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-blue-600' : ''}`} 
            />
          </div>
        </button>

        {/* Ventana flotante (Dropdown) */}
        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
            {/* Encabezado del Dropdown */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-800 dark:text-white">{currentUser.username}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{currentUser.username}@tribunal.gob.ar</p>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200 dark:border-blue-700/50">
                <Shield size={10} />
                <span>{currentUser.rolAcceso}</span>
              </div>
            </div>

            {/* Opciones */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/perfil');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-blue-600 dark:hover:text-blue-400 transition text-left cursor-pointer font-medium"
              >
                <User size={16} className="text-slate-400 dark:text-slate-400" />
                <span>Mi Perfil</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left cursor-pointer font-medium"
              >
                <LogOut size={16} className="text-rose-500 dark:text-rose-400" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
