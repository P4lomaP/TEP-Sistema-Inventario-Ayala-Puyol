import { useState } from 'react';
import { X, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function Register({ onSwitchToLogin }) {
  // 1. ZONA JAVASCRIPT: Estados para capturar los datos del nuevo usuario
  const [username, setUsername] = useState('');
  const [rolAcceso, setRolAcceso] = useState('Tecnico');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 2. FUNCIÓN DE ENVÍO: Validaciones de registro en frontend
  const handleSubmit = (e) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    
    // Objeto listo con los campos exactos de la tabla Usuarios
    const nuevoUsuario = {
      username,
      password,
      rolAcceso,
      estadoActivo: 1,
    };

    console.log('Datos de registro listos para la API:', nuevoUsuario);
    setSuccess(true);
  };

  // 3. ZONA VISUAL (HTML + Tailwind reproduciendo la interfaz modal)
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] p-4">
      {/* Tarjeta Modal Blanca */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 my-6">
        
        {/* Botón de cerrar superior */}
        <button
          type="button"
          onClick={() => console.log('Cerrar modal')}
          className="absolute -top-3 -right-3 bg-white text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full p-1.5 shadow-md transition hover:scale-105"
        >
          <X size={18} />
        </button>

        {/* Encabezado */}
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2 tracking-tight">
          Crear Cuenta
        </h2>
        <p className="text-xs text-center text-gray-500 mb-6">
          Registro institucional de operadores del sistema
        </p>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-3 mb-5">
            {error}
          </div>
        )}

        {/* Mensaje de confirmación local */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg p-3 mb-5 flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>Usuario registrado localmente con éxito.</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Campo: Nombre de Usuario */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nombre de Usuario / Correo
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="operador.tep@organismo.gob.ar"
              required
              className="w-full pb-2 text-sm text-gray-800 placeholder-gray-400 border-b border-gray-300 focus:border-indigo-600 focus:outline-none transition"
            />
          </div>

          {/* Campo: Rol de Acceso (RBAC institucional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Rol de Acceso Solicitado
            </label>
            <select
              value={rolAcceso}
              onChange={(e) => setRolAcceso(e.target.value)}
              className="w-full pb-2 text-sm text-gray-800 bg-transparent border-b border-gray-300 focus:border-indigo-600 focus:outline-none transition cursor-pointer"
            >
              <option value="Tecnico">Técnico (Gestión de equipos y stock)</option>
              <option value="Auditor">Auditor (Solo lectura y reportes)</option>
              <option value="Administrador">Administrador (Control total)</option>
            </select>
          </div>

          {/* Campo: Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
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

          {/* Campo: Confirmar Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="w-full pb-2 pr-8 text-sm text-gray-800 placeholder-gray-400 border-b border-gray-300 focus:border-indigo-600 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 bottom-2 text-gray-400 hover:text-gray-600 transition"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón Registrar */}
          <button
            type="submit"
            className="w-full mt-4 bg-[#5764E8] hover:bg-[#4653D4] text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200"
          >
            Registrar Operador
          </button>
        </form>

        {/* Enlace para volver a Iniciar Sesión */}
        <div className="mt-7 text-center text-xs text-gray-500">
          ¿Ya tienes una cuenta?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#5764E8] font-semibold hover:underline inline-block ml-1"
          >
            Inicia sesión acá
          </button>
        </div>

      </div>
    </div>
  );
}