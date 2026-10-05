import { useState } from 'react';
import { X, Eye, EyeOff, ShieldCheck, Loader2, KeyRound, Copy, Check, AlertTriangle, ChevronDown } from 'lucide-react';
import { registerService } from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';

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
  const [pinGenerado, setPinGenerado] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Copiar PIN al portapapeles
  const handleCopiarPin = () => {
    if (!pinGenerado) return;
    navigator.clipboard.writeText(pinGenerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // 2. FUNCIÓN DE ENVÍO: Validaciones de registro y llamada a la API POST /api/auth/register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password.length < 8) {
      setError('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setIsLoading(true);
      // Petición real al backend
      const res = await registerService({
        username: username.trim(),
        password,
        rolAcceso,
      });

      // El backend devuelve el PIN generado en texto claro para que el usuario lo anote
      if (res.pinRecuperacion) {
        setPinGenerado(res.pinRecuperacion);
      }
      setSuccess(true);

    } catch (err) {
      // Muestra el mensaje del backend ("El usuario ya está registrado", etc.)
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. ZONA VISUAL: Si el registro fue exitoso, mostrar pantalla con su PIN de recuperación
  if (success && pinGenerado) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] p-4 sm:p-6 py-8">
        {/* Botón flotante para alternar tema */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl sm:shadow-2xl p-6 sm:p-8 my-4 text-center animate-fade-in border border-slate-100 dark:border-slate-700">
          
          {/* Icono de éxito */}
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800/60 shadow-xs">
            <ShieldCheck size={36} />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 tracking-tight">
            ¡Usuario Registrado Exitosamente!
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 mb-6">
            La cuenta <strong className="text-slate-700 dark:text-gray-200">@{username}</strong> ({rolAcceso}) ha sido creada en el sistema.
          </p>

          {/* Tarjeta destacada con el PIN */}
          <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/60 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-5 mb-5 shadow-xs text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <KeyRound size={13} className="text-indigo-600 dark:text-indigo-400" />
                Tu PIN de Recuperación
              </span>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
                Válido por 30 días
              </span>
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/60 rounded-xl px-4 py-3 shadow-2xs">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-gray-100 tracking-widest">
                {pinGenerado}
              </span>
              <button
                type="button"
                onClick={handleCopiarPin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                title="Copiar código PIN"
              >
                {copiado ? (
                  <>
                    <Check size={14} className="text-emerald-300" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar PIN</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-600 dark:text-gray-300 leading-relaxed">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Importante:</strong> Guardá y anotá este PIN en un lugar seguro. Si olvidás tu contraseña, este código te permitirá restablecerla. Por seguridad del sistema, <strong>no podrás solicitar otro PIN por 30 días</strong>, lo que te obliga a recordar o tener anotada tu clave y previene solicitudes frecuentes cada semana o pocos días.
              </span>
            </div>
          </div>

          {/* Botón para ir al login */}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full bg-[#5764E8] hover:bg-[#4653D4] text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continuar a Iniciar Sesión</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Formulario Principal de Registro
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] p-4 sm:p-6 py-8">
      {/* Botón flotante para alternar tema */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Tarjeta Modal Blanca */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl sm:shadow-2xl p-6 sm:p-10 my-4 sm:my-6 border border-transparent dark:border-slate-700/60">
        
        {/* Encabezado */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 tracking-tight">
          Crear Cuenta
        </h2>
        <p className="text-xs text-center text-gray-500 dark:text-gray-300 mb-5 sm:mb-6">
          Registro institucional de operadores del sistema
        </p>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 text-xs rounded-lg p-3 mb-5">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Campo: Nombre de Usuario */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Nombre de Usuario 
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="operador.tep o admin.tep"
              required
              className="w-full pb-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition"
            />
          </div>

          {/* Campo: Rol de Acceso (RBAC institucional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Rol de Acceso Solicitado
            </label>
            <div className="relative">
              <select
                value={rolAcceso}
                onChange={(e) => setRolAcceso(e.target.value)}
                className="w-full pb-2 pr-8 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition cursor-pointer appearance-none"
              >
                <option value="Tecnico" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-1.5">
                  Técnico (Gestión de equipos y stock)
                </option>
                <option value="Auditor" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-1.5">
                  Auditor (Solo lectura y reportes)
                </option>
                <option value="Administrador" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-1.5">
                  Administrador (Control total)
                </option>
              </select>
              <div className="pointer-events-none absolute right-0 bottom-2 text-gray-400 dark:text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="w-full pb-2 pr-8 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 text-gray-400 dark:text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Campo: Confirmar Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="w-full pb-2 pr-8 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 bottom-2 text-gray-400 dark:text-gray-400 hover:text-gray-600 transition"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón Registrar */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-[#5764E8] hover:bg-[#4653D4] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Registrando Operador...</span>
              </>
            ) : (
              <span>Registrar Operador</span>
            )}
          </button>
        </form>

        {/* Enlace para volver a Iniciar Sesión */}
        <div className="mt-7 text-center text-xs text-gray-500 dark:text-gray-300">
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