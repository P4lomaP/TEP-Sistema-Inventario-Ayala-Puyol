import { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  Lock, 
  Save, 
  Shield,
  Activity,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { obtenerPerfilUsuario, actualizarSeguridadUsuario } from '../services/perfilService';

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
    estado: 'Activo',
    tienePin: false
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Formulario de seguridad
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');

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

  // Actualizar contraseña y/o PIN
  const handleActualizarSeguridad = async (e) => {
    e.preventDefault();

    if (!passwordActual) {
      mostrarToast('Debe ingresar su contraseña actual para confirmar los cambios.');
      return;
    }

    if (!nuevoPassword && !nuevoPin) {
      mostrarToast('Debe ingresar una nueva contraseña o un nuevo PIN para actualizar.');
      return;
    }

    if (nuevoPassword && nuevoPassword.length < 8) {
      mostrarToast('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (nuevoPin && !/^\d{4,6}$/.test(nuevoPin)) {
      mostrarToast('El PIN debe ser un código numérico de 4 a 6 dígitos.');
      return;
    }

    setGuardando(true);
    try {
      const res = await actualizarSeguridadUsuario({
        passwordActual,
        nuevoPassword: nuevoPassword || undefined,
        nuevoPin: nuevoPin || undefined
      });

      mostrarToast(`✓ ${res.message || 'Credenciales actualizadas exitosamente.'}`);
      setPasswordActual('');
      setNuevoPassword('');
      setNuevoPin('');
      cargarPerfil();
    } catch (err) {
      mostrarToast(`Error: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

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
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mi Perfil</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Detalles de su cuenta, credenciales institucionales y parámetros de seguridad.
            </p>
          </div>
          {cargando && (
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full">
              <RefreshCw size={12} className="animate-spin" /> Actualizando datos...
            </span>
          )}
        </div>

        {/* Tarjeta Principal: Cabecera de Identidad */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center border-2 border-slate-100 shadow-xs uppercase">
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
                <h3 className="text-xl font-bold text-slate-800">
                  {usuario.username || 'Operador'}
                </h3>
                <p className="text-xs font-mono text-slate-500">
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

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-mono">
                <Mail size={14} className="text-slate-400" />
                {usuario.email || `${usuario.username}@tribunal.gob.ar`}
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Estado {usuario.estado}
              </span>
              <span className="flex items-center gap-1.5">
                <KeyRound size={14} className={usuario.tienePin ? 'text-emerald-600' : 'text-amber-500'} />
                {usuario.tienePin ? 'PIN configurado' : 'Sin PIN de rescate'}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas de la Cuenta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Alta</p>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{usuario.fechaCreacion}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Registro inicial</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Antigüedad en Sistema</p>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{usuario.diasActivo} días activo</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">En la plataforma</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Actividad</p>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{usuario.ultimoAcceso}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Registro de auditoría</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>
        </div>

        {/* Módulo de Seguridad y Credenciales */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Shield size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Seguridad y Respaldo</h4>
              <p className="text-xs text-slate-400">Actualice su clave de acceso o configure su PIN numérico para recuperación</p>
            </div>
          </div>

          <form onSubmit={handleActualizarSeguridad} className="space-y-4 max-w-2xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nueva Contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={nuevoPassword}
                    onChange={(e) => setNuevoPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres (opcional)"
                    className="w-full pl-10 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  PIN de Rescate (4 a 6 dígitos numéricos)
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    maxLength={6}
                    value={nuevoPin}
                    onChange={(e) => setNuevoPin(e.target.value)}
                    placeholder={usuario.tienePin ? 'PIN configurado (••••) - Opcional' : 'Configurar nuevo PIN'}
                    className="w-full pl-10 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50 focus:bg-white font-mono transition"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña Actual <span className="text-rose-500 font-normal">(Requerida para confirmar cambios)</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="Ingrese su contraseña actual para validar su identidad"
                  className="w-full pl-10 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={guardando || !passwordActual}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                {guardando ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Pie Institucional */}
        <div className="text-center pt-4 pb-2 text-[11px] text-slate-400 tracking-wider">
          © 2026 TRIBUNAL ELECTORAL PERMANENTE • CUENTA INSTITUCIONAL
        </div>

      </div>
    </MainLayout>
  );
}