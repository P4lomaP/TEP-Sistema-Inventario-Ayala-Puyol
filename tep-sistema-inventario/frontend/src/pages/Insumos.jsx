import { useState, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Download, 
  Plus, 
  Box, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  RefreshCw,
  Inbox
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import BannerAuditorReadOnly from '../components/BannerAuditorReadOnly';
import ModalNuevoInsumo from '../components/ModalNuevoInsumo';
import ModalDetalleInsumo from '../components/ModalDetalleInsumo';
import ModalObservacion from '../components/ModalObservacion';
import { getStoredUser } from '../services/authService';
import { 
  listarInsumos, 
  crearInsumo, 
  actualizarInsumo, 
  darDeBajaInsumo,
  descargarInsumosPDF
} from '../services/insumosService';

export default function Insumos() {
  const currentUser = getStoredUser();
  const rol = currentUser?.rolAcceso;
  const isAdmin = rol === 'Administrador';
  const isAuditor = (rol || '').toLowerCase().includes('auditor');

  // 1. ZONA JAVASCRIPT: Estados vinculados al Backend
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);

  const [isModalNuevoOpen, setIsModalNuevoOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

  // Estados para Modal de Detalle / Edición / Eliminación (Doble Clic)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);

  // Estados para Modal de Observación / Alertas (Clic en columna Observación)
  const [insumoObservacion, setInsumoObservacion] = useState(null);
  const [isObservacionModalOpen, setIsObservacionModalOpen] = useState(false);

  // Notificación flotante (toast)
  const [toastMessage, setToastMessage] = useState(null);

  const mostrarToast = (mensaje) => {
    setToastMessage(mensaje);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Cargar insumos desde el Backend (GET /api/insumos)
  const cargarInsumos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarInsumos();
      setInsumos(data);
    } catch (err) {
      console.error('Error al listar insumos:', err);
      setError('No se pudo conectar con el catálogo en el servidor (http://localhost:3000/api/insumos).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInsumos();
  }, []);

  // Manejador para agregar un insumo creado en el backend (POST /api/insumos)
  const handleGuardarInsumo = async (nuevo) => {
    const respuesta = await crearInsumo(nuevo);
    if (respuesta && respuesta.insumo) {
      setInsumos((prev) => [respuesta.insumo, ...prev]);
    } else {
      await cargarInsumos();
    }
    mostrarToast(`Insumo ${nuevo.codigoInterno} registrado exitosamente en la base de datos.`);
  };

  // Manejador para editar/actualizar un insumo en el backend (PUT /api/insumos/:id)
  const handleUpdateInsumo = async (insumoActualizado) => {
    await actualizarInsumo(insumoActualizado.idInsumo, insumoActualizado);
    setInsumos((prev) =>
      prev.map((item) =>
        item.idInsumo === insumoActualizado.idInsumo ? insumoActualizado : item
      )
    );
    if (insumoObservacion?.idInsumo === insumoActualizado.idInsumo) {
      setInsumoObservacion(insumoActualizado);
    }
    mostrarToast(`Insumo ${insumoActualizado.codigoInterno} actualizado exitosamente.`);
  };

  // Manejador para baja lógica de un insumo en el backend (PUT /api/insumos/:id/baja)
  const handleDeleteInsumo = async (idInsumo) => {
    const itemEncontrado = insumos.find((i) => i.idInsumo === idInsumo);
    await darDeBajaInsumo(idInsumo);
    setInsumos((prev) => prev.filter((item) => item.idInsumo !== idInsumo));
    mostrarToast(`Insumo ${itemEncontrado?.codigoInterno || ''} dado de baja con éxito.`);
  };

  // Manejador para exportar el catálogo oficial en PDF (PDFKit)
  const handleExportarPDF = async () => {
    setExportandoPDF(true);
    try {
      mostrarToast('Generando catálogo oficial de insumos en PDF...');
      await descargarInsumosPDF();
      mostrarToast('✓ Catálogo de insumos en PDF descargado con éxito.');
    } catch (err) {
      mostrarToast(`Error al exportar PDF: ${err.message}`);
    } finally {
      setExportandoPDF(false);
    }
  };

  // Cálculo dinámico del estado de observación para cada insumo
  const getObservacionInfo = (item) => {
    const isCritico = Number(item.stockActual) <= Number(item.stockSeguridad);
    const esPeriferico = (item.categoria || '').toLowerCase().startsWith('perif');
    let isProximoVencer = false;
    let isVencido = false;
    let diasRestantes = null;

    if (!esPeriferico && item.fechaVencimiento && item.fechaVencimiento !== '9999-12-31') {
      const fechaActual = new Date();
      const fechaVenc = new Date(item.fechaVencimiento);
      const diffTime = fechaVenc - fechaActual;
      diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diasRestantes < 0) {
        isVencido = true;
      } else if (diasRestantes <= 45) {
        isProximoVencer = true;
      }
    }

    if (isCritico && (isProximoVencer || isVencido)) {
      return {
        tipo: 'doble-alerta',
        label: isVencido ? 'Crítico / Vencido' : 'Stock Crítico / Vence pronto',
        botonTexto: 'Observar (2 Alertas)',
        clase: 'bg-rose-100 text-rose-700 hover:bg-rose-200/80 border-rose-300 ring-rose-200',
        icono: AlertTriangle,
        puntoPulsante: true
      };
    }

    if (isVencido) {
      return {
        tipo: 'vencido',
        label: 'Insumo Vencido',
        botonTexto: 'Observar Vencido',
        clase: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 ring-rose-100',
        icono: AlertCircle,
        puntoPulsante: true
      };
    }

    if (isCritico) {
      return {
        tipo: 'critico',
        label: 'Stock Crítico',
        botonTexto: 'Observar Stock',
        clase: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 ring-rose-100',
        icono: AlertTriangle,
        puntoPulsante: true
      };
    }

    if (isProximoVencer) {
      return {
        tipo: 'proximo',
        label: `Vence en ${diasRestantes}d`,
        botonTexto: `Observar (${diasRestantes}d)`,
        clase: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 ring-amber-100',
        icono: Clock,
        puntoPulsante: true
      };
    }

    return {
      tipo: 'optimo',
      label: 'Sin Observaciones',
      botonTexto: 'Observar',
      clase: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 ring-emerald-100',
      icono: CheckCircle2,
      puntoPulsante: false
    };
  };

  // Filtrado reactivo en frontend por código, descripción y categoría
  const insumosFiltrados = insumos.filter((item) => {
    const coincideTexto = 
      (item.codigoInterno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let coincideCategoria = true;
    if (categoriaFiltro === 'Insumo') {
      coincideCategoria = item.categoria === 'Insumo' || (!item.categoria?.toLowerCase().startsWith('perif'));
    } else if (categoriaFiltro === 'Periférico') {
      coincideCategoria = item.categoria === 'Periférico' || item.categoria?.toLowerCase().startsWith('perif');
    }

    return coincideTexto && coincideCategoria;
  });

  // Abrir modal de detalle por doble clic
  const handleFilaDoubleClick = (item) => {
    setInsumoSeleccionado(item);
    setIsDetalleModalOpen(true);
  };

  // 2. ZONA VISUAL
  return (
    <MainLayout activePage="insumos" pageTitle="Catálogos de Insumos">
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        
        {/* Encabezado de la Sección con botones de acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Conectado a MySQL (/api/insumos)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Catálogo de Insumos</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administre el inventario completo de activos y suministros institucionales con persistencia en base de datos.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={cargarInsumos}
              title="Refrescar catálogo"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            <button
              type="button"
              onClick={handleExportarPDF}
              disabled={exportandoPDF}
              title="Descargar catálogo oficial de insumos en PDF (PDFKit)"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Download size={15} className={exportandoPDF ? 'animate-spin text-blue-600' : ''} />
              <span>{exportandoPDF ? 'Exportando...' : 'Exportar PDF'}</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsModalNuevoOpen(true)}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shadow-blue-500/20 cursor-pointer"
              >
                <Plus size={16} />
                <span>Nuevo Insumo</span>
              </button>
            )}
          </div>
        </div>

        {/* Banner de Modo Auditoría Solo Lectura */}
        {isAuditor && <BannerAuditorReadOnly modulo="Catálogo de Insumos y Periféricos" />}

        {/* Notificación de Error con botón de reintentar */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={cargarInsumos}
              type="button"
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {/* Barra de Filtros y Buscador */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          {/* Input de búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código o descripción..."
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 focus:bg-white transition"
            />
          </div>

          {/* Filtro por Categoría y Contador */}
          <div className="flex items-center gap-3 justify-between md:justify-end flex-wrap">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-slate-400 hidden sm:block" />
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:border-blue-600 transition cursor-pointer"
              >
                <option value="Todas">Todas las Categorías</option>
                <option value="Insumo">Insumos (Consumibles)</option>
                <option value="Periférico">Periféricos (Hardware)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span>Mostrando:</span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                {insumosFiltrados.length} Items
              </span>
            </div>
          </div>
        </div>

        {/* Guía visual interactiva de doble clic */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/60 border border-blue-100 text-blue-800 rounded-xl text-xs">
          <Info size={15} className="text-blue-600 shrink-0" />
          <span>
            <strong>Gestión Integral:</strong> Presione <strong>doble clic</strong> en cualquier insumo para abrir su ficha técnica, <strong>modificar</strong> sus datos o <strong>darlo de baja</strong> en MySQL. Haga clic en <strong>Observar</strong> para verificar alertas preventivas.
          </span>
        </div>

        {/* Tabla Principal */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-slate-50/60 text-slate-400 uppercase font-semibold border-b border-slate-100 select-none">
                <tr>
                  <th className="py-4 px-6">Código</th>
                  <th className="py-4 px-6">Descripción</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6">Ubicación</th>
                  <th className="py-4 px-6">Stock Actual</th>
                  <th className="py-4 px-6 text-center">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <RefreshCw size={16} className="animate-spin text-blue-600" />
                        <span>Cargando insumos desde el servidor MySQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : insumosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
                          <Inbox size={28} />
                        </div>
                        <p className="text-xs font-semibold text-slate-500">No se encontraron insumos activos.</p>
                        <p className="text-[11px] text-slate-400 max-w-sm">
                          {searchTerm || categoriaFiltro !== 'Todas'
                            ? 'Pruebe modificando los términos de búsqueda o el filtro de categoría.'
                            : 'Utilice el botón "+ Nuevo Insumo" para registrar el primer artículo en la base de datos.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  insumosFiltrados.map((item) => {
                    const obs = getObservacionInfo(item);
                    const IconoObs = obs.icono;
                    const isCritico = Number(item.stockActual) <= Number(item.stockSeguridad);

                    return (
                      <tr 
                        key={item.idInsumo} 
                        onDoubleClick={() => handleFilaDoubleClick(item)}
                        className="hover:bg-blue-50/40 transition cursor-pointer select-none group"
                        title="Doble clic para editar datos o dar de baja este insumo"
                      >
                        {/* Código con formato de etiqueta */}
                        <td className="py-4 px-6 font-mono font-medium">
                          <span className="bg-slate-100 group-hover:bg-blue-100/70 text-slate-700 group-hover:text-blue-800 px-2 py-1 rounded text-[11px] font-bold transition">
                            {item.codigoInterno}
                          </span>
                        </td>

                        {/* Descripción */}
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {item.descripcion}
                        </td>

                        {/* Categoría */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Box size={14} className="text-slate-400" />
                            <span>{item.categoria}</span>
                          </div>
                        </td>

                        {/* Ubicación */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <MapPin size={14} className="text-blue-500" />
                            <span>
                              {item.ubicacionFila || 'Sin depósito'} {item.ubicacionColumna || ''}
                            </span>
                          </div>
                        </td>

                        {/* Stock Actual */}
                        <td className="py-4 px-6 font-medium">
                          <span className={`text-sm font-bold ${isCritico ? 'text-rose-600' : 'text-slate-800'}`}>
                            {item.stockActual}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-1">uds.</span>
                        </td>

                        {/* Columna Observación */}
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInsumoObservacion(item);
                              setIsObservacionModalOpen(true);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition shadow-2xs cursor-pointer ${obs.clase}`}
                            title="Presione para ver el aviso de observación técnica"
                          >
                            <IconoObs size={13} className="shrink-0" />
                            <span>{obs.botonTexto}</span>
                            {obs.puntoPulsante && (
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación al pie */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-1 select-none">
            <button type="button" className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="w-8 h-8 rounded-lg bg-blue-600 text-white font-semibold text-xs cursor-pointer">
              1
            </button>
            <button type="button" className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Footer Institucional */}
        <div className="text-center pt-4 pb-2 text-[11px] text-slate-400 tracking-wider">
          © 2026 TRIBUNAL ELECTORAL PERMANENTE
        </div>

      </div>

      {/* MODAL 1: Registrar Nuevo Insumo (POST /api/insumos) */}
      <ModalNuevoInsumo
        isOpen={isModalNuevoOpen}
        onClose={() => setIsModalNuevoOpen(false)}
        onSave={handleGuardarInsumo}
      />

      {/* MODAL 2: Ficha Detallada (Doble Clic) con Editar (PUT) y Baja Lógica (PUT :id/baja) */}
      <ModalDetalleInsumo
        isOpen={isDetalleModalOpen}
        insumo={insumoSeleccionado}
        readOnly={isAuditor}
        canDelete={isAdmin}
        onClose={() => {
          setIsDetalleModalOpen(false);
          setInsumoSeleccionado(null);
        }}
        onUpdate={handleUpdateInsumo}
        onDelete={handleDeleteInsumo}
      />

      {/* MODAL 3: Aviso Dinámico de Observación Técnica */}
      <ModalObservacion
        isOpen={isObservacionModalOpen}
        insumo={insumoObservacion}
        onClose={() => {
          setIsObservacionModalOpen(false);
          setInsumoObservacion(null);
        }}
        onVerDetalles={(item) => {
          setInsumoSeleccionado(item);
          setIsDetalleModalOpen(true);
        }}
      />

      {/* Toast de Notificación Flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span>{toastMessage}</span>
        </div>
      )}

    </MainLayout>
  );
}