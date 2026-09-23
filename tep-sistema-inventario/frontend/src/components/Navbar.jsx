import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, User, LogOut, Shield } from 'lucide-react';
import { getStoredUser, logoutService } from '../services/authService';

export default function Navbar({ title = 'Dashboard', isSidebarOpen = true, onToggleSidebar }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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
    <header className="h-16 sm:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 select-none relative z-30">
      {/* Izquierda: Botón Menú (para móvil y pantalla completa) + Título activo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title={isSidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
          aria-label="Alternar barra lateral"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
          <h2 className="text-sm sm:text-base font-semibold tracking-tight text-slate-800 capitalize truncate max-w-[160px] sm:max-w-none">
            {title}
          </h2>
        </div>
      </div>

      {/* Derecha: Perfil de Usuario con Menú Desplegable */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer text-left"
          aria-expanded={isProfileOpen}
          aria-haspopup="true"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.username}</p>
            <p className="text-[11px] text-slate-400">{currentUser.rolAcceso}</p>
          </div>
          <div className="relative flex items-center gap-1.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-slate-200 shadow-xs uppercase">
              {currentUser.username.charAt(0)}
            </div>
            <ChevronDown 
              size={14} 
              className={`text-slate-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-blue-600' : ''}`} 
            />
          </div>
        </button>

        {/* Ventana flotante (Dropdown) */}
        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
            {/* Encabezado del Dropdown */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-800">{currentUser.username}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser.username}@tribunal.gob.ar</p>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
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
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition text-left cursor-pointer font-medium"
              >
                <User size={16} className="text-slate-400" />
                <span>Mi Perfil</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer font-medium"
              >
                <LogOut size={16} className="text-rose-500" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
