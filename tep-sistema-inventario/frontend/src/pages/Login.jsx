import { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  Loader2, 
  Clock, 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck,
  CheckCircle2, 
  Send, 
  AlertTriangle, 
  ChevronDown,
  Copy,
  Check,
  User
} from 'lucide-react';
import { 
  loginService, 
  verificarPinService, 
  solicitarPinService, 
  recuperarPasswordService,
  registerService,
  logoutService,
  getAuthToken,
  isTokenExpired
} from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useSpring, 
  useMotionTemplate 
} from 'framer-motion';

export default function Login({ initialMode = 'login', onSwitchToRegister, onSwitchToLogin, onLoginSuccess }) {
  const { isDarkMode } = useTheme();

  // Control de vista activa ('login' o 'register') con dirección de animación
  const [activeTab, setActiveTab] = useState(() => {
    if (initialMode === 'register') return 'register';
    if (typeof window !== 'undefined' && window.location.pathname.includes('registro')) {
      return 'register';
    }
    return 'login';
  });
  const [direction, setDirection] = useState(1);

  // =========================================================================
  // ANIMACIÓN 1: EFECTO SPOTLIGHT / GLOW INTERACTIVO SENSIBLE AL CURSOR
  // =========================================================================
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 500);

  const springConfig = { damping: 28, stiffness: 180, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Foco radial adaptado a Modo Oscuro y Modo Claro (sin re-renders de React)
  const spotlightDark = useMotionTemplate`radial-gradient(650px circle at ${smoothX}px ${smoothY}px, rgba(59, 130, 246, 0.16) 0%, rgba(99, 102, 241, 0.08) 35%, rgba(6, 182, 212, 0.03) 60%, transparent 75%)`;
  const spotlightLight = useMotionTemplate`radial-gradient(650px circle at ${smoothX}px ${smoothY}px, rgba(59, 130, 246, 0.14) 0%, rgba(147, 197, 253, 0.08) 45%, transparent 70%)`;

  // =========================================================================
  // ESTADOS DEL FORMULARIO DE LOGIN
  // =========================================================================
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mensaje de advertencia si la sesión fue cerrada por inactividad
  const [inactivityNotice, setInactivityNotice] = useState(() => {
    if (typeof window !== 'undefined') {
      const msg = sessionStorage.getItem('tep_inactivity_message');
      if (msg) {
        sessionStorage.removeItem('tep_inactivity_message');
        return msg;
      }
    }
    return '';
  });

  // Limpieza silenciosa si hay un token viejo o expirado al entrar al login
  useEffect(() => {
    const token = getAuthToken();
    if (token && isTokenExpired(token)) {
      logoutService();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('tep_inactivity_message');
      }
    }
  }, []);

  // =========================================================================
  // ESTADOS DEL FORMULARIO DE REGISTRO
  // =========================================================================
  const [regNombreCompleto, setRegNombreCompleto] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRolAcceso, setRegRolAcceso] = useState('Tecnico');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirmPassword, setRegShowConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regIsLoading, setRegIsLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regPinGenerado, setRegPinGenerado] = useState('');
  const [regCopiado, setRegCopiado] = useState(false);

  const handleCopiarPin = () => {
    if (!regPinGenerado) return;
    navigator.clipboard.writeText(regPinGenerado);
    setRegCopiado(true);
    setTimeout(() => setRegCopiado(false), 2500);
  };

  // =========================================================================
  // ESTADOS DEL MODAL DE RECUPERACIÓN POR PIN
  // =========================================================================
  const [mostrarModalRecuperacion, setMostrarModalRecuperacion] = useState(false);
  const [pasoRecuperacion, setPasoRecuperacion] = useState(1);
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
      setPasoRecuperacion(3);
    } catch (err) {
      setErrorRecuperacion(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setCargandoRecuperacion(false);
    }
  };

  const handleFinalizarRecuperacion = () => {
    setUsername(recuperarUsername.trim());
    setPassword('');
    cerrarModalRecuperacion();
  };

  // =========================================================================
  // ACCIONES DE TRANSICIÓN ENTRE LOGIN Y REGISTRO
  // =========================================================================
  const handleSwitchToRegister = () => {
    setDirection(1);
    setActiveTab('register');
    setError('');
    setRegError('');
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', '/registro');
    }
  };

  const handleSwitchToLogin = () => {
    setDirection(-1);
    setActiveTab('login');
    setError('');
    setRegError('');
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', '/login');
    }
  };

  // =========================================================================
  // SUBMITS DE FORMULARIOS
  // =========================================================================
  const handleSubmitLogin = async (e) => {
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

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(false);

    if (!regUsername.trim()) {
      setRegError('Por favor ingrese un nombre de usuario.');
      return;
    }

    if (regPassword.length < 8) {
      setRegError('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setRegIsLoading(true);
      const res = await registerService({
        username: regUsername.trim(),
        password: regPassword,
        rolAcceso: regRolAcceso,
      });

      if (res.pinRecuperacion) {
        setRegPinGenerado(res.pinRecuperacion);
      }
      setRegSuccess(true);
    } catch (err) {
      setRegError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setRegIsLoading(false);
    }
  };

  // Variantes de animación 3D / Flip suave para la transición de la tarjeta
  const cardTransitionVariants = {
    initial: (dir) => ({
      opacity: 0,
      scale: 0.95,
      y: dir > 0 ? 15 : -15,
      rotateX: dir > 0 ? 4 : -4,
    }),
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (dir) => ({
      opacity: 0,
      scale: 0.95,
      y: dir > 0 ? -15 : 15,
      rotateX: dir > 0 ? -4 : 4,
      transition: {
        duration: 0.25,
        ease: [0.7, 0, 0.84, 0],
      },
    }),
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#f8fafc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-500">
      
      {/* ===================================================================== */}
      {/* 1. FOCO RADIAL INTERACTIVO SENSIBLE AL CURSOR (SPOTLIGHT) */}
      {/* ===================================================================== */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: isDarkMode ? spotlightDark : spotlightLight,
        }}
      />

      {/* ===================================================================== */}
      {/* ELEMENTOS AMBIENTALES EN BUCLE (ESFERAS BLUR-3XL CONTINUAS) */}
      {/* ===================================================================== */}
      <motion.div
        animate={{
          x: [0, 45, -30, 0],
          y: [0, -35, 25, 0],
          scale: [1, 1.12, 0.94, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute -top-20 -left-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-500/15 dark:bg-blue-600/10 blur-3xl z-0"
      />
      <motion.div
        animate={{
          x: [0, -50, 35, 0],
          y: [0, 45, -35, 0],
          scale: [1, 0.92, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute -bottom-24 -right-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-indigo-500/15 dark:bg-indigo-600/10 blur-3xl z-0"
      />
      <motion.div
        animate={{
          x: [0, 35, -40, 0],
          y: [0, 25, -25, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute top-1/2 left-1/4 -translate-y-1/2 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-cyan-400/10 dark:bg-cyan-500/05 blur-3xl z-0"
      />

      {/* Cuadrícula sutil institucional de fondo */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Botón flotante para alternar Modo Claro / Oscuro */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30">
        <ThemeToggle />
      </div>

      {/* ===================================================================== */}
      {/* 2. TARJETA CENTRAL CON EFECTO GLASSMORPHISM Y TRANSICIÓN FLUIDA */}
      {/* ===================================================================== */}
      <div className="relative w-full max-w-md z-10 my-4 sm:my-0">
        <AnimatePresence mode="wait" custom={direction}>
          
          {/* ================================================================= */}
          {/* VISTA A: INICIAR SESIÓN */}
          {/* ================================================================= */}
          {activeTab === 'login' ? (
            <motion.div
              key="card-login"
              custom={direction}
              variants={cardTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full backdrop-blur-xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-10 transition-colors duration-300"
            >
              {/* Título Principal */}
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 tracking-tight">
                Inicia Sesión
              </h2>

              {/* Mensaje de alerta por sesión cerrada por inactividad o error */}
              <AnimatePresence>
                {inactivityNotice && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs rounded-xl p-3.5 mb-6 flex items-start gap-2.5 shadow-xs overflow-hidden"
                  >
                    <Clock size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">Sesión finalizada por inactividad</p>
                      <p className="text-amber-700 dark:text-amber-300 mt-0.5">{inactivityNotice}</p>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 text-xs rounded-lg p-3 mb-6 overflow-hidden"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulario de Login */}
              <form onSubmit={handleSubmitLogin} className="space-y-6">
                
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
                    className="w-full pb-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition bg-transparent"
                  />
                </div>

                {/* Campo: Password con enlace a ¿Olvidaste tu contraseña? */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={abrirModalRecuperacion}
                      className="text-[11px] text-[#5764E8] dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="w-full pb-2 pr-8 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 bottom-2 text-gray-400 dark:text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Botón Ingresar con microinteracción táctil */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.button>
              </form>

              {/* Enlace Inferior para Registrarse */}
              <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToRegister}
                  className="text-[#5764E8] dark:text-indigo-400 font-semibold hover:underline inline-block ml-1 cursor-pointer"
                >
                  Registrate acá
                </button>
              </div>
            </motion.div>
          ) : (
            /* =============================================================== */
            /* VISTA B: REGISTRARSE (DENTRO DEL MISMO CONTENEDOR) */
            /* =============================================================== */
            <motion.div
              key="card-register"
              custom={direction}
              variants={cardTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full backdrop-blur-xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-10 transition-colors duration-300"
            >
              {regSuccess && regPinGenerado ? (
                /* Pantalla de Éxito con PIN generado */
                <div className="text-center animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800/60 shadow-xs">
                    <ShieldCheck size={36} />
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 tracking-tight">
                    ¡Usuario Registrado Exitosamente!
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 mb-5">
                    La cuenta <strong className="text-slate-700 dark:text-gray-200">@{regUsername}</strong> ({regRolAcceso}) ha sido creada.
                  </p>

                  <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/60 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4.5 mb-5 shadow-xs text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                        <KeyRound size={13} className="text-indigo-600 dark:text-indigo-400" />
                        Tu PIN de Recuperación
                      </span>
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
                        Válido por 30 días
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/60 rounded-xl px-4 py-2.5 shadow-2xs">
                      <span className="font-mono text-2xl font-black text-slate-900 dark:text-gray-100 tracking-widest">
                        {regPinGenerado}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleCopiarPin}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                        title="Copiar código PIN"
                      >
                        {regCopiado ? (
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
                      </motion.button>
                    </div>

                    <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-600 dark:text-gray-300 leading-relaxed">
                      <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Importante:</strong> Guardá y anotá este PIN. Por seguridad del sistema, <strong>no podrás solicitar otro PIN por 30 días</strong>.
                      </span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setUsername(regUsername.trim());
                      handleSwitchToLogin();
                    }}
                    className="w-full bg-[#5764E8] hover:bg-[#4653D4] text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continuar a Iniciar Sesión</span>
                  </motion.button>
                </div>
              ) : (
                /* Formulario de Alta de Operador */
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-1 tracking-tight">
                    Crear Cuenta
                  </h2>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-5">
                    Registro institucional de operadores del sistema
                  </p>

                  <AnimatePresence>
                    {regError && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 text-xs rounded-lg p-3 mb-5 overflow-hidden"
                      >
                        {regError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmitRegister} className="space-y-4">
                    
                    {/* Input 1: Nombre Completo */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        value={regNombreCompleto}
                        onChange={(e) => setRegNombreCompleto(e.target.value)}
                        placeholder="Ej: María González"
                        className="w-full pb-1.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition bg-transparent"
                      />
                    </div>

                    {/* Input 2: Nombre de Usuario */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Nombre de Usuario
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="operador.tep o admin.tep"
                        required
                        className="w-full pb-1.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition bg-transparent"
                      />
                    </div>

                    {/* Input 3: Selector de Rol Operativo */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Rol Operativo Solicitado
                      </label>
                      <div className="relative">
                        <select
                          value={regRolAcceso}
                          onChange={(e) => setRegRolAcceso(e.target.value)}
                          className="w-full pb-1.5 pr-8 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition cursor-pointer appearance-none"
                        >
                          <option value="Administrador" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-1.5">
                            Administrador (Control total del sistema)
                          </option>
                          <option value="Tecnico" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-1.5">
                            Técnico (Gestión de equipos y stock)
                          </option>
                          <option value="Auditor" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-1.5">
                            Auditor (Solo lectura y reportes)
                          </option>
                        </select>
                        <div className="pointer-events-none absolute right-0 bottom-1.5 text-gray-400 dark:text-gray-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Input 4: Contraseña */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={regShowPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          required
                          className="w-full pb-1.5 pr-8 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setRegShowPassword(!regShowPassword)}
                          className="absolute right-0 bottom-1.5 text-gray-400 dark:text-gray-400 hover:text-gray-600 transition cursor-pointer"
                        >
                          {regShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Input 5: Confirmar Contraseña */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Confirmar Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={regShowConfirmPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Repite la contraseña"
                          required
                          className="w-full pb-1.5 pr-8 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b border-gray-300 dark:border-slate-700 focus:border-indigo-600 focus:outline-none transition bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setRegShowConfirmPassword(!regShowConfirmPassword)}
                          className="absolute right-0 bottom-1.5 text-gray-400 dark:text-gray-400 hover:text-gray-600 transition cursor-pointer"
                        >
                          {regShowConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Botón Registrar Solicitud con microinteracción táctil */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={regIsLoading}
                      className="w-full mt-3 bg-[#5764E8] hover:bg-[#4653D4] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {regIsLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Registrando Solicitud...</span>
                        </>
                      ) : (
                        <span>Registrar Solicitud</span>
                      )}
                    </motion.button>
                  </form>

                  {/* Enlace para volver a Iniciar Sesión */}
                  <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    ¿Ya tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={handleSwitchToLogin}
                      className="text-[#5764E8] dark:text-indigo-400 font-semibold hover:underline inline-block ml-1 cursor-pointer"
                    >
                      Inicia sesión acá
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===================================================================== */}
      {/* 3. MODAL DE RECUPERACIÓN DE CONTRASEÑA CON PIN */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {mostrarModalRecuperacion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700"
            >
              
              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={cerrarModalRecuperacion}
                className="absolute top-4 right-4 text-slate-400 dark:text-gray-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Encabezado del Modal */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/60">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-gray-100">Recuperar Contraseña</h3>
                  <p className="text-[11px] text-slate-400 dark:text-gray-400">Verificación de seguridad mediante PIN</p>
                </div>
              </div>

              {/* Error en el modal */}
              {errorRecuperacion && (
                <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs rounded-xl p-3 my-4 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
                  <span className="leading-snug">{errorRecuperacion}</span>
                </div>
              )}

              {/* PASO 1: VALIDAR EL PIN */}
              {pasoRecuperacion === 1 && (
                <form onSubmit={handleVerificarPin} className="space-y-4 mt-4">
                  <p className="text-xs text-slate-500 dark:text-gray-300 leading-relaxed">
                    Ingresá tu nombre de usuario y el PIN de 6 dígitos que te asignó el sistema al registrarte.
                  </p>

                  {/* Input Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1">
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
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    />
                  </div>

                  {/* Input PIN */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1">
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
                      className="w-full px-3 py-2 font-mono text-center tracking-widest text-sm font-bold border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                    />
                  </div>

                  {/* BOTÓN VALIDAR PIN */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
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
                  </motion.button>

                  {/* SECCIÓN SI EL PIN ES INCORRECTO: VALIDACIÓN DE REGLA DE 30 DÍAS */}
                  {pinIncorrecto && (
                    <div className="mt-4 p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl animate-fade-in text-left">
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                        <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400" />
                        ¿Olvidaste o perdiste tu PIN de recuperación?
                      </p>

                      {cooldownDiasRestantes > 0 ? (
                        /* Si aún NO pasaron 30 días: Bloqueo de solicitud con explicación clara */
                        <div className="space-y-2.5 mt-2">
                          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 p-3 rounded-xl text-[11px] leading-relaxed">
                            <p className="font-bold flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
                              <Clock size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
                              <span>Período de espera obligatorio (30 días)</span>
                            </p>
                            <p className="mt-1 text-rose-900 dark:text-rose-200">
                              El PIN tiene una vigencia obligatoria de <strong className="font-bold text-rose-950 dark:text-rose-100">30 días</strong> para que recuerdes o busques el código que anotaste. No podés solicitar un nuevo PIN cada semana o pocos días.
                            </p>
                            <p className="mt-1.5 font-bold text-rose-950 dark:text-rose-100">
                              Te quedan <span className="underline text-rose-700 dark:text-rose-400 font-black">{cooldownDiasRestantes} día(s)</span> de espera para poder solicitar uno nuevo.
                            </p>
                            <p className="mt-1.5 text-[10px] text-rose-600 dark:text-rose-400 italic">
                              Por favor revisá el lugar donde guardaste o anotaste tu PIN de seguridad.
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled
                            className="w-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-400 text-xs font-bold py-2 px-3 rounded-lg cursor-not-allowed border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1.5"
                          >
                            <Clock size={13} />
                            <span>Solicitud bloqueada ({cooldownDiasRestantes}d restantes)</span>
                          </button>
                        </div>
                      ) : (
                        /* Si ya pasaron los 30 días: Puede solicitar un nuevo PIN al admin */
                        <div className="space-y-2.5 mt-2">
                          <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                            Han transcurrido 30 días desde tu última emisión. Como cumpliste el plazo de seguridad obligatorio, ahora podés solicitar al Administrador que te regenere un nuevo PIN:
                          </p>

                          {!solicitudPinEnviada ? (
                            <button
                              type="button"
                              onClick={handleSolicitarPinAdmin}
                              disabled={solicitandoPinAdmin}
                              className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
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
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-3 text-emerald-800 dark:text-emerald-200 text-[11px] space-y-1">
                              <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
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
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>¡PIN validado con éxito! Ahora podés definir tu nueva contraseña.</span>
                  </div>

                  {/* Nueva Contraseña */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNuevaPassword ? 'text' : 'password'}
                        value={nuevaPassword}
                        onChange={(e) => setNuevaPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        required
                        className="w-full px-3 py-2 pr-8 text-xs border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNuevaPassword(!showNuevaPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        {showNuevaPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nueva Contraseña */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmarPassword ? 'text' : 'password'}
                        value={confirmarNuevaPassword}
                        onChange={(e) => setConfirmarNuevaPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                        required
                        className="w-full px-3 py-2 pr-8 text-xs border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmarPassword(!showConfirmarPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        {showConfirmarPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Botón Guardar Contraseña */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
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
                  </motion.button>
                </form>
              )}

              {/* PASO 3: ÉXITO */}
              {pasoRecuperacion === 3 && (
                <div className="text-center py-4 space-y-4 animate-fade-in">
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-800/60">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-gray-100">¡Contraseña Actualizada!</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 leading-relaxed">
                      Tu contraseña ha sido restablecida exitosamente. Ya podés ingresar al sistema con tu nueva clave.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleFinalizarRecuperacion}
                    className="w-full bg-[#5764E8] hover:bg-[#4653D4] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Continuar e Iniciar Sesión
                  </motion.button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
