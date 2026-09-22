import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Workflow, 
  Search, 
  Plus, 
  Printer, 
  Laptop, 
  ChevronRight,
  Layers,
  Package,
  X,
  Check,
  AlertCircle,
  Info,
  ExternalLink,
  RefreshCw,
  Cpu,
  Building2,
  HardDrive,
  Calendar,
  MapPin
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { listarInsumos } from '../services/insumosService';
import { listarEquipos } from '../services/equiposService';
import { 
  listarCompatibilidades, 
  crearCompatibilidad, 
  eliminarCompatibilidad 
} from '../services/compatibilidadService';

export default function Compatibilidad() {
  const navigate = useNavigate();

  // Estados de datos desde el backend
  const [insumos, setInsumos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Filtros y selección
  const [busquedaInsumo, setBusquedaInsumo] = useState('');
  const [busquedaEquipo, setBusquedaEquipo] = useState('');
  const [filtroTipoEquipo, setFiltroTipoEquipo] = useState('todos'); // 'todos' | 'impresora' | 'computadora'
  const [selectedInsumoId, setSelectedInsumoId] = useState(null);

  // Modales de detalle (para ver características al hacer doble clic)
  const [modalInsumo, setModalInsumo] = useState(null);
  const [modalEquipo, setModalEquipo] = useState(null);

  // Carga inicial desde la API del backend
  const cargarDatos = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [insumosData, equiposData, compatData] = await Promise.all([
        listarInsumos(),
        listarEquipos(),
        listarCompatibilidades()
      ]);

      setInsumos(insumosData);
      setEquipos(equiposData.filter(eq => eq.estadoOperativo !== 'Baja'));
      setReglas(compatData);

      // Si no hay insumo seleccionado, seleccionar el primero
      if (insumosData.length > 0 && (!selectedInsumoId || !insumosData.some(i => i.idInsumo === selectedInsumoId))) {
        setSelectedInsumoId(insumosData[0].idInsumo);
      }
    } catch (err) {
      console.error('Error cargando matriz de compatibilidad:', err);
      setErrorMsg(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Insumo seleccionado actualmente
  const insumoSeleccionado = insumos.find(i => i.idInsumo === selectedInsumoId) || insumos[0] || null;

  // Reglas vigentes para el insumo seleccionado
  const reglasDelInsumo = reglas.filter(r => r.idInsumo === selectedInsumoId);
  const equiposCompatiblesIds = new Set(reglasDelInsumo.map(r => Number(r.idEquipo)));

  // Alternar compatibilidad de un equipo con el insumo actual (Toggle interactivo con el Backend)
  const handleToggleEquipo = async (equipo) => {
    if (!insumoSeleccionado) return;

    const reglaExistente = reglas.find(
      r => Number(r.idInsumo) === Number(insumoSeleccionado.idInsumo) && Number(r.idEquipo) === Number(equipo.idEquipo)
    );

    if (reglaExistente) {
      // Eliminar relación en el backend
      try {
        await eliminarCompatibilidad(reglaExistente.idRegla);
        setReglas(prev => prev.filter(r => r.idRegla !== reglaExistente.idRegla));
        mostrarToast(`✓ Desvinculado: ${equipo.marcaModelo} ya no es compatible.`);
      } catch (err) {
        mostrarToast(`Error al desvincular: ${err.message}`);
      }
    } else {
      // Crear relación en el backend
      try {
        const nuevaRegla = await crearCompatibilidad(insumoSeleccionado.idInsumo, equipo.idEquipo);
        setReglas(prev => [
          ...prev,
          {
            idRegla: nuevaRegla.idRegla,
            idInsumo: insumoSeleccionado.idInsumo,
            idEquipo: equipo.idEquipo,
            marcaModelo: equipo.marcaModelo,
            codPatrimonial: equipo.codPatrimonial,
            tipoEquipo: equipo.tipoEquipo
          }
        ]);
        mostrarToast(`✓ Vinculado: ${equipo.marcaModelo} ahora es compatible.`);
      } catch (err) {
        mostrarToast(`Error al registrar compatibilidad: ${err.message}`);
      }
    }
  };

  // Filtrar insumos en la columna izquierda
  const insumosFiltrados = insumos.filter(i => {
    const q = busquedaInsumo.toLowerCase();
    const desc = (i.descripcion || '').toLowerCase();
    const cod = (i.codigoInterno || '').toLowerCase();
    const cat = (i.categoria || '').toLowerCase();
    return desc.includes(q) || cod.includes(q) || cat.includes(q);
  });

  // Filtrar equipos en la columna derecha
  const equiposFiltrados = equipos.filter(eq => {
    const q = busquedaEquipo.toLowerCase();
    const marca = (eq.marcaModelo || '').toLowerCase();
    const cod = (eq.codPatrimonial || '').toLowerCase();
    const serie = (eq.numeroSerie || '').toLowerCase();
    const sec = (eq.nombreSector || eq.nombreOficina || '').toLowerCase();
    const matchText = marca.includes(q) || cod.includes(q) || serie.includes(q) || sec.includes(q);

    const esComputadora = eq.tipoEquipo?.toLowerCase() === 'computadora' || (!eq.tipoEquipo && Boolean(eq.procesador));
    const esImpresora = eq.tipoEquipo?.toLowerCase() === 'impresora' || (!eq.tipoEquipo && Boolean(eq.tecnologiaImpresion));

    if (filtroTipoEquipo === 'impresora') {
      return matchText && esImpresora;
    }
    if (filtroTipoEquipo === 'computadora') {
      return matchText && esComputadora;
    }
    return matchText;
  });

  return (
    <MainLayout activePage="compatibilidad" pageTitle="Matriz de Compatibilidad">
      <div className="space-y-6 max-w-7xl mx-auto select-none">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                <Workflow size={12} />
                Reglas de Compatibilidad Técnica
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Matriz de Compatibilidad</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Asocie insumos y tóners con los equipos autorizados para garantizar entregas seguras y sin fallas operativas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cargarDatos}
              disabled={loading}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
              title="Recargar datos del servidor"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/insumos')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <Plus size={14} />
              <span>Registrar Insumo en Catálogo</span>
            </button>
          </div>
        </div>

        {/* Banner Informativo de Doble Clic */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-600 shrink-0" />
            <span>
              <strong>Tip de consulta rápida:</strong> Haga <strong>doble clic</strong> sobre cualquier insumo o equipo para abrir su <strong>ficha de especificaciones técnicas completas</strong>.
            </span>
          </div>
        </div>

        {/* Alerta de Error si falla la conexión */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={cargarDatos}
              className="underline font-bold hover:text-rose-900 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Layout Principal de 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= COLUMNA IZQUIERDA (4/12): Catálogo de Insumos ================= */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Catálogo de Insumos</h3>
                <p className="text-[11px] text-slate-400">Seleccione un insumo para gestionar sus equipos compatibles.</p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {insumos.length}
              </span>
            </div>

            {/* Buscador de insumo */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaInsumo}
                onChange={(e) => setBusquedaInsumo(e.target.value)}
                placeholder="Buscar por código o descripción..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 focus:bg-white transition"
              />
              {busquedaInsumo && (
                <button
                  type="button"
                  onClick={() => setBusquedaInsumo('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Listado de Insumos (Sin imágenes externas, con iconos limpios y doble clic) */}
            <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
              {insumosFiltrados.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <Package size={24} className="mx-auto mb-2 text-slate-300" />
                  <p>No se encontraron insumos.</p>
                </div>
              ) : (
                insumosFiltrados.map((item) => {
                  const isSelected = item.idInsumo === selectedInsumoId;
                  const cantidadEquipos = reglas.filter(r => r.idInsumo === item.idInsumo).length;

                  return (
                    <div
                      key={item.idInsumo}
                      onClick={() => setSelectedInsumoId(item.idInsumo)}
                      onDoubleClick={() => setModalInsumo(item)}
                      title="Haga doble clic para ver características técnicas"
                      className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-200 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-100 hover:bg-slate-50/80 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Layers size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                            {item.descripcion}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 truncate">
                            <span className="font-mono font-semibold text-slate-600">{item.codigoInterno}</span>
                            <span>•</span>
                            <span>{item.categoria || 'Sin cat.'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          cantidadEquipos > 0 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cantidadEquipos} {cantidadEquipos === 1 ? 'eq.' : 'eqs.'}
                        </span>
                        {isSelected && <ChevronRight size={16} className="text-blue-600 shrink-0" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Redirección al módulo oficial de Insumos */}
            <button
              type="button"
              onClick={() => navigate('/insumos')}
              className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Ir a Gestión de Insumos</span>
            </button>
          </div>

          {/* ================= COLUMNA DERECHA (8/12): Equipos Compatibles ================= */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            
            {/* Cabecera del Insumo Seleccionado (Icono institucional, sin Unsplash) */}
            {insumoSeleccionado ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div 
                  className="flex items-center gap-3.5 cursor-pointer group"
                  onDoubleClick={() => setModalInsumo(insumoSeleccionado)}
                  title="Doble clic para ver ficha técnica completa"
                >
                  <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Package size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Insumo Activo
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {insumoSeleccionado.codigoInterno}
                      </span>
                      <span className="text-[10px] text-slate-400 italic hidden sm:inline">
                        (Doble clic para ver ficha)
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition">
                      {insumoSeleccionado.descripcion}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Categoría: <strong className="text-slate-700">{insumoSeleccionado.categoria}</strong> • Stock actual: <strong className="text-emerald-700">{insumoSeleccionado.stockActual} un.</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalInsumo(insumoSeleccionado)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Info size={14} />
                    <span>Ver Ficha Técnica</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                Seleccione un insumo de la lista izquierda para configurar sus compatibilidades.
              </div>
            )}

            {/* Subcabecera: Contador + Filtros de Equipos */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block"></span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Equipos Disponibles en Inventario
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  (<strong className="text-blue-700">{equiposCompatiblesIds.size}</strong> habilitados de {equipos.length})
                </span>
              </div>

              {/* Filtro por tipo de equipo */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setFiltroTipoEquipo('todos')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    filtroTipoEquipo === 'todos' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipoEquipo('impresora')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                    filtroTipoEquipo === 'impresora' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Printer size={12} />
                  Impresoras
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipoEquipo('computadora')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                    filtroTipoEquipo === 'computadora' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Laptop size={12} />
                  Computadoras
                </button>
              </div>
            </div>

            {/* Buscador de equipos */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaEquipo}
                onChange={(e) => setBusquedaEquipo(e.target.value)}
                placeholder="Filtrar equipos por marca, modelo, código patrimonial o sector..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/40 focus:bg-white transition"
              />
              {busquedaEquipo && (
                <button
                  type="button"
                  onClick={() => setBusquedaEquipo('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Listado de Equipos con Toggles y Doble Clic */}
            <div className="divide-y divide-slate-100 border-t border-b border-slate-100 max-h-[460px] overflow-y-auto pr-1">
              {equiposFiltrados.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Laptop size={26} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">No se encontraron equipos registrados.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Verifique los filtros o agregue equipos en el Catálogo de Equipos.</p>
                </div>
              ) : (
                equiposFiltrados.map((eq) => {
                  const isCompatible = equiposCompatiblesIds.has(Number(eq.idEquipo));
                  const esComputadora = eq.tipoEquipo?.toLowerCase() === 'computadora' || (!eq.tipoEquipo && Boolean(eq.procesador));
                  const esImpresora = eq.tipoEquipo?.toLowerCase() === 'impresora' || (!eq.tipoEquipo && Boolean(eq.tecnologiaImpresion));
                  const tipoEtiqueta = esImpresora ? 'Impresora' : (esComputadora ? 'Computadora' : (eq.tipoEquipo || 'Equipo'));

                  return (
                    <div 
                      key={eq.idEquipo} 
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition cursor-default"
                      onDoubleClick={() => setModalEquipo(eq)}
                      title="Doble clic para ver ficha técnica del equipo"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCompatible 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {esImpresora ? <Printer size={18} /> : <Laptop size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-800 truncate">{eq.marcaModelo}</p>
                            {eq.codPatrimonial && (
                              <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded shrink-0">
                                {eq.codPatrimonial}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            Tipo: <span className="font-medium text-slate-700">{tipoEtiqueta}</span> • Sector: <span className="font-medium text-slate-600">{eq.nombreSector || eq.nombreOficina || 'Sin asignar'}</span> • S/N: <span className="font-mono">{eq.numeroSerie || 'S/N'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Badge de estado + Toggle Switch Interactivo */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md tracking-wider ${
                          isCompatible 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {isCompatible ? 'Compatible' : 'Incompatible'}
                        </span>

                        {/* Botón Toggle interactivo */}
                        <button
                          type="button"
                          onClick={() => handleToggleEquipo(eq)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                            isCompatible ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                          title={isCompatible ? 'Desactivar compatibilidad' : 'Habilitar compatibilidad'}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                              isCompatible ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie con Accesos Rápidos */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Check size={14} className="text-emerald-500" />
                <span>Las vinculaciones se guardan de forma instantánea en la base de datos oficial.</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/movimientos')}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Ir a Movimientos y Salidas</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ================= MODAL: FICHA TÉCNICA DEL INSUMO (DOBLE CLIC) ================= */}
        {modalInsumo && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                    <Package size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Ficha Técnica de Insumo
                    </span>
                    <h3 className="text-base font-bold text-slate-800 leading-tight">
                      {modalInsumo.descripcion}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalInsumo(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Especificaciones */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Código Interno</span>
                  <span className="font-mono font-bold text-slate-800">{modalInsumo.codigoInterno}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Categoría</span>
                  <span className="font-semibold text-slate-800">{modalInsumo.categoria || 'Sin categoría'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Stock Actual</span>
                  <span className={`font-bold ${modalInsumo.stockActual <= (modalInsumo.stockSeguridad || 3) ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {modalInsumo.stockActual} unidades
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Stock de Seguridad</span>
                  <span className="font-semibold text-slate-700">{modalInsumo.stockSeguridad ?? 'No definido'} un.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ubicación Física</span>
                  <span className="font-semibold text-slate-800">
                    {modalInsumo.ubicacionFila ? `Fila ${modalInsumo.ubicacionFila} - Col. ${modalInsumo.ubicacionColumna}` : 'Almacén Central'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vencimiento</span>
                  <span className="font-semibold text-slate-800">
                    {modalInsumo.fechaVencimiento ? String(modalInsumo.fechaVencimiento).substring(0, 10) : 'Sin vencimiento'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalInsumo(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: FICHA TÉCNICA DEL EQUIPO (DOBLE CLIC) ================= */}
        {modalEquipo && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                    {modalEquipo.tipoEquipo?.toLowerCase() === 'impresora' ? <Printer size={22} /> : <Laptop size={22} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Ficha Técnica de Equipo Patrimonial
                    </span>
                    <h3 className="text-base font-bold text-slate-800 leading-tight">
                      {modalEquipo.marcaModelo}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalEquipo(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Especificaciones Generales */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Cód. Patrimonial</span>
                  <span className="font-mono font-bold text-blue-700">{modalEquipo.codPatrimonial || 'Sin asignar'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Tipo de Equipo</span>
                  <span className="font-semibold text-slate-800">{modalEquipo.tipoEquipo || 'Equipo'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Estado Operativo</span>
                  <span className="font-bold text-emerald-700">{modalEquipo.estadoOperativo || 'Activo'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Número de Serie</span>
                  <span className="font-mono text-slate-700">{modalEquipo.numeroSerie || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Sector Asignado</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {modalEquipo.nombreSector || modalEquipo.nombreOficina || 'Sin asignar'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">IP Fija</span>
                  <span className="font-mono text-slate-700">{modalEquipo.ipFija || '0.0.0.0'}</span>
                </div>
              </div>

              {/* Especificaciones según tipo */}
              {(modalEquipo.tipoEquipo?.toLowerCase() === 'computadora' || Boolean(modalEquipo.procesador)) && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-blue-900 text-[11px] uppercase tracking-wider">Hardware de Computadora</p>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>Procesador: <strong className="text-slate-900">{modalEquipo.procesador || 'N/D'}</strong></div>
                    <div>Memoria RAM: <strong className="text-slate-900">{modalEquipo.memoriaRAM || 'N/D'}</strong></div>
                    <div>Almacenamiento: <strong className="text-slate-900">{modalEquipo.almacenamiento || 'N/D'}</strong></div>
                    <div>Sistema Operativo: <strong className="text-slate-900">{modalEquipo.sistemaOperativo || 'N/D'}</strong></div>
                  </div>
                </div>
              )}

              {(modalEquipo.tipoEquipo?.toLowerCase() === 'impresora' || Boolean(modalEquipo.tecnologiaImpresion)) && (
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">Parámetros de Impresión</p>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>Tecnología: <strong className="text-slate-900">{modalEquipo.tecnologiaImpresion || 'Láser / Tinta'}</strong></div>
                    <div>Conexión: <strong className="text-slate-900">{modalEquipo.tipoConexion || 'Red / USB'}</strong></div>
                    <div>Formato Papel: <strong className="text-slate-900">{modalEquipo.formatoPapel || 'A4 / Oficio'}</strong></div>
                    <div>Tóner Oficial: <strong className="text-slate-900">{modalEquipo.insumoCompatibleDescripcion || 'Por matriz'}</strong></div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEquipo(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notificación */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Pie Institucional */}
        <div className="text-center pt-8 pb-2 text-[11px] text-slate-400 tracking-wider">
          © 2026 TRIBUNAL ELECTORAL PERMANENTE • MATRIZ DE COMPATIBILIDAD TÉCNICA
        </div>

      </div>
    </MainLayout>
  );
}