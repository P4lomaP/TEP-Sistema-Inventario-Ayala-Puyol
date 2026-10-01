import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Mail, 
  CheckCircle2, 
  Activity,
  RefreshCw
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { obtenerPerfilUsuario } from '../services/perfilService';

export default function Perfil() {
  const [usuario, setUsuario] = useState({
    idUsuario: null,
    codUsuario: 'USR-000',
    username: '',
    email: '',
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
      <div className="max-w-4xl mx-auto space-y-6 select-none pb-8">
        
        {/* Toast Notificación */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 tracking-tight">Mi Perfil</h2>
            <p className="text-xs text-slate-500 dark:text-gray-300 mt-0.5">
              Información de identidad institucional y métricas de actividad del operador.
            </p>
          </div>
          {cargando && (
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full">
              <RefreshCw size={12} className="animate-spin" /> Actualizando datos...
            </span>
          )}
        </div>

        {/* Tarjeta Principal: Cabecera de Identidad */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-700 shadow-xs uppercase">
              {(usuario.username || 'U').charAt(0)}
            </div>
            <span 
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                usuario.estado === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              title={usuario.estado === 'Activo' ? 'Cuenta activa' : 'Cuenta inactiva'}
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100">
                  {usuario.username || 'Operador'}
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-gray-300">
                  {usuario.codUsuario} • @{usuario.username}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                usuario.rolAcceso === 'Administrador' 
                  ? 'bg-[#0d1b2a] text-white' 
                  : usuario.rolAcceso === 'Auditor'
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-blue-600 text-white'
              }`}>
                <ShieldCheck size={14} className={usuario.rolAcceso === 'Administrador' ? 'text-blue-400' : ''} />
                {usuario.rolAcceso}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500 dark:text-gray-300">
              <span className="flex items-center gap-1.5 font-mono">
                <Mail size={14} className="text-slate-400 dark:text-gray-400" />
                {usuario.email || `${usuario.username}@tribunal.gob.ar`}
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Estado {usuario.estado}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas de la Cuenta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Fecha de Alta</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mt-1">{usuario.fechaCreacion}</h4>
              <p className="text-[10px] text-slate-400 dark:text-gray-400 mt-0.5">Registro inicial</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Antigüedad en Sistema</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mt-1">{usuario.diasActivo} días activo</h4>
              <p className="text-[10px] text-slate-400 dark:text-gray-400 mt-0.5">En la plataforma</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity size={18} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">Última Actividad</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mt-1">{usuario.ultimoAcceso}</h4>
              <p className="text-[10px] text-slate-400 dark:text-gray-400 mt-0.5">Registro de auditoría</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-300 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>
        </div>

        {/* Pie Institucional */}
        <div className="text-center pt-4 pb-2 text-[11px] text-slate-400 dark:text-gray-400 tracking-wider">
          © 2026 TRIBUNAL ELECTORAL PERMANENTE • CUENTA INSTITUCIONAL
        </div>

      </div>
    </MainLayout>
  );
}