import { useState } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  Loader2, 
  Clock, 
  KeyRound, 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  AlertTriangle, 
  ArrowLeft 
} from 'lucide-react';
import { 
  loginService, 
  verificarPinService, 
  solicitarPinService, 
  recuperarPasswordService 
} from '../services/authService';

export default function Login({ onSwitchToRegister, onLoginSuccess }) {
  // 1. ZONA JAVASCRIPT: Estados para login principal
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

  // Estados para el Modal de Recuperación por PIN
  const [mostrarModalRecuperacion, setMostrarModalRecuperacion] = useState(false);
  const [pasoRecuperacion, setPasoRecuperacion] = useState(1); // 1: verificar pin, 2: nueva contraseña, 3: éxito
  const [recuperarUsername, setRecuperarUsername] = useState('');
  const [recuperarPin, setRecuperarPin] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarNuevaPassword, setConfirmarNuevaPassword] = useState('');
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [showConfirmarPassword, setShowConfirmarPassword] = useState(false);
  const [cargandoRecuperacion, setCargandoRecuperacion] = useState(false);
  const [errorRecuperacion, setErrorRecuperacion] = useState('');
  const [pinIncorrecto, setPinIncorrecto] = useState(false);
  const [solicitandoPinAdmin, setSolicitandoPinAdmin] = useState(false);
  const [solicitudPinEnviada, setSolicitudPinEnviada] = useState(false);
  const [cooldownDiasRestantes, setCooldownDiasRestantes] = useState(0);

  // Abrir Modal de Recuperación
  const abrirModalRecuperacion = () => {
    setRecuperarUsername(username.trim());
    setRecuperarPin('');
    setNuevaPassword('');
    setConfirmarNuevaPassword('');
    setErrorRecuperacion('');
    setPinIncorrecto(false);
    setSolicitudPinEnviada(false);
    setCooldownDiasRestantes(0);
    setPasoRecuperacion(1);
    setMostrarModalRecuperacion(true);
  };

  const cerrarModalRecuperacion = () => {
    setMostrarModalRecuperacion(false);
    setErrorRecuperacion('');
    setPinIncorrecto(false);
  };

  // Paso 1: Validar el PIN ingresado por el usuario
  const handleVerificarPin = async (e) => {
    e.preventDefault();
    setErrorRecuperacion('');
    setPinIncorrecto(false);
    setSolicitudPinEnviada(false);

    if (!recuperarUsername.trim() || !recuperarPin.trim()) {
      setErrorRecuperacion('Por favor, ingresá tu usuario y el PIN de recuperación.');
      return;
    }

    setCargandoRecuperacion(true);
    try {
      await verificarPinService({
        username: recuperarUsername.trim(),
        pinRecuperacion: recuperarPin.trim()
      });
      // Si el PIN es correcto, pasar al Paso 2 para definir la nueva clave
      setPasoRecuperacion(2);
    } catch (err) {
      setErrorRecuperacion(err.message || 'El PIN de recuperación es incorrecto.');
      setPinIncorrecto(true);
      if (err.diasRestantesCooldown !== undefined) {
        setCooldownDiasRestantes(err.diasRestantesCooldown);
      }
    } finally {
      setCargandoRecuperacion(false);
    }
  };

  // Solicitar un nuevo PIN al Administrador cuando el PIN es incorrecto o no se acuerda
  const handleSolicitarPinAdmin = async () => {
    if (!recuperarUsername.trim()) {
      setErrorRecuperacion('Por favor ingresá tu nombre de usuario para notificar al Administrador.');
      return;
    }

    setSolicitandoPinAdmin(true);
    setErrorRecuperacion('');
    try {
      const res = await solicitarPinService(recuperarUsername.trim());
      setSolicitudPinEnviada(true);
      if (res.diasRestantesCooldown > 0) {
        setCooldownDiasRestantes(res.diasRestantesCooldown);
      }
    } catch (err) {
      setErrorRecuperacion(err.message || 'Error al enviar la solicitud al Administrador.');
    } finally {
      setSolicitandoPinAdmin(false);
    }
  };

  // Paso 2: Restablecer la contraseña tras validar el PIN
  const handleActualizarPassword = async (e) => {
    e.preventDefault();
    setErrorRecuperacion('');

    if (nuevaPassword.length < 8) {
      setErrorRecuperacion('La nueva contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarNuevaPassword) {
      setErrorRecuperacion('Las nuevas contraseñas no coinciden.');
      return;
    }

    setCargandoRecuperacion(true);
    try {
      await recuperarPasswordService({
        username: recuperarUsername.trim(),
        pinRecuperacion: recuperarPin.trim(),
        nuevaPassword
      });
      // Pasar a estado de éxito
      setPasoRecuperacion(3);
    } catch (err) {
      setErrorRecuperacion(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setCargandoRecuperacion(false);
    }
  };

  // Finalizar recuperación y volver a login con el username prellenado
  const handleFinalizarRecuperacion = () => {
    setUsername(recuperarUsername.trim());
    setPassword('');
    cerrarModalRecuperacion();
  };

  // 2. FUNCIÓN DE ENVÍO: Petición real al backend POST /api/auth/login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInactivityNotice('');

    if (!username.trim() || !password) {
      setError('Por favor, ingrese usuario y contraseña.');
      return;
    }

    try {
      setIsLoading(true);
      const data = await loginService(username.trim(), password);

      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. ZONA VISUAL (HTML + Tailwind)
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] p-4 sm:p-6">
      {/* Tarjeta Modal Blanca */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl sm:shadow-2xl p-6 sm:p-10 my-4 sm:my-0">
        
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

        {/* Formulario de Login */}
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

          {/* Campo: Password con enlace a ¿Olvidaste tu contraseña? */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">
                Password
              </label>
              <button
                type="button"
                onClick={abrirModalRecuperacion}
                className="text-[11px] text-[#5764E8] hover:underline font-semibold cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
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

        {/* Enlace Inferior para Registrarse */}
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

      {/* ========================================================================= */}
      {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA CON PIN Y AVISO AL ADMINISTRADOR */}
      {/* ========================================================================= */}
      {mostrarModalRecuperacion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in border border-slate-100">
            
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={cerrarModalRecuperacion}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Encabezado del Modal */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Recuperar Contraseña</h3>
                <p className="text-[11px] text-slate-400">Verificación de seguridad mediante PIN</p>
              </div>
            </div>

            {/* Error en el modal */}
            {errorRecuperacion && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3 my-4 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <span className="leading-snug">{errorRecuperacion}</span>
              </div>
            )}

            {/* PASO 1: VALIDAR EL PIN */}
            {pasoRecuperacion === 1 && (
              <form onSubmit={handleVerificarPin} className="space-y-4 mt-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ingresá tu nombre de usuario y el PIN de 6 dígitos que te asignó el sistema al registrarte.
                </p>

                {/* Input Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={recuperarUsername}
                    onChange={(e) => {
                      setRecuperarUsername(e.target.value);
                      setPinIncorrecto(false);
                    }}
                    placeholder="operador.tep"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                {/* Input PIN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN de Recuperación (6 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={recuperarPin}
                    onChange={(e) => {
                      setRecuperarPin(e.target.value);
                      setPinIncorrecto(false);
                    }}
                    placeholder="Ej: 849201"
                    required
                    className="w-full px-3 py-2 font-mono text-center tracking-widest text-sm font-bold border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                {/* BOTÓN VALIDAR PIN */}
                <button
                  type="submit"
                  disabled={cargandoRecuperacion}
                  className="w-full bg-[#5764E8] hover:bg-[#4653D4] disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {cargandoRecuperacion ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Validando PIN...</span>
                    </>
                  ) : (
                    <span>Validar PIN</span>
                  )}
                </button>

                {/* SECCIÓN SI EL PIN ES INCORRECTO: VALIDACIÓN DE REGLA DE 30 DÍAS */}
                {pinIncorrecto && (
                  <div className="mt-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl animate-fade-in text-left">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                      <ShieldAlert size={14} className="text-amber-600" />
                      ¿Olvidaste o perdiste tu PIN de recuperación?
                    </p>

                    {cooldownDiasRestantes > 0 ? (
                      /* Si aún NO pasaron 30 días: Bloqueo de solicitud con explicación clara */
                      <div className="space-y-2.5 mt-2">
                        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-[11px] leading-relaxed">
                          <p className="font-bold flex items-center gap-1.5 text-rose-800">
                            <Clock size={13} className="text-rose-600 shrink-0" />
                            <span>Período de espera obligatorio (30 días)</span>
                          </p>
                          <p className="mt-1">
                            El PIN tiene una vigencia obligatoria de <strong>30 días</strong> para que recuerdes o busques el código que anotaste. No podés solicitar un nuevo PIN cada semana o pocos días.
                          </p>
                          <p className="mt-1.5 font-bold text-rose-950">
                            Te quedan <span className="underline text-rose-700 font-black">{cooldownDiasRestantes} día(s)</span> de espera para poder solicitar uno nuevo.
                          </p>
                          <p className="mt-1.5 text-[10px] text-rose-600 italic">
                            Por favor revisá el lugar donde guardaste o anotaste tu PIN de seguridad.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="w-full bg-slate-200 text-slate-400 text-xs font-bold py-2 px-3 rounded-lg cursor-not-allowed border border-slate-300 flex items-center justify-center gap-1.5"
                        >
                          <Clock size={13} />
                          <span>Solicitud bloqueada ({cooldownDiasRestantes}d restantes)</span>
                        </button>
                      </div>
                    ) : (
                      /* Si ya pasaron los 30 días: Puede solicitar un nuevo PIN al admin */
                      <div className="space-y-2.5 mt-2">
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Han transcurrido 30 días desde tu última emisión. Como cumpliste el plazo de seguridad obligatorio, ahora podés solicitar al Administrador que te regenere un nuevo PIN:
                        </p>

                        {!solicitudPinEnviada ? (
                          <button
                            type="button"
                            onClick={handleSolicitarPinAdmin}
                            disabled={solicitandoPinAdmin}
                            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {solicitandoPinAdmin ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Notificando al Administrador...</span>
                              </>
                            ) : (
                              <>
                                <Send size={13} />
                                <span>Solicitar un nuevo PIN al Administrador</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-[11px] space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                              <CheckCircle2 size={14} />
                              ¡Solicitud enviada al Administrador!
                            </p>
                            <p className="leading-relaxed">
                              El Administrador verá tu solicitud en el panel de usuarios para regenerar tu PIN. Al emitirse uno nuevo, se iniciará un nuevo ciclo de 30 días.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}

            {/* PASO 2: EL PIN ESTÁ BIEN -> INGRESAR NUEVA CONTRASEÑA */}
            {pasoRecuperacion === 2 && (
              <form onSubmit={handleActualizarPassword} className="space-y-4 mt-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>¡PIN validado con éxito! Ahora podés definir tu nueva contraseña.</span>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNuevaPassword ? 'text' : 'password'}
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="w-full px-3 py-2 pr-8 text-xs border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNuevaPassword(!showNuevaPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showNuevaPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmarPassword ? 'text' : 'password'}
                      value={confirmarNuevaPassword}
                      onChange={(e) => setConfirmarNuevaPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      required
                      className="w-full px-3 py-2 pr-8 text-xs border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmarPassword(!showConfirmarPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showConfirmarPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Botón Guardar Contraseña */}
                <button
                  type="submit"
                  disabled={cargandoRecuperacion}
                  className="w-full bg-[#5764E8] hover:bg-[#4653D4] disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {cargandoRecuperacion ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Actualizando Contraseña...</span>
                    </>
                  ) : (
                    <span>Restablecer Contraseña</span>
                  )}
                </button>
              </form>
            )}

            {/* PASO 3: ÉXITO */}
            {pasoRecuperacion === 3 && (
              <div className="text-center py-4 space-y-4 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">¡Contraseña Actualizada!</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Tu contraseña ha sido restablecida exitosamente. Ya podés ingresar al sistema con tu nueva clave.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFinalizarRecuperacion}
                  className="w-full bg-[#5764E8] hover:bg-[#4653D4] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Continuar e Iniciar Sesión
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}