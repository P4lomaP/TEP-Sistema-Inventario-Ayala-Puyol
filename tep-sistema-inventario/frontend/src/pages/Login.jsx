import { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Clock } from 'lucide-react';
import { loginService } from '../services/authService';

export default function Login({ onSwitchToRegister, onLoginSuccess }) {
  // 1. ZONA JAVASCRIPT: Estados para capturar datos, visibilidad y carga
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mensaje de advertencia si la sesión fue cerrada por 30 minutos de inactividad
  const [inactivityNotice, setInactivityNotice] = useState(() => {
    const msg = sessionStorage.getItem('tep_inactivity_message');
    if (msg) {
      sessionStorage.removeItem('tep_inactivity_message');
      return msg;
    }
    return '';
  });

  // 2. FUNCIÓN DE ENVÍO: Petición real al backend POST /api/auth/login
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita recargar la página
    setError('');
    setInactivityNotice('');

    if (!username.trim() || !password) {
      setError('Por favor, ingrese usuario y contraseña.');
      return;
    }

    try {
      setIsLoading(true);
      // Petición al backend que además guarda token y usuario en localStorage
      const data = await loginService(username.trim(), password);

      // Redirigir al dashboard si fue exitoso
      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
    } catch (err) {
      // Captura y muestra el mensaje exacto devuelto por la API (400, 401, 403, 500)
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. ZONA VISUAL (HTML + Tailwind reproduciendo la imagen)
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] p-4 sm:p-6">
      {/* Tarjeta Modal Blanca */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl sm:shadow-2xl p-6 sm:p-10 my-4 sm:my-0">
        
        {/* Botón de cerrar superior */}
        <button
          type="button"
          onClick={() => console.log('Cerrar modal')}
          className="absolute top-4 right-4 sm:-top-3 sm:-right-3 bg-white text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full p-1.5 shadow-md transition hover:scale-105"
        >
          <X size={18} />
        </button>

        {/* Título Principal */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-8 tracking-tight">
          Inicia Sesión
        </h2>

        {/* Mensaje de alerta por sesión cerrada por inactividad */}
        {inactivityNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3.5 mb-6 flex items-start gap-2.5 shadow-xs">
            <Clock size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Sesión finalizada por inactividad</p>
              <p className="text-amber-700 mt-0.5">{inactivityNotice}</p>
            </div>
          </div>
        )}

        {/* Mensaje de alerta por error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Campo: Nombre de Usuario */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nombre de Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="example.email@gmail.com"
              required
              className="w-full pb-2 text-sm text-gray-800 placeholder-gray-400 border-b border-gray-300 focus:border-indigo-600 focus:outline-none transition"
            />
          </div>

          {/* Campo: Password con botón de visibilidad */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter at least 8+ characters"
                required
                className="w-full pb-2 pr-8 text-sm text-gray-800 placeholder-gray-400 border-b border-gray-300 focus:border-indigo-600 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-[#5764E8] hover:bg-[#4653D4] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              <span>Ingresar</span>
            )}
          </button>
        </form>

        {/* Enlace Inferior */}
        <div className="mt-8 text-center text-xs text-gray-500">
          ¿No tienes una cuenta?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[#5764E8] font-semibold hover:underline inline-block ml-1 cursor-pointer"
          >
            Registrate acá
          </button>
        </div>

      </div>
    </div>
  );
}