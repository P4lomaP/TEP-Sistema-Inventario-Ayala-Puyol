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
  User,
  Vote,
  Workflow,
  Activity,
  Lock,
  Sparkles
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

  // Control de volteo 3D de la tarjeta (false: Login, true: Registro)
  const [isFlipped, setIsFlipped] = useState(() => {
    if (initialMode === 'register') return true;
    if (typeof window !== 'undefined' && window.location.pathname.includes('registro')) {
      return true;
    }
    return false;
  });

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
  // ACCIONES DE TRANSICIÓN ENTRE LOGIN Y REGISTRO (VOLTEO 3D)
  // =========================================================================
  const handleSwitchToRegister = () => {
    setIsFlipped(true);
    setError('');
    setRegError('');
    if (onSwitchToRegister) {
      onSwitchToRegister();
    }
  };

  const handleSwitchToLogin = () => {
    setIsFlipped(false);
    setError('');
    setRegError('');
    if (onSwitchToLogin) {
      onSwitchToLogin();
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



  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-[#f8fafc] dark:bg-[#070b14] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
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
      {/* ELEMENTOS AMBIENTALES EN BUCLE (LUCES DIFUSAS AMBIENTALES) */}
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
        className="pointer-events-none absolute -top-28 -left-28 w-96 h-96 rounded-full bg-blue-300/20 dark:bg-blue-600/10 blur-[120px] z-0"
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
        className="pointer-events-none absolute -bottom-32 -right-28 w-96 h-96 rounded-full bg-indigo-300/20 dark:bg-indigo-600/10 blur-[120px] z-0"
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
        className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-300/15 dark:bg-cyan-500/05 blur-[100px] z-0"
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
      {/* 2. CONTENEDOR PRINCIPAL SPLIT-SCREEN (HERO SHOWCASE + FORMULARIO) */}
      {/* ===================================================================== */}
      <div className="relative w-full max-w-6xl mx-auto z-10 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center min-h-[85vh]">

          {/* ================================================================= */}
          {/* COLUMNA IZQUIERDA: BIENVENIDA INSTITUCIONAL Y TARJETAS DINÁMICAS */}
          {/* ================================================================= */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8"
          >
            

            {/* 2. Logo institucional + Título y Subtítulo */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 dark:from-slate-900 dark:via-[#0c1829] dark:to-[#08101a] border border-blue-400/30 dark:border-cyan-500/40 ring-1 ring-cyan-500/30 shadow-lg shadow-blue-500/20 dark:shadow-cyan-500/10 flex items-center justify-center shrink-0">
                  <Vote size={24} className="text-white dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                    TEP <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent font-extrabold">Inventario</span>
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Tribunal Electoral Permanente • Formosa
                  </p>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Gestión Patrimonial y{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  Control Centralizado
                </span>{' '}
                de Inventario
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                Plataforma institucional para el monitoreo, trazabilidad y logística de equipos informáticos e insumos.
              </p>
            </div>

            {/* 3. Showcase de 3 Tarjetas Flotantes con Framer Motion */}
            <div className="hidden sm:grid grid-cols-1 gap-3.5 pt-2 max-w-xl">
              {/* Tarjeta 1: Seguridad y Auditoría */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 backdrop-blur-md shadow-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/50 text-blue-600 dark:text-cyan-400 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Seguridad y Auditoría
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Registro inmutable de movimientos y operadores.
                  </p>
                </div>
              </motion.div>

              {/* Tarjeta 2: Matriz de Compatibilidad */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 backdrop-blur-md shadow-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Workflow size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Matriz de Compatibilidad
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Asignación precisa de repuestos y periféricos.
                  </p>
                </div>
              </motion.div>

              {/* Tarjeta 3: Relavamiento de insumos */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 2.8 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 backdrop-blur-md shadow-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Relevamiento de Insumos
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    CRUD de equipos e insumos informáticos.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ================================================================= */}
          {/* COLUMNA DERECHA: TARJETA CRISTAL DEL FORMULARIO DE ACCESO */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none [perspective:1200px]">
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative w-full min-h-[580px]"
            >
              {/* ============================================================= */}
              {/* CARA A: INICIAR SESIÓN (Front Face) */}
              {/* ============================================================= */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg) translateZ(1px)',
                }}
                className={`w-full min-h-[580px] backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-2xl p-6 sm:p-8 md:p-9 transition-colors duration-300 flex flex-col justify-between ${
                  isFlipped ? 'pointer-events-none' : ''
                }`}
              >
                <fieldset disabled={isFlipped} aria-hidden={isFlipped} className="border-0 p-0 m-0 flex flex-col justify-between flex-1">
                  <div>
                    {/* Encabezado del Formulario con Ícono de Seguridad */}
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mx-auto mb-3 shadow-xs">
                        <Lock size={22} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Inicia Sesión
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Ingresá tus credenciales para acceder al sistema
                      </p>
                    </div>

                    {/* Mensaje de alerta por sesión cerrada por inactividad o error */}
                    <AnimatePresence>
                      {inactivityNotice && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: -8 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs rounded-xl p-3.5 mb-5 flex items-start gap-2.5 shadow-xs overflow-hidden"
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
                          className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 text-xs rounded-xl p-3 mb-5 overflow-hidden flex items-start gap-2"
                        >
                          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
                          <span className="leading-snug">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Formulario de Login */}
                    <form onSubmit={handleSubmitLogin} className="space-y-4">
                      
                      {/* Campo: Nombre de Usuario */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Nombre de Usuario
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                            <User size={16} />
                          </div>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="operador.tep o admin.tep"
                            required
                            className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Campo: Contraseña */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Contraseña
                          </label>
                          <button
                            type="button"
                            onClick={abrirModalRecuperacion}
                            className="text-[11px] text-blue-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                            <KeyRound size={16} />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            required
                            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Botón Ingresar */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                  </div>

                  {/* Enlace Inferior para Registrarse */}
                  <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    ¿No tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={handleSwitchToRegister}
                      className="text-blue-600 dark:text-cyan-400 font-bold hover:underline inline-block ml-1 cursor-pointer"
                    >
                      Regístrate acá
                    </button>
                  </div>
                </fieldset>
              </div>

              {/* ============================================================= */}
              {/* CARA B: REGISTRARSE (Back Face) */}
              {/* ============================================================= */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(1px)',
                }}
                className={`absolute inset-0 w-full min-h-[580px] backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-2xl p-6 sm:p-8 md:p-9 transition-colors duration-300 flex flex-col justify-between overflow-y-auto ${
                  !isFlipped ? 'pointer-events-none' : ''
                }`}
              >
                <fieldset disabled={!isFlipped} aria-hidden={!isFlipped} className="border-0 p-0 m-0 flex flex-col justify-between flex-1">
                  {regSuccess && regPinGenerado ? (
                    /* Pantalla de Éxito con PIN generado */
                    <div className="text-center animate-fade-in flex flex-col justify-between flex-1">
                      <div>
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800/60 shadow-xs">
                          <ShieldCheck size={36} />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                          ¡Usuario Registrado Exitosamente!
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
                          La cuenta <strong className="text-slate-800 dark:text-slate-200">@{regUsername}</strong> ({regRolAcceso}) ha sido creada.
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
                            <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-widest">
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

                          <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              <strong>Importante:</strong> Guardá y anotá este PIN. Por seguridad del sistema, <strong>no podrás solicitar otro PIN por 30 días</strong>.
                            </span>
                          </div>
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
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Continuar a Iniciar Sesión</span>
                      </motion.button>
                    </div>
                  ) : (
                    /* Formulario de Alta de Operador */
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <div className="text-center mb-5">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
                            <ShieldCheck size={22} />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Crear Cuenta
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Registro institucional de operadores del sistema
                          </p>
                        </div>

                        <AnimatePresence>
                          {regError && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, y: -8 }}
                              animate={{ opacity: 1, height: 'auto', y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -8 }}
                              transition={{ duration: 0.25 }}
                              className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 text-xs rounded-xl p-3 mb-4 overflow-hidden flex items-start gap-2"
                            >
                              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
                              <span className="leading-snug">{regError}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmitRegister} className="space-y-3.5">
                          
                          {/* Input 1: Nombre Completo */}
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                              Nombre Completo
                            </label>
                            <input
                              type="text"
                              value={regNombreCompleto}
                              onChange={(e) => setRegNombreCompleto(e.target.value)}
                              placeholder="Ej: María González"
                              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
                            />
                          </div>

                          {/* Input 2: Nombre de Usuario */}
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                              Nombre de Usuario
                            </label>
                            <input
                              type="text"
                              value={regUsername}
                              onChange={(e) => setRegUsername(e.target.value)}
                              placeholder="operador.tep o admin.tep"
                              required
                              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
                            />
                          </div>

                          {/* Input 3: Selector de Rol Operativo */}
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                              Rol Operativo Solicitado
                            </label>
                            <div className="relative">
                              <select
                                value={regRolAcceso}
                                onChange={(e) => setRegRolAcceso(e.target.value)}
                                className="w-full px-3.5 py-2 pr-9 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all cursor-pointer appearance-none shadow-2xs"
                              >
                                <option value="Tecnico" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                  Técnico (Gestión de equipos y stock)
                                </option>
                                <option value="Auditor" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                  Auditor (Solo lectura y reportes)
                                </option>
                              </select>
                              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <ChevronDown size={16} />
                              </div>
                            </div>
                          </div>

                          {/* Input 4: Contraseña */}
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                              Contraseña
                            </label>
                            <div className="relative">
                              <input
                                type={regShowPassword ? 'text' : 'password'}
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                required
                                className="w-full px-3.5 py-2 pr-9 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={() => setRegShowPassword(!regShowPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                              >
                                {regShowPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>

                          {/* Input 5: Confirmar Contraseña */}
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                              Confirmar Contraseña
                            </label>
                            <div className="relative">
                              <input
                                type={regShowConfirmPassword ? 'text' : 'password'}
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                placeholder="Repite la contraseña"
                                required
                                className="w-full px-3.5 py-2 pr-9 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={() => setRegShowConfirmPassword(!regShowConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                              >
                                {regShowConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>

                          {/* Botón Registrar Solicitud */}
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={regIsLoading}
                            className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
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
                      </div>

                      {/* Enlace para volver a Iniciar Sesión */}
                      <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
                        ¿Ya tienes una cuenta?{' '}
                        <button
                          type="button"
                          onClick={handleSwitchToLogin}
                          className="text-blue-600 dark:text-cyan-400 font-bold hover:underline inline-block ml-1 cursor-pointer"
                        >
                          Inicia sesión acá
                        </button>
                      </div>
                    </div>
                  )}
                </fieldset>
              </div>
            </motion.div>
          </div>

        </div>
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
