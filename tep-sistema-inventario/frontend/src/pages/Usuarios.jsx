import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Download, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  X,
  RefreshCw,
  Edit2,
  KeyRound,
  AlertTriangle,
  Copy,
  Check,
  BellRing
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { 
  getStoredUser, 
  regenerarPinAdminService, 
  descartarSolicitudPinService 
} from '../services/authService';
import { 
  listarUsuarios, 
  cambiarEstadoUsuario, 
  cambiarRolUsuario, 
  descargarPDFUsuarios 
} from '../services/usuariosService';

export default function Usuarios() {
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.rolAcceso === 'Administrador';

  // Estados de datos reales
  const [usuarios, setUsuarios] = useState([]);
  const [kpis, setKpis] = useState({
    totalPersonal: 0,
    administradores: 0,
    tecnicos: 0,
    auditores: 0,
    solicitudesPin: 0
  });

  // Estados de interfaz y filtrado
  const [cargando, setCargando] = useState(true);
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [soloConSolicitudPin, setSoloConSolicitudPin] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 8;

  // Modal para modificar rol institucional
  const [usuarioEditandoRol, setUsuarioEditandoRol] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('Tecnico');
  const [guardandoRol, setGuardandoRol] = useState(false);

  // Modal para gestionar PIN y Cooldown de 30 días
  const [usuarioGestionandoPin, setUsuarioGestionandoPin] = useState(null);
  const [regenerandoPin, setRegenerandoPin] = useState(false);
  const [nuevoPinGenerado, setNuevoPinGenerado] = useState(null);
  const [pinCopiado, setPinCopiado] = useState(false);
  const [descartandoSolicitud, setDescartandoSolicitud] = useState(false);
  const [errorGestionPin, setErrorGestionPin] = useState('');

  const mostrarToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Cargar lista de usuarios desde la base de datos
  const cargarUsuarios = async () => {
    if (!isAdmin) return;
    setCargando(true);
    try {
      const data = await listarUsuarios();
      setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
      if (data.kpis) {
        setKpis(data.kpis);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      mostrarToast(err.message || 'Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [isAdmin]);

  // Alternar estado Activo / Inactivo en la base de datos
  const handleToggleEstado = async (user) => {
    const nuevoEstado = user.estadoActivo === 1 ? 0 : 1;
    try {
      await cambiarEstadoUsuario(user.idUsuario, nuevoEstado);
      // Actualizar estado local reactivo
      setUsuarios(prev => prev.map(u => 
        u.idUsuario === user.idUsuario ? { ...u, estadoActivo: nuevoEstado } : u
      ));
      mostrarToast(`✓ Usuario @${user.username} ${nuevoEstado === 1 ? 'activado' : 'desactivado'}.`);
    } catch (err) {
      mostrarToast(`Error: ${err.message}`);
    }
  };

  // Abrir modal para cambiar rol
  const handleAbrirEditarRol = (user) => {
    setUsuarioEditandoRol(user);
    setNuevoRol(user.rolAcceso);
  };

  // Guardar cambio de rol en backend
  const handleGuardarCambioRol = async (e) => {
    e.preventDefault();
    if (!usuarioEditandoRol) return;
    setGuardandoRol(true);
    try {
      await cambiarRolUsuario(usuarioEditandoRol.idUsuario, nuevoRol);
      setUsuarios(prev => prev.map(u => 
        u.idUsuario === usuarioEditandoRol.idUsuario ? { ...u, rolAcceso: nuevoRol } : u
      ));
      mostrarToast(`✓ Rol de @${usuarioEditandoRol.username} actualizado a ${nuevoRol}.`);
      setUsuarioEditandoRol(null);
      // Recargar para recalcular KPIs exactos
      cargarUsuarios();
    } catch (err) {
      mostrarToast(`Error: ${err.message}`);
    } finally {
      setGuardandoRol(false);
    }
  };

  // Exportar nómina oficial en PDF con PDFKit
  const handleDescargarPDF = async () => {
    setDescargandoPDF(true);
    try {
      await descargarPDFUsuarios();
      mostrarToast('✓ Nómina oficial de usuarios descargada en PDF.');
    } catch (err) {
      mostrarToast(`Error al generar PDF: ${err.message}`);
    } finally {
      setDescargandoPDF(false);
    }
  };

  // Abrir modal para gestionar PIN y Cooldown
  const handleAbrirGestionPin = (user) => {
    setUsuarioGestionandoPin(user);
    setNuevoPinGenerado(null);
    setPinCopiado(false);
    setErrorGestionPin('');
  };

  // Copiar nuevo PIN al portapapeles
  const handleCopiarPin = () => {
    if (!nuevoPinGenerado) return;
    navigator.clipboard.writeText(nuevoPinGenerado);
    setPinCopiado(true);
    setTimeout(() => setPinCopiado(false), 2500);
  };

  // Confirmar regeneración de PIN en backend
  const handleConfirmarRegenerarPin = async () => {
    if (!usuarioGestionandoPin) return;
    setRegenerandoPin(true);
    setErrorGestionPin('');
    try {
      const data = await regenerarPinAdminService(usuarioGestionandoPin.idUsuario);
      setNuevoPinGenerado(data.nuevoPin);
      mostrarToast(`✓ Nuevo PIN generado para @${usuarioGestionandoPin.username}`);
      cargarUsuarios();
    } catch (err) {
      setErrorGestionPin(err.message || 'Error al regenerar PIN.');
    } finally {
      setRegenerandoPin(false);
    }
  };

  // Descartar solicitud de regeneración de PIN
  const handleDescartarSolicitudPin = async () => {
    if (!usuarioGestionandoPin) return;
    setDescartandoSolicitud(true);
    setErrorGestionPin('');
    try {
      await descartarSolicitudPinService(usuarioGestionandoPin.idUsuario);
      mostrarToast(`✓ Solicitud de PIN descartada para @${usuarioGestionandoPin.username}`);
      setUsuarioGestionandoPin(null);
      cargarUsuarios();
    } catch (err) {
      setErrorGestionPin(err.message || 'Error al descartar la solicitud.');
    } finally {
      setDescartandoSolicitud(false);
    }
  };

  // Filtrado reactivo (Búsqueda por username o código, rol y solicitudes de PIN)
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((user) => {
      const q = searchTerm.toLowerCase();
      const coincideTexto = 
        (user.username || '').toLowerCase().includes(q) ||
        (user.codUsuario || '').toLowerCase().includes(q);
      
      const coincideRol = roleFilter === 'Todos' || user.rolAcceso === roleFilter;
      const coincideSolicitud = !soloConSolicitudPin || user.solicitaPin === 1;
      return coincideTexto && coincideRol && coincideSolicitud;
    });
  }, [usuarios, searchTerm, roleFilter, soloConSolicitudPin]);

  // Paginación
  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina) || 1;
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return usuariosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [usuariosFiltrados, paginaActual]);

  // =========================================================================
  // VISTA DENEGADA PARA ROLES NO AUTORIZADOS
  // =========================================================================
  if (!isAdmin) {
    return (
      <MainLayout activePage="usuarios" pageTitle="Control de Accesos">
        <div className="max-w-2xl mx-auto my-12 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100">Acceso Restringido al Módulo</h2>
          <p className="text-xs text-slate-500 dark:text-gray-300 mt-2 leading-relaxed">
            Esta sección es de uso exclusivo para usuarios con rol <strong>Administrador</strong>. 
            Su perfil actual es <span className="font-semibold text-slate-700 dark:text-gray-200">[{currentUser?.rolAcceso || 'Sin rol'}]</span> y no cuenta con privilegios para consultar o alterar la nómina de operadores institucionales.
          </p>
        </div>
      </MainLayout>
    );
  }

  // =========================================================================
  // VISTA PRINCIPAL (ADMINISTRADOR)
  // =========================================================================
  return (
    <MainLayout activePage="usuarios" pageTitle="Administración de Usuarios">
      <div className="space-y-6 max-w-7xl mx-auto select-none pb-8">
        
        {/* Toast Notificación */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Encabezado y Acción de Exportar PDF */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-400 mb-1">
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 tracking-tight">Administración de Usuarios</h2>
            <p className="text-xs text-slate-500 dark:text-gray-300 mt-0.5">
              Supervisión de credenciales, roles y estados de cuenta de los operadores del sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDescargarPDF}
              disabled={descargandoPDF || usuarios.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-gray-200 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              title="Descargar nómina de usuarios en formato PDF oficial"
            >
              <Download size={15} className={descargandoPDF ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              <span>{descargandoPDF ? 'Generando...' : 'Exportar Nómina PDF'}</span>
            </button>
          </div>
        </div>

        {/* Alerta Destacada si hay Solicitudes de PIN Pendientes */}
        {kpis.solicitudesPin > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BellRing size={20} className="animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>¡{kpis.solicitudesPin} Solicitud(es) de Regeneración de PIN Pendiente(s)!</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase tracking-wide">
                    Atención Requerida
                  </span>
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Hay operadores que no recuerdan su clave ni su PIN. Podés revisar cada caso, chequear el countdown de 30 días y regenerar el PIN si corresponde.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSoloConSolicitudPin(!soloConSolicitudPin)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5 ${
                soloConSolicitudPin 
                  ? 'bg-slate-800 text-white hover:bg-slate-900' 
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              <KeyRound size={14} />
              <span>{soloConSolicitudPin ? 'Ver Todos los Usuarios' : 'Filtrar Solicitudes de PIN'}</span>
            </button>
          </div>
        )}

        {/* Bloque de 5 KPIs dinámicos */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Total Operadores</p>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{kpis.totalPersonal}</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">Cuentas registradas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Administradores</p>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{kpis.administradores}</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">Control total</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <Shield size={18} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Técnicos</p>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{kpis.tecnicos}</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">Operación y stock</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Auditores</p>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{kpis.auditores}</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">Reportes y control</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>

          <div className={`rounded-2xl p-5 border shadow-xs flex items-center justify-between transition ${
            kpis.solicitudesPin > 0 
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60' 
              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700'
          }`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${
                kpis.solicitudesPin > 0 ? 'text-amber-800 dark:text-amber-400 font-extrabold' : 'text-slate-400 dark:text-slate-400'
              }`}>
                Solicitudes PIN
              </p>
              <h4 className={`text-2xl font-bold mt-0.5 ${
                kpis.solicitudesPin > 0 ? 'text-amber-900 dark:text-amber-300' : 'text-slate-800 dark:text-white'
              }`}>
                {kpis.solicitudesPin}
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                {kpis.solicitudesPin > 0 ? 'Pendientes de revisión' : 'Al día'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              kpis.solicitudesPin > 0 ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
            }`}>
              <KeyRound size={18} />
            </div>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por usuario (@) o código..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 focus:bg-white transition dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400 dark:text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPaginaActual(1);
                }}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-600 dark:text-gray-300 font-medium bg-white dark:bg-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Todos">Filtrar por Rol (Todos)</option>
                <option value="Administrador">Administrador</option>
                <option value="Tecnico">Técnico</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>

            {kpis.solicitudesPin > 0 && (
              <button
                type="button"
                onClick={() => setSoloConSolicitudPin(!soloConSolicitudPin)}
                className={`text-xs px-3 py-2 rounded-xl font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  soloConSolicitudPin 
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BellRing size={12} className={soloConSolicitudPin ? 'text-amber-700' : 'text-slate-400'} />
                <span>Solicitudes ({kpis.solicitudesPin})</span>
              </button>
            )}

            <div className="text-xs text-slate-500 dark:text-gray-300 font-medium">
              Mostrando: <strong className="text-slate-800 dark:text-gray-100 font-bold">{usuariosFiltrados.length}</strong> Registrados
            </div>
          </div>
        </div>

        {/* Tabla Principal de Usuarios */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-200 uppercase font-bold text-[10px] border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-6">Identificador</th>
                  <th className="py-3.5 px-6">Nombre de Usuario</th>
                  <th className="py-3.5 px-6">Rol de Sistema</th>
                  <th className="py-3.5 px-6 text-center">Estado</th>
                  <th className="py-3.5 px-6 text-center">PIN / Cooldown (30d)</th>
                  <th className="py-3.5 px-6 text-center">Último Acceso</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-400 text-xs">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Cargando nómina de usuarios...</span>
                    </td>
                  </tr>
                ) : usuariosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-400 text-xs">
                      <Users size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p>No se encontraron operadores registrados con el criterio de búsqueda.</p>
                    </td>
                  </tr>
                ) : (
                  usuariosPaginados.map((user) => {
                    const isSelf = user.idUsuario === currentUser?.idUsuario;

                    return (
                      <tr key={user.idUsuario} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition">
                        
                        {/* Código de usuario */}
                        <td className="py-3.5 px-6 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400">
                          {user.codUsuario}
                        </td>

                        {/* Nombre de usuario (@handle) */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs border border-slate-200 dark:border-slate-600">
                              {(user.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">@{user.username}</p>
                              {isSelf && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">(Tu cuenta en sesión)</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Rol de Sistema */}
                        <td className="py-3.5 px-6">
                          {user.rolAcceso === 'Administrador' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-[#0f172a] dark:bg-slate-900 text-white border border-slate-700 tracking-wider">
                              Administrador
                            </span>
                          )}
                          {(user.rolAcceso === 'Tecnico' || user.rolAcceso === 'Técnico') && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-blue-600 text-white tracking-wider">
                              Técnico
                            </span>
                          )}
                          {user.rolAcceso === 'Auditor' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 tracking-wider">
                              Auditor
                            </span>
                          )}
                        </td>

                        {/* Estado con Toggle interactivo */}
                        <td className="py-3.5 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleEstado(user)}
                            disabled={isSelf}
                            title={isSelf ? 'No podés desactivar tu propia cuenta' : 'Clic para alternar estado'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                              isSelf ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:opacity-80'
                            } ${
                              user.estadoActivo === 1 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${user.estadoActivo === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{user.estadoActivo === 1 ? 'Activo' : 'Inactivo'}</span>
                          </button>
                        </td>

                        {/* PIN / Cooldown (30 días) */}
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {user.solicitaPin === 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse">
                                <BellRing size={11} className="text-amber-600 dark:text-amber-400" />
                                <span>Solicitó PIN</span>
                              </span>
                            )}
                            {user.diasRestantesPin > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400" title={`Último PIN: ${user.fechaUltimoPinFormat || 'Reciente'}`}>
                                <Clock size={12} className="text-amber-500 dark:text-amber-400" />
                                <span>{user.diasRestantesPin} días restantes</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={12} />
                                <span>Cooldown cumplido</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Último Acceso */}
                        <td className="py-3.5 px-6 text-center text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-[11px]">
                            <Clock size={12} className="text-slate-400 dark:text-slate-400" />
                            <span>{user.ultimoAcceso || 'Sin actividad'}</span>
                          </div>
                        </td>

                        {/* Acciones: Regenerar PIN & Editar Rol */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAbrirGestionPin(user)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                user.solicitaPin === 1
                                  ? 'bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700 font-bold shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
                              }`}
                              title="Gestionar PIN de recuperación y cooldown de 30 días"
                            >
                              <KeyRound size={13} className={user.solicitaPin === 1 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'} />
                              <span>Regenerar PIN</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAbrirEditarRol(user)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 rounded-lg transition cursor-pointer"
                              title="Modificar rol institucional de este usuario"
                            >
                              <Edit2 size={13} />
                              <span>Rol</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pie de Tabla con Paginación */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-[11px] tracking-wider uppercase">
              <CheckCircle2 size={15} />
              <span>Control de Auditoría Activo</span>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-300">
                <span>Página <strong>{paginaActual}</strong> de {totalPaginas}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Institucional */}
        <div className="text-center pt-4 pb-2 text-[11px] text-slate-400 dark:text-gray-400 tracking-wider">
          © 2026 TRIBUNAL ELECTORAL PERMANENTE
        </div>

      </div>

      {/* ================= MODAL: MODIFICAR ROL INSTITUCIONAL ================= */}
      {usuarioEditandoRol && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-gray-100">Modificar Rol Institucional</h3>
                <p className="text-xs text-slate-400 dark:text-gray-400 mt-0.5">
                  Operador: <strong className="text-slate-700 dark:text-gray-200">@{usuarioEditandoRol.username}</strong> ({usuarioEditandoRol.codUsuario})
                </p>
              </div>
              <button 
                onClick={() => setUsuarioEditandoRol(null)} 
                className="text-slate-400 dark:text-gray-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarCambioRol} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-200 mb-1.5">
                  Seleccionar nuevo rol:
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    nuevoRol === 'Tecnico' ? 'border-blue-600 bg-blue-50/40 text-blue-900' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div>
                      <p className="font-bold text-xs">Técnico</p>
                      <p className="text-[11px] text-slate-500 dark:text-gray-300">Gestión de insumos, equipos patrimoniales y movimientos.</p>
                    </div>
                    <input 
                      type="radio" 
                      name="rol" 
                      value="Tecnico" 
                      checked={nuevoRol === 'Tecnico'} 
                      onChange={() => setNuevoRol('Tecnico')} 
                      className="text-blue-600"
                    />
                  </label>

                  <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    nuevoRol === 'Auditor' ? 'border-amber-600 bg-amber-50/40 text-amber-900' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div>
                      <p className="font-bold text-xs">Auditor</p>
                      <p className="text-[11px] text-slate-500 dark:text-gray-300">Consulta de reportes analíticos, trazabilidad e inspección.</p>
                    </div>
                    <input 
                      type="radio" 
                      name="rol" 
                      value="Auditor" 
                      checked={nuevoRol === 'Auditor'} 
                      onChange={() => setNuevoRol('Auditor')} 
                      className="text-amber-600"
                    />
                  </label>

                  <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    nuevoRol === 'Administrador' ? 'border-slate-800 bg-slate-100 text-slate-900' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div>
                      <p className="font-bold text-xs">Administrador</p>
                      <p className="text-[11px] text-slate-500 dark:text-gray-300">Acceso total, gestión de usuarios, roles y copias de seguridad.</p>
                    </div>
                    <input 
                      type="radio" 
                      name="rol" 
                      value="Administrador" 
                      checked={nuevoRol === 'Administrador'} 
                      onChange={() => setNuevoRol('Administrador')} 
                      className="text-slate-800 dark:text-gray-100"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setUsuarioEditandoRol(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoRol || nuevoRol === usuarioEditandoRol.rolAcceso}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {guardandoRol ? 'Actualizando...' : 'Guardar Cambio de Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GESTIÓN DE PIN Y COOLDOWN DE 30 DÍAS ================= */}
      {usuarioGestionandoPin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 animate-scale-in">
            
            {/* Cabecera del modal */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-gray-100">Gestión de PIN de Recuperación</h3>
                  <p className="text-xs text-slate-400 dark:text-gray-400 mt-0.5">
                    Operador: <strong className="text-slate-700 dark:text-gray-200">@{usuarioGestionandoPin.username}</strong> ({usuarioGestionandoPin.codUsuario})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setUsuarioGestionandoPin(null);
                  setNuevoPinGenerado(null);
                }} 
                className="text-slate-400 dark:text-gray-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error si ocurre */}
            {errorGestionPin && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <span>{errorGestionPin}</span>
              </div>
            )}

            {/* SI SE REGENERÓ UN NUEVO PIN: MOSTRARLO CON BOTÓN COPIAR */}
            {nuevoPinGenerado ? (
              <div className="space-y-4 text-center py-2 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-gray-100">¡Nuevo PIN Generado con Éxito!</h4>
                  <p className="text-xs text-slate-500 dark:text-gray-300 mt-0.5">
                    El operador @{usuarioGestionandoPin.username} ya cuenta con una nueva clave de acceso de 6 dígitos.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block mb-1">
                    Nuevo PIN de Seguridad (6 dígitos)
                  </span>
                  <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-indigo-200 rounded-xl px-4 py-2.5 shadow-2xs">
                    <span className="font-mono text-2xl font-black text-slate-900 dark:text-gray-100 tracking-widest">
                      {nuevoPinGenerado}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopiarPin}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      {pinCopiado ? (
                        <>
                          <Check size={14} className="text-emerald-300" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-gray-300 mt-2.5 leading-relaxed">
                    Comuníquele este código al operador. A partir de hoy, entra en vigencia el período de <strong>cooldown obligatorio de 30 días</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUsuarioGestionandoPin(null);
                    setNuevoPinGenerado(null);
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Entendido y Cerrar
                </button>
              </div>
            ) : (
              /* VISTA DE EVALUACIÓN: SOLICITUD Y COOLDOWN DE 30 DÍAS */
              <div className="space-y-4 text-xs">
                
                {/* 1. Estado de la solicitud */}
                {usuarioGestionandoPin.solicitaPin === 1 ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-amber-950">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5 text-amber-900">
                        <BellRing size={14} className="text-amber-600" />
                        Solicitud Activa del Usuario
                      </span>
                      <button
                        type="button"
                        onClick={handleDescartarSolicitudPin}
                        disabled={descartandoSolicitud}
                        className="text-[10px] text-amber-800 hover:text-rose-700 underline font-semibold cursor-pointer"
                        title="Descartar solicitud sin regenerar"
                      >
                        {descartandoSolicitud ? 'Descartando...' : 'Descartar Solicitud'}
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      El operador notificó que olvidó su PIN y necesita restablecer su acceso al sistema.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-600 dark:text-gray-300 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-slate-400 dark:text-gray-400 shrink-0" />
                    <span>Sin solicitud formal pendiente por parte del usuario.</span>
                  </div>
                )}

                {/* 2. Cooldown y Política de 30 días */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-gray-300 font-medium">Última emisión de PIN:</span>
                    <strong className="text-slate-800 dark:text-gray-100 font-semibold">
                      {usuarioGestionandoPin.fechaUltimoPinFormat || 'Generación inicial'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-gray-300 font-medium">Política de seguridad:</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
                      Cooldown de 30 días
                    </span>
                  </div>

                  {usuarioGestionandoPin.diasRestantesPin > 0 ? (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px] leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-800">
                        <Clock size={13} className="text-rose-600" />
                        <span>Cooldown de Seguridad Activo</span>
                      </div>
                      <p>
                        No es posible regenerar el PIN todavía. Faltan <strong>{usuarioGestionandoPin.diasRestantesPin} día(s)</strong> de espera obligatoria para obligar al operador a que recuerde su clave asignada.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold mb-1 text-emerald-800">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Habilitado para Regenerar</span>
                      </div>
                      <p>
                        Han transcurrido 30 días o más desde la última emisión. Puede regenerar un nuevo PIN aleatorio de 6 dígitos para el operador.
                      </p>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setUsuarioGestionandoPin(null);
                      setNuevoPinGenerado(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmarRegenerarPin}
                    disabled={regenerandoPin || usuarioGestionandoPin.diasRestantesPin > 0}
                    className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 ${
                      usuarioGestionandoPin.diasRestantesPin > 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                    }`}
                  >
                    {regenerandoPin ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Generando PIN...</span>
                      </>
                    ) : usuarioGestionandoPin.diasRestantesPin > 0 ? (
                      <>
                        <Clock size={13} />
                        <span>En Cooldown ({usuarioGestionandoPin.diasRestantesPin}d)</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={13} />
                        <span>Regenerar PIN Ahora</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </MainLayout>
  );
}