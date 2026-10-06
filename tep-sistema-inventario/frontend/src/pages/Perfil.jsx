import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Activity,
  RefreshCw
} from 'lucide-react';
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useSpring, 
  useMotionTemplate 
} from 'framer-motion';
import MainLayout from '../components/MainLayout';
import { useTheme } from '../context/ThemeContext';
import { obtenerPerfilUsuario } from '../services/perfilService';

export default function Perfil() {
  const { isDarkMode } = useTheme();

  // =========================================================================
  // ANIMACIÓN DE FONDO: SPOTLIGHT REACTIVO SENSIBLE AL CURSOR (AMBOS MODOS)
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

  // Foco radial adaptado a Modo Oscuro y Modo Claro
  const spotlightDark = useMotionTemplate`radial-gradient(650px circle at ${smoothX}px ${smoothY}px, rgba(59, 130, 246, 0.16) 0%, rgba(99, 102, 241, 0.08) 35%, rgba(6, 182, 212, 0.03) 60%, transparent 75%)`;
  const spotlightLight = useMotionTemplate`radial-gradient(650px circle at ${smoothX}px ${smoothY}px, rgba(59, 130, 246, 0.14) 0%, rgba(147, 197, 253, 0.08) 45%, transparent 70%)`;

  // =========================================================================
  // ESTADOS DEL PERFIL
  // =========================================================================
  const [usuario, setUsuario] = useState({
    idUsuario: null,
    codUsuario: 'USR-000',
    username: '',
    rolAcceso: 'Técnico',
    fechaCreacion: 'Cargando...',
    diasActivo: 1,
    ultimoAcceso: 'Hoy',
    estado: 'Activo'
  });

  const [cargando, setCargando] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const mostrarToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Cargar datos reales del perfil desde el backend
  const cargarPerfil = async () => {
    setCargando(true);
    try {
      const data = await obtenerPerfilUsuario();
      setUsuario(data);
    } catch (err) {
      console.error('Error cargando perfil:', err);
      mostrarToast(err.message || 'Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  return (
    <MainLayout activePage="" pageTitle="Mi Perfil Institucional">
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
      {/* 2. ELEMENTOS AMBIENTALES EN BUCLE (ESFERAS BLUR-3XL CONTINUAS) */}
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
        className="pointer-events-none fixed -top-20 -left-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-500/15 dark:bg-blue-600/10 blur-3xl z-0"
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
        className="pointer-events-none fixed -bottom-24 -right-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-indigo-500/15 dark:bg-indigo-600/10 blur-3xl z-0"
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
        className="pointer-events-none fixed top-1/2 left-1/4 -translate-y-1/2 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-cyan-400/10 dark:bg-cyan-500/05 blur-3xl z-0"
      />

      {/* Cuadrícula sutil institucional de fondo */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.03] dark:opacity-[0.06] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* ===================================================================== */}
      {/* 3. CONTENIDO PRINCIPAL DEL PERFIL CON GLASSMORPHISM Y ANIMACIONES */}
      {/* ===================================================================== */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-6 select-none pb-8">
        
        {/* Toast Notificación */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-50 bg-slate-900/90 dark:bg-slate-900/95 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 backdrop-blur-md"
            >
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Encabezado */}
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <span>Mi Perfil</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                TEP
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-300 mt-0.5">
              Información de identidad institucional y métricas de actividad del operador.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={cargarPerfil}
            disabled={cargando}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/60 px-3.5 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={cargando ? 'animate-spin' : ''} />
            <span>{cargando ? 'Actualizando...' : 'Actualizar'}</span>
          </motion.button>
        </motion.div>

        {/* Tarjeta Principal: Cabecera de Identidad con Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.97, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-lg dark:shadow-slate-950/40 hover:border-blue-500/30 dark:hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row items-center sm:items-start gap-6 group"
        >
          {/* Avatar con halo brillante y micro-animación */}
          <div className="relative">
            <motion.div
              className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600/40 via-cyan-400/30 to-indigo-600/40 blur-md pointer-events-none"
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [0.97, 1.05, 0.97],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div 
              whileHover={{ scale: 1.06, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl sm:text-3xl flex items-center justify-center border-2 border-white/60 dark:border-slate-700/80 shadow-md uppercase select-none cursor-default"
            >
              {(usuario.username || 'U').charAt(0)}
            </motion.div>
            <span 
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                usuario.estado === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              title={usuario.estado === 'Activo' ? 'Cuenta activa' : 'Cuenta inactiva'}
            >
              {usuario.estado === 'Activo' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100">
                  {usuario.username || 'Operador'}
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-gray-300 mt-0.5">
                  {usuario.codUsuario} • @{usuario.username}
                </p>
              </div>
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-xs ${
                  usuario.rolAcceso === 'Administrador' 
                    ? 'bg-[#0d1b2a] text-white border border-blue-500/30' 
                    : usuario.rolAcceso === 'Auditor'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <ShieldCheck size={14} className={usuario.rolAcceso === 'Administrador' ? 'text-blue-400' : ''} />
                {usuario.rolAcceso}
              </motion.span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500 dark:text-gray-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Estado: <span className="text-slate-700 dark:text-slate-200">{usuario.estado}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-500 dark:text-gray-400">
                Sistema TEP Inventario
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tarjetas de Métricas de la Cuenta con Animación Escalonada */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-slate-950/30 hover:border-blue-400/40 dark:hover:border-blue-500/40 transition-all flex items-center justify-between group cursor-default"
          >
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Fecha de Alta</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mt-1">{usuario.fechaCreacion}</h4>
              <p className="text-[10px] text-slate-400 dark:text-gray-400 mt-0.5">Registro inicial</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Calendar size={18} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-slate-950/30 hover:border-emerald-400/40 dark:hover:border-emerald-500/40 transition-all flex items-center justify-between group cursor-default"
          >
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Antigüedad en Sistema</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mt-1">{usuario.diasActivo} días activo</h4>
              <p className="text-[10px] text-slate-400 dark:text-gray-400 mt-0.5">En la plataforma</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Activity size={18} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md dark:shadow-slate-950/30 hover:border-indigo-400/40 dark:hover:border-indigo-500/40 transition-all flex items-center justify-between group cursor-default"
          >
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Última Actividad</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mt-1">{usuario.ultimoAcceso}</h4>
              <p className="text-[10px] text-slate-400 dark:text-gray-400 mt-0.5">Registro de auditoría</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-gray-300 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Clock size={18} />
            </div>
          </motion.div>
        </div>

        {/* Pie Institucional con Animación */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center pt-4 pb-2 text-[11px] text-slate-400 dark:text-gray-400 tracking-wider flex items-center justify-center gap-1.5"
        >
          <span>© 2026 TRIBUNAL ELECTORAL PERMANENTE</span>
          <span>•</span>
          <span>CUENTA INSTITUCIONAL</span>
        </motion.div>

      </div>
    </MainLayout>
  );
}