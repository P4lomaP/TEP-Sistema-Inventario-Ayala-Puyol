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
  Edit2
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { getStoredUser } from '../services/authService';
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
    auditores: 0
  });

  // Estados de interfaz y filtrado
  const [cargando, setCargando] = useState(true);
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [toastMessage, setToastMessage] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 8;

  // Modal para modificar rol institucional
  const [usuarioEditandoRol, setUsuarioEditandoRol] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('Tecnico');
  const [guardandoRol, setGuardandoRol] = useState(false);

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

  // Filtrado reactivo (Búsqueda por username o código y filtro por rol)
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((user) => {
      const q = searchTerm.toLowerCase();
      const coincideTexto = 
        (user.username || '').toLowerCase().includes(q) ||
        (user.codUsuario || '').toLowerCase().includes(q);
      
      const coincideRol = roleFilter === 'Todos' || user.rolAcceso === roleFilter;
      return coincideTexto && coincideRol;
    });
  }, [usuarios, searchTerm, roleFilter]);

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
        <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Acceso Restringido al Módulo</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Esta sección es de uso exclusivo para usuarios con rol <strong>Administrador</strong>. 
            Su perfil actual es <span className="font-semibold text-slate-700">[{currentUser?.rolAcceso || 'Sin rol'}]</span> y no cuenta con privilegios para consultar o alterar la nómina de operadores institucionales.
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
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Configuración de Sistema</span>
              <span>›</span>
              <span className="text-slate-600 font-medium">Control de Accesos</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Administración de Usuarios</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión de credenciales, roles y estados de cuenta de los operadores del sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDescargarPDF}
              disabled={descargandoPDF || usuarios.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              title="Descargar nómina de usuarios en formato PDF oficial"
            >
              <Download size={15} className={descargandoPDF ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              <span>{descargandoPDF ? 'Generando...' : 'Exportar Nómina PDF'}</span>
            </button>
          </div>
        </div>

        {/* Bloque de 4 KPIs dinámicos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Operadores</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-0.5">{kpis.totalPersonal}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Cuentas registradas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administradores</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-0.5">{kpis.administradores}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Control total</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Shield size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Técnicos</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-0.5">{kpis.tecnicos}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Operación y stock</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auditores</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-0.5">{kpis.auditores}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Reportes y control</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por usuario (@) o código..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPaginaActual(1);
                }}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-medium bg-white focus:outline-none cursor-pointer"
              >
                <option value="Todos">Filtrar por Rol (Todos)</option>
                <option value="Administrador">Administrador</option>
                <option value="Tecnico">Técnico</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Mostrando: <strong className="text-slate-800 font-bold">{usuariosFiltrados.length}</strong> Registrados
            </div>
          </div>
        </div>

        {/* Tabla Principal de Usuarios */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Identificador</th>
                  <th className="py-3.5 px-6">Nombre de Usuario</th>
                  <th className="py-3.5 px-6">Rol de Sistema</th>
                  <th className="py-3.5 px-6 text-center">Estado</th>
                  <th className="py-3.5 px-6 text-center">Último Acceso</th>
                  <th className="py-3.5 px-6 text-right">Gestionar Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {cargando ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Cargando nómina de usuarios...</span>
                    </td>
                  </tr>
                ) : usuariosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      <Users size={24} className="mx-auto mb-2 text-slate-300" />
                      <p>No se encontraron operadores registrados con el criterio de búsqueda.</p>
                    </td>
                  </tr>
                ) : (
                  usuariosPaginados.map((user) => {
                    const isSelf = user.idUsuario === currentUser?.idUsuario;

                    return (
                      <tr key={user.idUsuario} className="hover:bg-slate-50/70 transition">
                        
                        {/* Código de usuario */}
                        <td className="py-3.5 px-6 font-mono text-[11px] font-bold text-blue-700">
                          {user.codUsuario}
                        </td>

                        {/* Nombre de usuario (@handle) */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                              {(user.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">@{user.username}</p>
                              {isSelf && (
                                <span className="text-[10px] text-blue-600 font-medium">(Tu cuenta en sesión)</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Rol de Sistema */}
                        <td className="py-3.5 px-6">
                          {user.rolAcceso === 'Administrador' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-[#0f172a] text-white tracking-wider">
                              Administrador
                            </span>
                          )}
                          {(user.rolAcceso === 'Tecnico' || user.rolAcceso === 'Técnico') && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-blue-600 text-white tracking-wider">
                              Técnico
                            </span>
                          )}
                          {user.rolAcceso === 'Auditor' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 tracking-wider">
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
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${user.estadoActivo === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{user.estadoActivo === 1 ? 'Activo' : 'Inactivo'}</span>
                          </button>
                        </td>

                        {/* Último Acceso */}
                        <td className="py-3.5 px-6 text-center text-slate-500 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-[11px]">
                            <Clock size={12} className="text-slate-400" />
                            <span>{user.ultimoAcceso || 'Sin actividad'}</span>
                          </div>
                        </td>

                        {/* Acción para Cambiar Rol */}
                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarRol(user)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Modificar rol institucional de este usuario"
                          >
                            <Edit2 size={13} />
                            <span>Editar Rol</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pie de Tabla con Paginación */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-[11px] tracking-wider uppercase">
              <CheckCircle2 size={15} />
              <span>Control de Auditoría Activo</span>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Página <strong>{paginaActual}</strong> de {totalPaginas}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Institucional */}
        <div className="text-center pt-4 pb-2 text-[11px] text-slate-400 tracking-wider">
          © 2026 TRIBUNAL ELECTORAL PERMANENTE
        </div>

      </div>

      {/* ================= MODAL: MODIFICAR ROL INSTITUCIONAL ================= */}
      {usuarioEditandoRol && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Modificar Rol Institucional</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Operador: <strong className="text-slate-700">@{usuarioEditandoRol.username}</strong> ({usuarioEditandoRol.codUsuario})
                </p>
              </div>
              <button 
                onClick={() => setUsuarioEditandoRol(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarCambioRol} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Seleccionar nuevo rol:
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    nuevoRol === 'Tecnico' ? 'border-blue-600 bg-blue-50/40 text-blue-900' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div>
                      <p className="font-bold text-xs">Técnico</p>
                      <p className="text-[11px] text-slate-500">Gestión de insumos, equipos patrimoniales y movimientos.</p>
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
                      <p className="text-[11px] text-slate-500">Consulta de reportes analíticos, trazabilidad e inspección.</p>
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
                      <p className="text-[11px] text-slate-500">Acceso total, gestión de usuarios, roles y copias de seguridad.</p>
                    </div>
                    <input 
                      type="radio" 
                      name="rol" 
                      value="Administrador" 
                      checked={nuevoRol === 'Administrador'} 
                      onChange={() => setNuevoRol('Administrador')} 
                      className="text-slate-800"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUsuarioEditandoRol(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
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

    </MainLayout>
  );
}