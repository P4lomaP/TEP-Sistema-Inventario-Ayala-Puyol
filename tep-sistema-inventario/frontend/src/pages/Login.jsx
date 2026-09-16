import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

export default function Login({ onSwitchToRegister }) {
  // 1. ZONA JAVASCRIPT: Estados para capturar datos y visibilidad
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // 2. FUNCIÓN DE ENVÍO: Se ejecuta al presionar "Ingresar"
  const handleSubmit = (e) => {
    e.preventDefault(); // Evita recargar la página

    // Validación básica en frontend
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setError('');
    console.log('Datos capturados listos para enviar:', { username, password });
    alert(`Intento de ingreso: ${username}`);
  };

  // 3. ZONA VISUAL (HTML + Tailwind reproduciendo la imagen)
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] p-4">
      {/* Tarjeta Modal Blanca */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
        
        {/* Botón de cerrar superior */}
        <button
          type="button"
          onClick={() => console.log('Cerrar modal')}
          className="absolute -top-3 -right-3 bg-white text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full p-1.5 shadow-md transition hover:scale-105"
        >
          <X size={18} />
        </button>

        {/* Título Principal */}
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8 tracking-tight">
          Inicia Sesión
        </h2>

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
            className="w-full mt-4 bg-[#5764E8] hover:bg-[#4653D4] text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200"
          >
            Ingresar
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