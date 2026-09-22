import { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  Info, 
  ExternalLink, 
  RefreshCw, 
  Cpu, 
  Building2, 
  HardDrive, 
  Calendar, 
  MapPin,
  Trash2,
  Filter,
  CheckCircle2,
  SlidersHorizontal,
  FileSpreadsheet
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

  // Filtros del selector superior
  const [busquedaInsumo, setBusquedaInsumo] = useState('');
  const [busquedaEquipo, setBusquedaEquipo] = useState('');
  const [filtroTipoEquipo, setFiltroTipoEquipo] = useState('todos'); // 'todos' | 'impresora' | 'computadora'
  const [selectedInsumoId, setSelectedInsumoId] = useState(null);

  // Filtros de la tabla consolidada inferior
  const [busquedaTabla, setBusquedaTabla] = useState('');
  const [filtroTablaTipo, setFiltroTablaTipo] = useState('todos'); // 'todos' | 'impresora' | 'computadora'
  const [filtroTablaEstado, setFiltroTablaEstado] = useState('todos'); // 'todos' | 'con_insumos' | 'sin_insumos'

  // Modales de detalle (para ver características completas al hacer doble clic o clic en botón)
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

      const insumosActivos = (insumosData || []).filter(i => i.estadoActivo !== 0);
      const equiposActivos = (equiposData || []).filter(eq => eq.estadoOperativo !== 'Baja');

      setInsumos(insumosActivos);
      setEquipos(equiposActivos);
      setReglas(compatData || []);

      // Si no hay insumo seleccionado, seleccionar el primero por defecto
      if (insumosActivos.length > 0 && (!selectedInsumoId || !insumosActivos.some(i => i.idInsumo === selectedInsumoId))) {
        setSelectedInsumoId(insumosActivos[0].idInsumo);
      }
    } catch (err) {
      console.error('Error cargando matriz de compatibilidad:', err);
      setErrorMsg(err.message || 'Error al conectar con el servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Insumo seleccionado actualmente en el panel superior
  const insumoSeleccionado = insumos.find(i => i.idInsumo === selectedInsumoId) || insumos[0] || null;

  // Detección de coherencia técnica para el insumo seleccionado
  const infoInsumo = useMemo(() => {
    if (!insumoSeleccionado) return { esPeriferico: false, esConsumibleImpresion: false, tipoSugerido: 'todos' };
    const cat = (insumoSeleccionado.categoria || '').toLowerCase();
    const desc = (insumoSeleccionado.descripcion || '').toLowerCase();

    const esPeriferico = cat === 'periférico' || cat === 'periferico' || 
      desc.includes('mouse') || desc.includes('teclado') || desc.includes('auricular') || 
      desc.includes('webcam') || desc.includes('pad') || desc.includes('monitor');

    const esConsumibleImpresion = cat === 'insumo' && (
      desc.includes('tóner') || desc.includes('toner') || desc.includes('cartucho') || 
      desc.includes('tinta') || desc.includes('tambor') || desc.includes('fusor') || 
      desc.includes('cinta') || desc.includes('hoja') || desc.includes('resma')
    );

    let tipoSugerido = 'todos';
    if (esPeriferico) tipoSugerido = 'computadora';
    else if (esConsumibleImpresion) tipoSugerido = 'impresora';

    return { esPeriferico, esConsumibleImpresion, tipoSugerido };
  }, [insumoSeleccionado]);

  // Reglas vigentes para el insumo seleccionado
  const reglasDelInsumo = reglas.filter(r => Number(r.idInsumo) === Number(selectedInsumoId));
  const equiposCompatiblesIds = useMemo(() => {
    return new Set(reglasDelInsumo.map(r => Number(r.idEquipo)));
  }, [reglasDelInsumo]);

  // Verificar si un equipo específico es técnicamente incompatible con el insumo seleccionado
  const verificarIncompatibilidadLogica = (equipo, insumo) => {
    if (!equipo || !insumo) return null;
    const tipoEq = (equipo.tipoEquipo || '').toLowerCase();
    const esPc = tipoEq === 'computadora' || (!equipo.tipoEquipo && Boolean(equipo.procesador));
    const esImp = tipoEq === 'impresora' || (!equipo.tipoEquipo && Boolean(equipo.tecnologiaImpresion));

    const catIns = (insumo.categoria || '').toLowerCase();
    const descIns = (insumo.descripcion || '').toLowerCase();

    const esPerif = catIns === 'periférico' || catIns === 'periferico' || 
      descIns.includes('mouse') || descIns.includes('teclado');

    const esConsumibleImp = descIns.includes('tóner') || descIns.includes('toner') || 
      descIns.includes('cartucho') || descIns.includes('tinta') || descIns.includes('tambor');

    if (esPerif && esImp) {
      return 'Los periféricos (mouse, teclado) se asocian a computadoras, no a impresoras.';
    }
    if (esConsumibleImp && esPc) {
      return 'Los consumibles de impresión (tóners, cartuchos) se asocian a impresoras, no a computadoras.';
    }
    return null;
  };

  // Alternar compatibilidad de un equipo con el insumo actual (Toggle interactivo)
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
        mostrarToast(`✓ Desvinculado: ${equipo.marcaModelo} ya no está asociado a ${insumoSeleccionado.descripcion}.`);
      } catch (err) {
        mostrarToast(`Error al desvincular: ${err.message}`);
      }
    } else {
      // Validar coherencia lógica
      const errorLogico = verificarIncompatibilidadLogica(equipo, insumoSeleccionado);
      if (errorLogico) {
        mostrarToast(`⚠️ Inconsistencia lógica: ${errorLogico}`);
        return;
      }

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
            tipoEquipo: equipo.tipoEquipo,
            numeroSerie: equipo.numeroSerie,
            estadoOperativo: equipo.estadoOperativo,
            nombreSector: equipo.nombreSector || equipo.nombreOficina,
            insumoDescripcion: insumoSeleccionado.descripcion,
            codigoInterno: insumoSeleccionado.codigoInterno,
            insumoCategoria: insumoSeleccionado.categoria,
            stockActual: insumoSeleccionado.stockActual,
            stockSeguridad: insumoSeleccionado.stockSeguridad
          }
        ]);
        mostrarToast(`✓ Vinculado con éxito: ${equipo.marcaModelo} ahora es compatible con ${insumoSeleccionado.descripcion}.`);
      } catch (err) {
        mostrarToast(`Error al registrar compatibilidad: ${err.message}`);
      }
    }
  };

  // Desvincular directamente una regla desde la tabla consolidada inferior
  const handleDesvincularDesdeTabla = async (idRegla, nombreEquipo, descInsumo) => {
    try {
      await eliminarCompatibilidad(idRegla);
      setReglas(prev => prev.filter(r => r.idRegla !== idRegla));
      mostrarToast(`✓ Se desvinculó "${descInsumo}" de "${nombreEquipo}".`);
    } catch (err) {
      mostrarToast(`Error al desvincular: ${err.message}`);
    }
  };

  // Filtrar insumos en la columna izquierda superior
  const insumosFiltrados = useMemo(() => {
    return insumos.filter(i => {
      const q = busquedaInsumo.toLowerCase().trim();
      const desc = (i.descripcion || '').toLowerCase();
      const cod = (i.codigoInterno || '').toLowerCase();
      const cat = (i.categoria || '').toLowerCase();
      return desc.includes(q) || cod.includes(q) || cat.includes(q);
    });
  }, [insumos, busquedaInsumo]);

  // Filtrar equipos en la columna derecha superior
  const equiposFiltrados = useMemo(() => {
    return equipos.filter(eq => {
      const q = busquedaEquipo.toLowerCase().trim();
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
  }, [equipos, busquedaEquipo, filtroTipoEquipo]);

  // Consolidado para la tabla inferior: Agrupar por cada equipo los insumos asociados
  const datosTablaConsolidada = useMemo(() => {
    return equipos.map(eq => {
      const reglasDelEq = reglas.filter(r => Number(r.idEquipo) === Number(eq.idEquipo));
      const insumosAsociados = reglasDelEq.map(r => {
        const insOriginal = insumos.find(i => Number(i.idInsumo) === Number(r.idInsumo));
        return {
          idRegla: r.idRegla,
          idInsumo: r.idInsumo,
          codigoInterno: insOriginal?.codigoInterno || r.codigoInterno || 'N/A',
          descripcion: insOriginal?.descripcion || r.insumoDescripcion || 'Insumo',
          categoria: insOriginal?.categoria || r.insumoCategoria || 'Insumo',
          stockActual: insOriginal?.stockActual ?? r.stockActual ?? 0,
          stockSeguridad: insOriginal?.stockSeguridad ?? r.stockSeguridad ?? 0,
          insumoCompleto: insOriginal || {
            idInsumo: r.idInsumo,
            descripcion: r.insumoDescripcion,
            codigoInterno: r.codigoInterno,
            categoria: r.insumoCategoria,
            stockActual: r.stockActual
          }
        };
      });

      return {
        ...eq,
        insumosAsociados,
        totalInsumos: insumosAsociados.length
      };
    });
  }, [equipos, reglas, insumos]);

  // Filtros aplicados a la tabla consolidada inferior
  const equiposTablaFiltrados = useMemo(() => {
    return datosTablaConsolidada.filter(eq => {
      const q = busquedaTabla.toLowerCase().trim();
      const marca = (eq.marcaModelo || '').toLowerCase();
      const cod = (eq.codPatrimonial || '').toLowerCase();
      const serie = (eq.numeroSerie || '').toLowerCase();
      const sec = (eq.nombreSector || eq.nombreOficina || '').toLowerCase();
      
      const insumosMatch = eq.insumosAsociados.some(
        ins => ins.descripcion.toLowerCase().includes(q) || ins.codigoInterno.toLowerCase().includes(q)
      );

      const matchTexto = !q || marca.includes(q) || cod.includes(q) || serie.includes(q) || sec.includes(q) || insumosMatch;

      const esComputadora = eq.tipoEquipo?.toLowerCase() === 'computadora' || (!eq.tipoEquipo && Boolean(eq.procesador));
      const esImpresora = eq.tipoEquipo?.toLowerCase() === 'impresora' || (!eq.tipoEquipo && Boolean(eq.tecnologiaImpresion));

      if (filtroTablaTipo === 'computadora' && !esComputadora) return false;
      if (filtroTablaTipo === 'impresora' && !esImpresora) return false;

      if (filtroTablaEstado === 'con_insumos' && eq.totalInsumos === 0) return false;
      if (filtroTablaEstado === 'sin_insumos' && eq.totalInsumos > 0) return false;

      return matchTexto;
    });
  }, [datosTablaConsolidada, busquedaTabla, filtroTablaTipo, filtroTablaEstado]);

  // Métricas para la tabla consolidada
  const totalEquiposConCompatibilidad = useMemo(() => {
    return datosTablaConsolidada.filter(eq => eq.totalInsumos > 0).length;
  }, [datosTablaConsolidada]);

  return (
    <MainLayout activePage="compatibilidad" pageTitle="Matriz de Compatibilidad">
      <div className="space-y-8 max-w-7xl mx-auto select-none pb-12">
        
        {/* ================= ENCABEZADO PRINCIPAL ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                <Workflow size={12} />
                Reglas de Compatibilidad Técnica y Validación
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Matriz de Compatibilidad</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestione y consulte de forma visual qué insumos, tóners o periféricos corresponden a cada equipo patrimonial.
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
              <span>Registrar Insumo</span>
            </button>
          </div>
        </div>

        {/* ================= BANNER INFORMATIVO ================= */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-600 shrink-0" />
            <span>
              <strong>Consulta interactiva:</strong> Puede configurar asociaciones en el selector superior haciendo clic en los interruptores, o revisar abajo la <strong>tabla visual consolidada por equipo</strong>. Haga <strong>doble clic</strong> en cualquier elemento para abrir su ficha técnica.
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

        {/* ================= PANEL SUPERIOR: CONFIGURADOR DE COMPATIBILIDAD (2 COLUMNAS) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ----- COLUMNA IZQUIERDA (4/12): Catálogo de Insumos ----- */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Catálogo de Insumos</h3>
                <p className="text-[11px] text-slate-400">Seleccione un insumo para activar o desactivar sus equipos.</p>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {insumos.length}
              </span>
            </div>

            {/* Buscador de insumos */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaInsumo}
                onChange={(e) => setBusquedaInsumo(e.target.value)}
                placeholder="Buscar por código, descripción o categoría..."
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

            {/* Listado de Insumos */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {insumosFiltrados.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <Package size={24} className="mx-auto mb-2 text-slate-300" />
                  <p>No se encontraron insumos activos.</p>
                </div>
              ) : (
                insumosFiltrados.map((item) => {
                  const isSelected = item.idInsumo === selectedInsumoId;
                  const cantidadEquipos = reglas.filter(r => Number(r.idInsumo) === Number(item.idInsumo)).length;
                  const esPerif = (item.categoria || '').toLowerCase() === 'periférico' || (item.categoria || '').toLowerCase() === 'periferico';

                  return (
                    <div
                      key={item.idInsumo}
                      onClick={() => {
                        setSelectedInsumoId(item.idInsumo);
                        // Sugerir el filtro correspondiente si estaba en 'todos'
                        if (esPerif && filtroTipoEquipo === 'impresora') {
                          setFiltroTipoEquipo('computadora');
                        }
                      }}
                      onDoubleClick={() => setModalInsumo(item)}
                      title="Haga clic para seleccionar. Doble clic para ver ficha técnica completa."
                      className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-200 shadow-xs ring-1 ring-blue-500/20'
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
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                            {item.descripcion}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 truncate">
                            <span className="font-mono font-semibold text-slate-600">{item.codigoInterno}</span>
                            <span>•</span>
                            <span className={`font-medium ${esPerif ? 'text-indigo-600' : 'text-amber-700'}`}>
                              {item.categoria || 'Insumo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
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

          {/* ----- COLUMNA DERECHA (8/12): Equipos Disponibles y Toggles ----- */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            
            {/* Cabecera del Insumo Seleccionado con Guía de Coherencia */}
            {insumoSeleccionado ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div 
                  className="flex items-center gap-3.5 cursor-pointer group"
                  onDoubleClick={() => setModalInsumo(insumoSeleccionado)}
                  title="Doble clic para ver ficha técnica completa"
                >
                  <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Package size={26} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Insumo Activo
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {insumoSeleccionado.codigoInterno}
                      </span>
                      {/* Sugerencia lógica según categoría */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        infoInsumo.esPeriferico 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {infoInsumo.esPeriferico ? 'Aplicable a: Computadoras' : 'Aplicable a: Impresoras'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition">
                      {insumoSeleccionado.descripcion}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Categoría: <strong className="text-slate-700">{insumoSeleccionado.categoria}</strong> • Stock actual: <strong className="text-emerald-700">{insumoSeleccionado.stockActual} unidades</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalInsumo(insumoSeleccionado)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Info size={14} />
                    <span>Ficha del Insumo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                Seleccione un insumo de la lista izquierda para gestionar sus compatibilidades.
              </div>
            )}

            {/* Subcabecera: Contador + Filtros por Tipo de Equipo */}
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

            {/* Listado de Equipos con Toggles Inteligentes */}
            <div className="divide-y divide-slate-100 border-t border-b border-slate-100 max-h-[420px] overflow-y-auto pr-1">
              {equiposFiltrados.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Laptop size={26} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">No se encontraron equipos registrados para los filtros actuales.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Compruebe los filtros de tipo o agregue equipos en el Catálogo de Equipos.</p>
                </div>
              ) : (
                equiposFiltrados.map((eq) => {
                  const isCompatible = equiposCompatiblesIds.has(Number(eq.idEquipo));
                  const esComputadora = eq.tipoEquipo?.toLowerCase() === 'computadora' || (!eq.tipoEquipo && Boolean(eq.procesador));
                  const esImpresora = eq.tipoEquipo?.toLowerCase() === 'impresora' || (!eq.tipoEquipo && Boolean(eq.tecnologiaImpresion));
                  const tipoEtiqueta = esImpresora ? 'Impresora' : (esComputadora ? 'Computadora' : (eq.tipoEquipo || 'Equipo'));

                  // Validación lógica preventiva
                  const inconsistencia = verificarIncompatibilidadLogica(eq, insumoSeleccionado);
                  const deshabilitarToggle = Boolean(inconsistencia);

                  return (
                    <div 
                      key={eq.idEquipo} 
                      className={`py-3.5 flex items-center justify-between gap-4 px-2 rounded-xl transition ${
                        deshabilitarToggle ? 'bg-slate-50/40 opacity-70' : 'hover:bg-slate-50/70 cursor-default'
                      }`}
                      onDoubleClick={() => setModalEquipo(eq)}
                      title={deshabilitarToggle ? inconsistencia : "Haga clic en el interruptor para cambiar estado. Doble clic para ver ficha."}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCompatible 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : (deshabilitarToggle ? 'bg-slate-100 text-slate-300 border border-slate-200' : 'bg-slate-100 text-slate-500 border border-slate-200')
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

                      {/* Badge de estado + Switch interactivo */}
                      <div className="flex items-center gap-3 shrink-0">
                        {deshabilitarToggle ? (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md" title={inconsistencia}>
                            Incompatible técnicamente
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md tracking-wider ${
                            isCompatible 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {isCompatible ? 'Compatible' : 'Incompatible'}
                          </span>
                        )}

                        {/* Botón Toggle interactivo */}
                        <button
                          type="button"
                          disabled={deshabilitarToggle}
                          onClick={() => handleToggleEquipo(eq)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                            deshabilitarToggle 
                              ? 'bg-slate-200 cursor-not-allowed opacity-50' 
                              : (isCompatible ? 'bg-emerald-600 cursor-pointer' : 'bg-slate-300 cursor-pointer')
                          }`}
                          title={deshabilitarToggle ? inconsistencia : (isCompatible ? 'Desactivar compatibilidad' : 'Habilitar compatibilidad')}
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
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Check size={14} className="text-emerald-500" />
                <span>Las vinculaciones se guardan instantáneamente en la base de datos oficial.</span>
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

        {/* ========================================================================= */}
        {/* ============= SECCIÓN INFERIOR: TABLA VISUAL CONSOLIDADA POR EQUIPO ============= */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
          
          {/* Cabecera de la sección inferior */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <FileSpreadsheet size={13} />
                  Vista Consolidada de Equipamiento
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Mapa Consolidado de Compatibilidad por Equipo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulte en una sola vista qué insumos, tóners o periféricos están autorizados para cada equipo del Tribunal.
              </p>
            </div>

            {/* Métricas / Badges rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="text-slate-400 font-medium">Total Equipos: </span>
                <strong className="text-slate-700">{equipos.length}</strong>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <span className="text-emerald-700 font-medium">Con insumos asignados: </span>
                <strong className="text-emerald-900">{totalEquiposConCompatibilidad}</strong>
              </div>
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                <span className="text-blue-700 font-medium">Reglas activas: </span>
                <strong className="text-blue-900">{reglas.length}</strong>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda de la Tabla */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
            
            {/* Buscador de la tabla */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaTabla}
                onChange={(e) => setBusquedaTabla(e.target.value)}
                placeholder="Buscar por equipo, código patrimonial, sector o insumo asignado..."
                className="w-full pl-8 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white transition"
              />
              {busquedaTabla && (
                <button
                  type="button"
                  onClick={() => setBusquedaTabla('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filtros combinados: Tipo y Estado */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              
              {/* Filtro por tipo de equipo */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFiltroTablaTipo('todos')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    filtroTablaTipo === 'todos' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTablaTipo('computadora')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                    filtroTablaTipo === 'computadora' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Laptop size={12} />
                  Computadoras
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTablaTipo('impresora')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                    filtroTablaTipo === 'impresora' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Printer size={12} />
                  Impresoras
                </button>
              </div>

              {/* Filtro por estado de asignación */}
              <select
                value={filtroTablaEstado}
                onChange={(e) => setFiltroTablaEstado(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los estados</option>
                <option value="con_insumos">Con insumos asociados</option>
                <option value="sin_insumos">Sin insumos asociados</option>
              </select>

            </div>

          </div>

          {/* Tabla Visual Responsiva */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Equipo Patrimonial</th>
                  <th className="py-3.5 px-3">Tipo</th>
                  <th className="py-3.5 px-3">Sector / Oficina</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Insumos y Periféricos Compatibles Asignados</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equiposTablaFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      <Layers size={28} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No se encontraron equipos para los criterios seleccionados.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Pruebe limpiando los filtros de búsqueda.</p>
                    </td>
                  </tr>
                ) : (
                  equiposTablaFiltrados.map((eq) => {
                    const esComputadora = eq.tipoEquipo?.toLowerCase() === 'computadora' || (!eq.tipoEquipo && Boolean(eq.procesador));
                    const esImpresora = eq.tipoEquipo?.toLowerCase() === 'impresora' || (!eq.tipoEquipo && Boolean(eq.tecnologiaImpresion));
                    const tipoEtiqueta = esImpresora ? 'Impresora' : (esComputadora ? 'Computadora' : (eq.tipoEquipo || 'Equipo'));

                    return (
                      <tr 
                        key={eq.idEquipo} 
                        className="hover:bg-slate-50/70 transition"
                      >
                        {/* 1. Columna: Equipo */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                              {esImpresora ? <Printer size={16} /> : <Laptop size={16} />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{eq.marcaModelo}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                {eq.codPatrimonial && (
                                  <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded">
                                    {eq.codPatrimonial}
                                  </span>
                                )}
                                {eq.numeroSerie && (
                                  <span className="font-mono text-[10px] text-slate-400">
                                    S/N: {eq.numeroSerie}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Columna: Tipo */}
                        <td className="py-3.5 px-3 align-top">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            esImpresora 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {esImpresora ? <Printer size={11} /> : <Laptop size={11} />}
                            {tipoEtiqueta}
                          </span>
                        </td>

                        {/* 3. Columna: Sector */}
                        <td className="py-3.5 px-3 align-top">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="font-medium text-[11px] truncate max-w-[150px]">
                              {eq.nombreSector || eq.nombreOficina || 'Sin asignar'}
                            </span>
                          </div>
                        </td>

                        {/* 4. Columna: Insumos Compatibles Asignados */}
                        <td className="py-3.5 px-4 align-top">
                          {eq.insumosAsociados.length === 0 ? (
                            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-800 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                                <span className="text-[11px] font-medium">Sin insumos vinculados actualmente.</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  // Auto-seleccionar un insumo compatible arriba si existe
                                  const insumoRecomendado = insumos.find(i => {
                                    const c = (i.categoria || '').toLowerCase();
                                    return esImpresora ? c === 'insumo' : c.includes('perif');
                                  });
                                  if (insumoRecomendado) {
                                    setSelectedInsumoId(insumoRecomendado.idInsumo);
                                  }
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer shrink-0"
                              >
                                Vincular insumo ↑
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {eq.insumosAsociados.map((ins) => {
                                const esPerif = (ins.categoria || '').toLowerCase().includes('perif');
                                return (
                                  <div
                                    key={ins.idRegla}
                                    onDoubleClick={() => setModalInsumo(ins.insumoCompleto)}
                                    title="Doble clic para ver ficha técnica del insumo"
                                    className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl px-2.5 py-1 text-[11px] transition shadow-2xs group cursor-default"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        esPerif ? 'bg-indigo-500' : 'bg-emerald-500'
                                      }`}></span>
                                      <span className="font-mono font-bold text-slate-700">{ins.codigoInterno}</span>
                                      <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={ins.descripcion}>
                                        {ins.descripcion}
                                      </span>
                                    </div>

                                    {/* Stock badge */}
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                      ins.stockActual <= (ins.stockSeguridad || 3) 
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}>
                                      {ins.stockActual} un.
                                    </span>

                                    {/* Botón para remover vinculación directamente */}
                                    <button
                                      type="button"
                                      onClick={() => handleDesvincularDesdeTabla(ins.idRegla, eq.marcaModelo, ins.descripcion)}
                                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition cursor-pointer ml-0.5"
                                      title="Desvincular este insumo del equipo"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* 5. Columna: Acciones / Ficha */}
                        <td className="py-3.5 px-4 text-right align-top">
                          <button
                            type="button"
                            onClick={() => setModalEquipo(eq)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                            title="Ver ficha técnica completa del equipo"
                          >
                            <Info size={13} />
                            <span>Ver Ficha</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen inferior de la tabla */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>
                Mostrando <strong>{equiposTablaFiltrados.length}</strong> de {equipos.length} equipos registrados.
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              * Las reglas garantizan que al emitir salidas o comprobantes solo se asignen insumos homologados.
            </span>
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