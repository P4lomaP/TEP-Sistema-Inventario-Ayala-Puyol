import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente interactivo de alto contraste para alternar entre Modo Claro y Modo Oscuro.
 * Soporta dos variantes: 'button' (botón delimitado para Navbar/Sidebar) y 'switch' (interruptor con selector).
 */
export default function ThemeToggle({ className = '', variant = 'button' }) {
  const { isDarkMode, toggleTheme } = useTheme();

  if (variant === 'switch') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
          isDarkMode ? 'bg-blue-600' : 'bg-slate-300'
        } ${className}`}
        role="switch"
        aria-checked={isDarkMode}
        aria-label="Alternar tema de interfaz"
        title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
            isDarkMode ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {isDarkMode ? (
            <Moon size={12} className="text-blue-600" />
          ) : (
            <Sun size={12} className="text-amber-500" />
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${className}`}
      aria-label="Alternar tema de interfaz"
      title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDarkMode ? (
        <Sun size={18} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] hover:rotate-45 transition-transform" />
      ) : (
        <Moon size={18} className="text-slate-800 hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
}
