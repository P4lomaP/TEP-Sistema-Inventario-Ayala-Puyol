import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, 
  ArrowRightLeft,
  AlertCircle, 
  Trash2, 
  FileText, 
  History, 
  Cpu, 
  Building2, 
  User, 
  Search, 
  CheckCircle2, 
  ChevronRight, 
  Plus,
  Laptop,
  Printer,
  Package,
  X,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Minus,
  Check,
  Layers,
  Download
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { listarEquipos } from '../services/equiposService';
import { listarInsumos } from '../services/insumosService';
import { listarSectores } from '../services/sectoresService';
import { 
  listarMovimientos, 
  crearMovimiento, 
  obtenerMovimientoPorId,
  descargarComprobantePDF
} from '../services/movimientosService';
import { listarCompatibilidades } from '../services/compatibilidadService';

export default function Movimientos() {
  const navigate = useNavigate();

  // 1. Catálogos cargados desde la base de datos (con fallback de seguridad)
  const [catalogoEquipos, setCatalogoEquipos] = useState([
    { idEquipo: 1, codPatrimonial: 'TEP-PC-042', marcaModelo: 'Dell OptiPlex 3090', tipoEquipo: 'Computadora', nombreSector: 'Mesa de Entradas', estadoOperativo: 'Operativo' },
    { idEquipo: 2, codPatrimonial: 'TEP-IMP-001', marcaModelo: 'HP LaserJet Enterprise M608', tipoEquipo: 'Impresora', nombreSector: 'Secretaría Electoral', estadoOperativo: 'Operativo', idInsumoCompatible: 1 },
    { idEquipo: 3, codPatrimonial: 'TEP-PC-015', marcaModelo: 'Lenovo ThinkCentre M70q', tipoEquipo: 'Computadora', nombreSector: 'Presidencia / Juez', estadoOperativo: 'Operativo' }
  ]);

  const [catalogoInsumos, setCatalogoInsumos] = useState([
    { idInsumo: 1, codigoInterno: 'TON-HP-85A', descripcion: 'Tóner HP CE285A Negro Original', categoria: 'Tóner', stockActual: 10, stockSeguridad: 3 },
    { idInsumo: 2, codigoInterno: 'RES-A4-75G', descripcion: 'Resma de Papel A4 75g Autor', categoria: 'Papelería', stockActual: 45, stockSeguridad: 15 },
    { idInsumo: 3, codigoInterno: 'CAB-HDMI-3M', descripcion: 'Cable HDMI 2.1 UltraHD (3 metros)', categoria: 'Cables', stockActual: 8, stockSeguridad: 2 },
    { idInsumo: 4, codigoInterno: 'TEC-USB-GEN', descripcion: 'Teclado USB Español Genius', categoria: 'Periféricos', stockActual: 12, stockSeguridad: 4 }
  ]);

  const [listaSectores, setListaSectores] = useState([
    'Mesa de Entradas',
    'Secretaría Electoral',
    'Presidencia / Juez',
    'Secretaría de Informática Electoral',
    'Administración y Personal',
    'Archivo y Notificaciones'
  ]);

  // 2. Estados de selección y predictivos para Equipo Destino
  const [equipoTexto, setEquipoTexto] = useState('');
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [showEquipoDropdown, setShowEquipoDropdown] = useState(false);

  // 3. Estados de selección y predictivos para Insumos
  const [insumoTexto, setInsumoTexto] = useState('');
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [showInsumoDropdown, setShowInsumoDropdown] = useState(false);
  const [cantidadAñadir, setCantidadAñadir] = useState(1);

  // 4. Estados generales de la transacción
  const [sector, setSector] = useState('');
  const [receptor, setReceptor] = useState('');
  const [notas, setNotas] = useState('');
  const [estadoTransaccion, setEstadoTransaccion] = useState('Borrador');
  const [toastMessage, setToastMessage] = useState('');

  // 5. Lista de artículos añadidos al movimiento (inicia limpio)
  const [articulos, setArticulos] = useState([]);

  // 6. Estados de conexión con el backend de movimientos
  const [historialMovimientos, setHistorialMovimientos] = useState([]);
  const [reglasCompatibilidad, setReglasCompatibilidad] = useState([]);
  const [enviandoMovimiento, setEnviandoMovimiento] = useState(false);
  const [movimientoDetalleModal, setMovimientoDetalleModal] = useState(null);
  const [cargandoDetalleId, setCargandoDetalleId] = useState(null);

  // Cargar datos reales desde los servicios al montar el componente
  useEffect(() => {
    listarEquipos()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalogoEquipos(data.filter((eq) => eq.estadoOperativo !== 'Baja'));
        }
      })
      .catch(() => {});

    listarInsumos()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalogoInsumos(data);
        }
      })
      .catch(() => {});

    listarSectores()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setListaSectores(data.map((s) => s.nombreOficina || s.nombreSector).filter(Boolean));
        }
      })
      .catch(() => {});

    listarMovimientos()
      .then((data) => {
        if (Array.isArray(data)) {
          setHistorialMovimientos(data);
        }
      })
      .catch(() => {});

    listarCompatibilidades()
      .then((data) => {
        if (Array.isArray(data)) {
          setReglasCompatibilidad(data);
        }
      })
      .catch(() => {});

    // Listener para cerrar dropdowns predictivos al hacer clic fuera
    const handleClickOutside = () => {
      setShowEquipoDropdown(false);
      setShowInsumoDropdown(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleVerDetalleMovimiento = async (idMovimiento) => {
    setCargandoDetalleId(idMovimiento);
    try {
      const data = await obtenerMovimientoPorId(idMovimiento);
      setMovimientoDetalleModal(data);
    } catch (err) {
      mostrarToast(`Error al consultar detalle: ${err.message}`);
    } finally {
      setCargandoDetalleId(null);
    }
  };

  const mostrarToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Coincidencias predictivas de Equipos
  const sugerenciasEquipos = equipoTexto.trim() === ''
    ? []
    : catalogoEquipos.filter((eq) => {
        const query = equipoTexto.toLowerCase();
        const codPat = (eq.codPatrimonial || '').toLowerCase();
        const marca = (eq.marcaModelo || '').toLowerCase();
        const sec = (eq.nombreSector || eq.nombreOficina || '').toLowerCase();
        const tipo = (eq.tipoEquipo || '').toLowerCase();
        return codPat.includes(query) || marca.includes(query) || sec.includes(query) || tipo.includes(query);
      });

  // Coincidencias predictivas de Insumos
  const sugerenciasInsumos = insumoTexto.trim() === ''
    ? []
    : catalogoInsumos.filter((ins) => {
        const query = insumoTexto.toLowerCase();
        const cod = (ins.codigoInterno || '').toLowerCase();
        const desc = (ins.descripcion || '').toLowerCase();
        const cat = (ins.categoria || '').toLowerCase();
        return cod.includes(query) || desc.includes(query) || cat.includes(query);
      });

  // Manejar selección de Equipo Destino
  const handleSeleccionarEquipo = (eq) => {
    setEquipoSeleccionado(eq);
    const etiqueta = `${eq.marcaModelo}${eq.codPatrimonial ? ` (${eq.codPatrimonial})` : ''}`;
    setEquipoTexto(etiqueta);
    setShowEquipoDropdown(false);
    if (eq.nombreSector || eq.nombreOficina) {
      setSector(eq.nombreSector || eq.nombreOficina);
    }
  };

  // Limpiar selección de Equipo
  const handleLimpiarEquipo = () => {
    setEquipoSeleccionado(null);
    setEquipoTexto('');
    setShowEquipoDropdown(false);
  };

  // Manejar selección de Insumo en el buscador predictivo
  const handleSeleccionarInsumo = (item) => {
    setInsumoSeleccionado(item);
    setInsumoTexto(''); // Limpia el texto del buscador inmediatamente
    setShowInsumoDropdown(false);
    setCantidadAñadir(1);
  };

  // Limpiar selección de Insumo
  const handleLimpiarInsumo = () => {
    setInsumoSeleccionado(null);
    setInsumoTexto('');
    setCantidadAñadir(1);
    setShowInsumoDropdown(false);
  };

  // Botón: Añadir insumo a la lista de la transacción
  const handleAgregarInsumoALaLista = () => {
    if (!insumoSeleccionado) {
      mostrarToast('Seleccione un insumo del catálogo para añadir.');
      return;
    }

    if (cantidadAñadir <= 0) {
      mostrarToast('La cantidad debe ser mayor a 0');
      return;
    }

    if (cantidadAñadir > insumoSeleccionado.stockActual) {
      mostrarToast(`Stock insuficiente. Disponible: ${insumoSeleccionado.stockActual} unidades.`);
      return;
    }

    // Validación de compatibilidad cuando hay un equipo destino seleccionado
    if (equipoSeleccionado) {
      const alerta = verificarAlertaCompatibilidad();
      if (alerta && alerta.tipo === 'incompatible') {
        mostrarToast(`⛔ No se puede añadir: ${alerta.mensaje}`);
        return;
      }
    }

    const destinoNombre = equipoSeleccionado
      ? `${equipoSeleccionado.marcaModelo}${equipoSeleccionado.codPatrimonial ? ` (${equipoSeleccionado.codPatrimonial})` : ''}`
      : (sector || 'General / Sin equipo');

    const sectorNombre = sector || equipoSeleccionado?.nombreSector || equipoSeleccionado?.nombreOficina || 'Sin sector';
    const receptorNombre = receptor.trim() || 'No especificado';

    const existeIndex = articulos.findIndex(
      (a) => a.codigo === insumoSeleccionado.codigoInterno && a.destino === destinoNombre
    );

    if (existeIndex >= 0) {
      const nuevaCantidad = articulos[existeIndex].cantidad + cantidadAñadir;
      if (nuevaCantidad > insumoSeleccionado.stockActual) {
        mostrarToast(`No puede superar el stock máximo disponible (${insumoSeleccionado.stockActual} un.).`);
        return;
      }
      setArticulos(
        articulos.map((a, idx) =>
          idx === existeIndex ? { ...a, cantidad: nuevaCantidad } : a
        )
      );
    } else {
      setArticulos([
        ...articulos,
        {
          idInsumo: insumoSeleccionado.idInsumo,
          codigo: insumoSeleccionado.codigoInterno,
          descripcion: insumoSeleccionado.descripcion,
          categoria: insumoSeleccionado.categoria,
          cantidad: cantidadAñadir,
          stockMax: insumoSeleccionado.stockActual,
          destino: destinoNombre,
          sector: sectorNombre,
          receptor: receptorNombre,
          equipo: equipoSeleccionado
        }
      ]);
    }

    mostrarToast(`✓ Añadido ${cantidadAñadir} un. de ${insumoSeleccionado.codigoInterno}`);
    
    // Limpia por completo la selección del insumo
    handleLimpiarInsumo();

    // Limpia automáticamente todas las entradas de destino
    handleLimpiarEquipo();
    setSector('');
    setReceptor('');
  };

  // Quitar insumo de la transacción
  const handleEliminarItem = (index) => {
    setArticulos(articulos.filter((_, idx) => idx !== index));
  };

  // Modificar cantidad en la tabla directamente
  const handleModificarCantidad = (index, delta) => {
    setArticulos(
      articulos.map((item, idx) => {
        if (idx === index) {
          const nueva = item.cantidad + delta;
          if (nueva < 1) return item;
          if (nueva > (item.stockMax || 999)) {
            mostrarToast(`Stock máximo disponible: ${item.stockMax} unidades.`);
            return item;
          }
          return { ...item, cantidad: nueva };
        }
        return item;
      })
    );
  };

  // Verificación estricta de compatibilidad contra la Matriz de Compatibilidad
  const verificarAlertaCompatibilidad = () => {
    if (!equipoSeleccionado || !insumoSeleccionado) return null;

    // 1. Buscar si existe la regla en la Matriz
    const esCompatibleEnMatriz = reglasCompatibilidad.some(
      (r) => Number(r.idEquipo) === Number(equipoSeleccionado.idEquipo) && 
             Number(r.idInsumo) === Number(insumoSeleccionado.idInsumo)
    );

    if (esCompatibleEnMatriz) {
      return {
        tipo: 'compatible',
        mensaje: `✓ Compatibilidad verificada: "${insumoSeleccionado.descripcion}" está homologado y habilitado para ${equipoSeleccionado.marcaModelo} en la Matriz de Compatibilidad.`
      };
    }

    // 2. Si no está en la matriz, comprobar si es una incoherencia de tipo evidente
    const tipoEq = (equipoSeleccionado.tipoEquipo || '').toLowerCase();
    const esPc = tipoEq === 'computadora' || (!equipoSeleccionado.tipoEquipo && Boolean(equipoSeleccionado.procesador));
    const esImp = tipoEq === 'impresora' || (!equipoSeleccionado.tipoEquipo && Boolean(equipoSeleccionado.tecnologiaImpresion));

    const catIns = (insumoSeleccionado.categoria || '').toLowerCase();
    const descIns = (insumoSeleccionado.descripcion || '').toLowerCase();

    const esPerif = catIns === 'periférico' || catIns === 'periferico' || 
      descIns.includes('mouse') || descIns.includes('teclado') || descIns.includes('auricular') || descIns.includes('webcam');

    const esConsumibleImp = descIns.includes('tóner') || descIns.includes('toner') || 
      descIns.includes('cartucho') || descIns.includes('tinta') || descIns.includes('tambor') || descIns.includes('fusor');

    if (esPerif && esImp) {
      return {
        tipo: 'incompatible',
        mensaje: `⛔ Incompatibilidad técnica: Está intentando asignar un periférico de cómputo (${insumoSeleccionado.descripcion}) a una Impresora (${equipoSeleccionado.marcaModelo}).`
      };
    }

    if (esConsumibleImp && esPc) {
      return {
        tipo: 'incompatible',
        mensaje: `⛔ Incompatibilidad técnica: Está intentando asignar un consumible de impresión (${insumoSeleccionado.descripcion}) a una Computadora (${equipoSeleccionado.marcaModelo}).`
      };
    }

    // 3. Incompatibilidad por falta de registro en la Matriz
    return {
      tipo: 'incompatible',
      mensaje: `⛔ Incompatibilidad: "${insumoSeleccionado.descripcion}" no está registrado como compatible con "${equipoSeleccionado.marcaModelo}" en la Matriz de Compatibilidad. Para usarlo en este equipo, regístrelo en la Matriz o desvincule el equipo destino.`
    };
  };

  const alertaCompatibilidad = verificarAlertaCompatibilidad();

  // Cálculo de ítems totales
  const totalItemsDiferentes = articulos.length;
  const totalUnidades = articulos.reduce((acc, item) => acc + item.cantidad, 0);

  // Finalizar y registrar el movimiento completo (Conectado con el Backend)
  const handleRegistrarMovimiento = async () => {
    if (articulos.length === 0) {
      mostrarToast('Debe añadir al menos un insumo a la orden de salida.');
      return;
    }

    setEnviandoMovimiento(true);

    try {
      const compRef = `REM-${Date.now().toString().slice(-6)}`;
      const primerArticulo = articulos[0];
      const sectorDestino = sector.trim() || primerArticulo?.sector || 'General';
      const receptorPersona = receptor.trim() || (primerArticulo?.receptor !== 'No especificado' ? primerArticulo.receptor : '') || 'Personal de Dependencia';
      const agenteReceptorFinal = `${sectorDestino}${receptorPersona ? ` - ${receptorPersona}` : ''}${notas.trim() ? ` (Nota: ${notas.trim()})` : ''}`;

      const detallesPayload = articulos.map((item) => ({
        idInsumo: item.idInsumo,
        cantidadAfectada: item.cantidad,
        idEquipoDestino: item.equipo?.idEquipo || null
      }));

      await crearMovimiento({
        tipoMovimiento: 'Egreso',
        comprobanteRef: compRef,
        agenteReceptor: agenteReceptorFinal,
        idUsuario: 1,
        detalles: detallesPayload
      });

      mostrarToast(`✓ ¡Movimiento registrado exitosamente! Comprobante: ${compRef}`);

      // Limpia por completo todas las entradas del formulario y la lista
      setArticulos([]);
      handleLimpiarEquipo();
      handleLimpiarInsumo();
      setSector('');
      setReceptor('');
      setNotas('');
      setEstadoTransaccion('Completada');

      // Actualizar catálogo de insumos (para reflejar el stock descontado en el almacén)
      const insumosActualizados = await listarInsumos().catch(() => []);
      if (Array.isArray(insumosActualizados) && insumosActualizados.length > 0) {
        setCatalogoInsumos(insumosActualizados);
      }

      // Actualizar historial reciente de movimientos
      const movsActualizados = await listarMovimientos().catch(() => []);
      if (Array.isArray(movsActualizados)) {
        setHistorialMovimientos(movsActualizados);
      }

    } catch (err) {
      console.error('Error al registrar movimiento:', err);
      mostrarToast(`Error: ${err.message || 'No se pudo registrar la salida.'}`);
    } finally {
      setEnviandoMovimiento(false);
    }
  };

  // Reiniciar formulario manualmente
  const handleNuevoMovimiento = () => {
    setArticulos([]);
    handleLimpiarEquipo();
    handleLimpiarInsumo();
    setSector('');
    setReceptor('');
    setNotas('');
    setEstadoTransaccion('Borrador');
    mostrarToast('Formulario restablecido para un nuevo movimiento.');
  };

  return (
    <MainLayout activePage="movimientos" pageTitle="Panel de Movimientos y Egresos">
      <div className="space-y-6 max-w-7xl mx-auto select-none">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                <ArrowRightLeft size={12} />
                Gestión de Salidas y Egresos
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Registro de Movimientos</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Asigne insumos y repuestos a equipos patrimoniales u oficinas con control de compatibilidad.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNuevoMovimiento}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Limpiar Formulario</span>
            </button>
          </div>
        </div>

        {/* Layout en Dos Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* ================= COLUMNA IZQUIERDA (2/3): Formulario y Carga ================= */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SECCIÓN 1: Destino del Movimiento (Equipo y Sector) */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Laptop size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">1. Destino del Movimiento</h3>
                    <p className="text-[11px] text-slate-400">Equipo patrimonial u oficina física que recibe el insumo.</p>
                  </div>
                </div>
                {equipoSeleccionado && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                    <Check size={11} /> Vinculado: {equipoSeleccionado.tipoEquipo}
                  </span>
                )}
              </div>

              {/* Buscador Fluido de Equipo Destino (Sin bloqueo ni botón Cambiar manual) */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Código o Nombre de Equipo Destino (Opcional)
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={equipoTexto}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEquipoTexto(val);
                      if (equipoSeleccionado && val !== `${equipoSeleccionado.marcaModelo}${equipoSeleccionado.codPatrimonial ? ` (${equipoSeleccionado.codPatrimonial})` : ''}`) {
                        setEquipoSeleccionado(null);
                      }
                      setShowEquipoDropdown(true);
                    }}
                    onFocus={() => {
                      if (!equipoSeleccionado) {
                        setShowEquipoDropdown(true);
                      }
                    }}
                    placeholder="Ej. TEP-PC-042, Dell OptiPlex, HP LaserJet..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/40 focus:bg-white transition"
                  />
                  {equipoTexto && (
                    <button
                      type="button"
                      onClick={handleLimpiarEquipo}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      title="Limpiar equipo"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Desplegable de Coincidencias de Equipos (Aparece abajo del campo) */}
                {showEquipoDropdown && sugerenciasEquipos.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 duration-150">
                    <div className="p-2 bg-slate-50/70 text-[10px] font-bold uppercase text-slate-400">
                      Equipos Disponibles ({sugerenciasEquipos.length})
                    </div>
                    {sugerenciasEquipos.map((eq) => {
                      const esImp = eq.tipoEquipo?.toLowerCase() === 'impresora';
                      return (
                        <button
                          key={eq.idEquipo}
                          type="button"
                          onClick={() => handleSeleccionarEquipo(eq)}
                          className="w-full text-left px-4 py-3 text-xs hover:bg-blue-50/50 flex items-center justify-between transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`p-1.5 rounded-lg shrink-0 ${esImp ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                              {esImp ? <Printer size={15} /> : <Laptop size={15} />}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{eq.marcaModelo}</span>
                                {eq.codPatrimonial && (
                                  <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                    {eq.codPatrimonial}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Sector: <span className="font-medium text-slate-600">{eq.nombreSector || eq.nombreOficina || 'Sin asignar'}</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-lg shrink-0">
                            Elegir
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selectores: Sector Físico y Receptor Oficial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Sector o Dependencia (*)
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none bg-white text-slate-700 cursor-pointer"
                    >
                      <option value="">Seleccione Sector / Oficina</option>
                      {listaSectores.map((sec, idx) => (
                        <option key={idx} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Persona Receptora / Solicitante
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={receptor}
                      onChange={(e) => setReceptor(e.target.value)}
                      placeholder="Ej. Dr. Roberto Gómez / Lic. Martha Pérez"
                      className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Selección y Carga de Insumos */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Package size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">2. Selección y Carga de Insumos</h3>
                    <p className="text-[11px] text-slate-400">Busque el insumo en catálogo, elija la cantidad y presione Añadir.</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {catalogoInsumos.length} insumos en catálogo
                </span>
              </div>

              {/* Buscador Predictivo de Insumos */}
              {!insumoSeleccionado ? (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Código o Nombre del Insumo (*)
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={insumoTexto}
                      onChange={(e) => {
                        setInsumoTexto(e.target.value);
                        setShowInsumoDropdown(true);
                      }}
                      onFocus={() => setShowInsumoDropdown(true)}
                      placeholder="Ej. TON-HP-85A, Tóner, Resma A4, Cable HDMI..."
                      className="w-full pl-10 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/40 focus:bg-white transition"
                    />
                    {insumoTexto && (
                      <button
                        type="button"
                        onClick={handleLimpiarInsumo}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Desplegable de Coincidencias de Insumos (Aparece abajo del campo) */}
                  {showInsumoDropdown && sugerenciasInsumos.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 duration-150">
                      <div className="p-2 bg-slate-50/70 text-[10px] font-bold uppercase text-slate-400">
                        Coincidencias en Catálogo ({sugerenciasInsumos.length})
                      </div>
                      {sugerenciasInsumos.map((item) => (
                        <button
                          key={item.idInsumo || item.codigoInterno}
                          type="button"
                          onClick={() => handleSeleccionarInsumo(item)}
                          className="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                              <Layers size={14} />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{item.descripcion}</span>
                                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded font-bold">
                                  {item.codigoInterno}
                                </span>
                                {equipoSeleccionado && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                    reglasCompatibilidad.some(r => Number(r.idEquipo) === Number(equipoSeleccionado.idEquipo) && Number(r.idInsumo) === Number(item.idInsumo))
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-600 border-rose-200'
                                  }`}>
                                    {reglasCompatibilidad.some(r => Number(r.idEquipo) === Number(equipoSeleccionado.idEquipo) && Number(r.idInsumo) === Number(item.idInsumo))
                                      ? '✓ Compatible'
                                      : 'Incompatible'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Categoría: <span className="font-medium text-slate-600">{item.categoria}</span> • Stock actual: <span className={`font-bold ${item.stockActual <= 3 ? 'text-amber-600' : 'text-emerald-700'}`}>{item.stockActual} un.</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-lg shrink-0">
                            Seleccionar
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Ficha Activa del Insumo Seleccionado + Cantidad + BOTÓN DE AÑADIR */
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 animate-in fade-in-50 duration-150">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Insumo a Incorporar</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-slate-800">{insumoSeleccionado.descripcion}</span>
                        <span className="font-mono text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {insumoSeleccionado.codigoInterno}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Disponibilidad en almacén: <strong className="text-slate-800">{insumoSeleccionado.stockActual} unidades</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLimpiarInsumo}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
                    >
                      Elegir otro
                    </button>
                  </div>

                  {/* Banner Contextual de Compatibilidad */}
                  {alertaCompatibilidad && (
                    <div className={`p-3 rounded-xl flex items-start gap-2.5 text-xs ${
                      alertaCompatibilidad.tipo === 'compatible'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : alertaCompatibilidad.tipo === 'incompatible'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {alertaCompatibilidad.tipo === 'compatible' ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className={alertaCompatibilidad.tipo === 'incompatible' ? 'text-rose-600 shrink-0 mt-0.5' : 'text-amber-600 shrink-0 mt-0.5'} />
                      )}
                      <p className="leading-relaxed font-medium">{alertaCompatibilidad.mensaje}</p>
                    </div>
                  )}

                  {/* Controles: Cantidad y Botón Explícito para Añadir */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Cantidad a entregar:</span>
                      <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setCantidadAñadir(Math.max(1, cantidadAñadir - 1))}
                          className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={insumoSeleccionado.stockActual}
                          value={cantidadAñadir}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setCantidadAñadir(Math.min(insumoSeleccionado.stockActual, Math.max(1, val)));
                            }
                          }}
                          className="w-12 text-center text-xs font-bold text-slate-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setCantidadAñadir(Math.min(insumoSeleccionado.stockActual, cantidadAñadir + 1))}
                          className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* BOTÓN EXPLÍCITO PARA AÑADIR EL INSUMO A LA LISTA */}
                    <button
                      type="button"
                      onClick={handleAgregarInsumoALaLista}
                      disabled={alertaCompatibilidad?.tipo === 'incompatible'}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 ${
                        alertaCompatibilidad?.tipo === 'incompatible'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200 cursor-not-allowed opacity-80'
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      }`}
                      title={alertaCompatibilidad?.tipo === 'incompatible' ? 'Insumo incompatible con el equipo destino seleccionado' : 'Añadir insumo a la orden'}
                    >
                      {alertaCompatibilidad?.tipo === 'incompatible' ? (
                        <>
                          <AlertCircle size={15} />
                          <span>Incompatible con Equipo Destino</span>
                        </>
                      ) : (
                        <>
                          <Plus size={15} />
                          <span>Añadir Insumo a la Lista</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: Tabla de Artículos Cargados en la Transacción */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Insumos en esta orden ({articulos.length})
                  </p>
                  {articulos.length > 0 && (
                    <span className="text-xs font-semibold text-slate-500">
                      Total unidades: <strong className="text-slate-800">{totalUnidades}</strong>
                    </span>
                  )}
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead className="bg-slate-50/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100 select-none">
                      <tr>
                        <th className="py-3.5 px-4">Código</th>
                        <th className="py-3.5 px-4">Descripción del Insumo</th>
                        <th className="py-3.5 px-4">Destino Asignado</th>
                        <th className="py-3.5 px-4 text-center">Cantidad</th>
                        <th className="py-3.5 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {articulos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <Package size={22} className="text-slate-300" />
                              <span className="font-medium text-slate-500">Aún no ha agregado insumos a la orden de egreso.</span>
                              <span className="text-[11px] text-slate-400">Seleccione destino e insumo arriba, elija cantidad y presione "Añadir Insumo a la Lista".</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        articulos.map((item, idx) => (
                          <tr key={`${item.codigo}-${idx}`} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                              <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100 text-[11px]">
                                {item.codigo}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-800">{item.descripcion}</span>
                              {item.categoria && (
                                <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                  {item.categoria}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-800 text-xs">{item.destino}</span>
                                <span className="text-[10px] text-slate-400">
                                  Sector: <span className="font-semibold text-slate-600">{item.sector}</span>
                                  {item.receptor && item.receptor !== 'No especificado' ? ` • Receptor: ${item.receptor}` : ''}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => handleModificarCantidad(idx, -1)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="font-bold text-slate-800 text-xs min-w-[18px]">
                                  {item.cantidad}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleModificarCantidad(idx, 1)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleEliminarItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                title="Quitar de la orden"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

          {/* ================= COLUMNA DERECHA (1/3): Resumen & BOTÓN REGISTRAR MOVIMIENTO ================= */}
          <div className="space-y-6">
            
            {/* Tarjeta de Resumen de Operación */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 text-slate-800">
                <FileText size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold">Resumen de la Transacción</h3>
              </div>

              {/* Metadatos */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Tipo de Operación</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                    EGRESO / SALIDA
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Destino / Asignación</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[160px] truncate" title={equipoSeleccionado?.marcaModelo || (articulos.length > 0 ? articulos[articulos.length - 1].destino : (sector || 'No especificado'))}>
                    {equipoSeleccionado ? equipoSeleccionado.marcaModelo : (articulos.length > 0 ? articulos[articulos.length - 1].destino : (sector || 'No especificado'))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Sector Asignado</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[160px] truncate">
                    {sector || (articulos.length > 0 ? articulos[articulos.length - 1].sector : 'Sin sector')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Ítems Diferentes</span>
                  <span className="font-bold text-slate-800">{totalItemsDiferentes}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Unidades Totales</span>
                  <span className="font-bold text-blue-700 text-sm">{totalUnidades} un.</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Estado de la Orden</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    estadoTransaccion === 'Completada'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {estadoTransaccion}
                  </span>
                </div>
              </div>

              {/* Notas Internas / Motivo del Egreso */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Motivo o Justificación del Egreso
                </label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Reemplazo de tóner por agotamiento para impresión de actas electorales..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-600 resize-none bg-slate-50/50"
                />
              </div>

              {/* BOTONES PRINCIPALES DE CIERRE */}
              <div className="space-y-2.5 pt-2">
                {/* BOTÓN INDEPENDIENTE PARA FINALIZAR EL MOVIMIENTO (Limpia el formulario) */}
                <button
                  type="button"
                  onClick={handleRegistrarMovimiento}
                  disabled={articulos.length === 0 || enviandoMovimiento}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-blue-500/20"
                >
                  {enviandoMovimiento ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Registrando salida en servidor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Registrar Movimiento de Salida</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => mostrarToast('Generando Acta Oficial de Entrega en formato PDF...')}
                  disabled={articulos.length === 0}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText size={15} />
                  <span>Generar Acta de Entrega PDF</span>
                </button>
              </div>
            </div>

            {/* Tarjeta de Herramientas Rápidas */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Accesos Directos
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-between p-2.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <History size={16} className="text-slate-400" />
                    <span>Ver Últimos Movimientos (Dashboard)</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/insumos')}
                  className="w-full flex items-center justify-between p-2.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Package size={16} className="text-slate-400" />
                    <span>Catálogo de Insumos</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/equipos')}
                  className="w-full flex items-center justify-between p-2.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Cpu size={16} className="text-slate-400" />
                    <span>Catálogo de Equipos</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ================= SECCIÓN INFERIOR: Historial Reciente de Salidas Registradas ================= */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <History size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Últimos Movimientos de Almacén Registrados</h3>
                <p className="text-[11px] text-slate-400">
                  Consulte las salidas asentadas en la base de datos oficial con su comprobante de remito.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Total registrados: <strong className="text-slate-800">{historialMovimientos.length}</strong>
              </span>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100 select-none">
                  <tr>
                    <th className="py-3.5 px-4">Comprobante</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Fecha y Hora</th>
                    <th className="py-3.5 px-4">Destino / Agente Receptor</th>
                    <th className="py-3.5 px-4">Operador</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4 text-right">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {historialMovimientos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No hay movimientos registrados en la base de datos aún.
                      </td>
                    </tr>
                  ) : (
                    historialMovimientos.slice(0, 8).map((mov) => (
                      <tr key={mov.idMovimiento} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {mov.comprobanteRef}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            mov.tipoMovimiento?.toLowerCase() === 'egreso'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {mov.tipoMovimiento}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {mov.fechaHora}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {mov.agenteReceptor || 'No especificado'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          {mov.usuarioNombre || 'Administrador'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            mov.estado === 'Activo'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {mov.estado || 'Activo'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleVerDetalleMovimiento(mov.idMovimiento)}
                              disabled={cargandoDetalleId === mov.idMovimiento}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            >
                              {cargandoDetalleId === mov.idMovimiento ? 'Cargando...' : 'Ver Artículos'}
                            </button>
                            <button
                              type="button"
                              title="Descargar Acta / Remito Oficial en PDF"
                              onClick={async () => {
                                try {
                                  await descargarComprobantePDF(mov.idMovimiento, mov.comprobanteRef);
                                  mostrarToast(`✓ Acta PDF descargada: ${mov.comprobanteRef}`);
                                } catch (err) {
                                  mostrarToast(`Error: ${err.message || 'No se pudo descargar el PDF.'}`);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal de Detalle de Movimiento */}
        {movimientoDetalleModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                    <FileText size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Ficha de Movimiento Registrado
                    </span>
                    <h3 className="text-base font-bold text-slate-800 leading-tight">
                      Comprobante: {movimientoDetalleModal.comprobanteRef}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMovimientoDetalleModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Encabezado del movimiento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Operación</span>
                  <span className="font-bold text-amber-700">{movimientoDetalleModal.tipoMovimiento}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Fecha y Hora</span>
                  <span className="font-mono text-slate-700">{movimientoDetalleModal.fechaHora}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Destino / Solicitante</span>
                  <span className="font-semibold text-slate-800 truncate block">{movimientoDetalleModal.agenteReceptor || 'General'}</span>
                </div>
              </div>

              {/* Tabla de artículos del movimiento */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Insumos Afectados ({movimientoDetalleModal.detalles?.length || 0})
                </h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3">Equipo Destino</th>
                        <th className="py-2.5 px-3 text-center">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(movimientoDetalleModal.detalles || []).map((det, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{det.codigoInterno}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{det.insumoDescripcion}</td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {det.equipoModelo ? `${det.equipoModelo} (${det.equipoCodPatrimonial || 'S/C'})` : 'Sin equipo'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-800">{det.cantidadAfectada} un.</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await descargarComprobantePDF(movimientoDetalleModal.idMovimiento, movimientoDetalleModal.comprobanteRef);
                      mostrarToast(`✓ Acta en PDF descargada: ${movimientoDetalleModal.comprobanteRef}`);
                    } catch (err) {
                      mostrarToast(`Error: ${err.message || 'No se pudo descargar el PDF.'}`);
                    }
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} />
                  <span>Descargar Acta PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMovimientoDetalleModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Flotante */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Pie Institucional */}
        <div className="text-center pt-8 pb-2 text-[11px] text-slate-400 tracking-wider">
          © 2026 TRIBUNAL ELECTORAL PERMANENTE • MÓDULO DE MOVIMIENTOS Y EGRESOS
        </div>

      </div>
    </MainLayout>
  );
}