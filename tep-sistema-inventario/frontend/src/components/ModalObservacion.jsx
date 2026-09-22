import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Box, 
  Layers, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function ModalObservacion({ 
  isOpen, 
  insumo, 
  onClose,
  onVerDetalles
}) {
  if (!isOpen || !insumo) return null;

  // 1. Análisis dinámico de Stock
  const stockActual = Number(insumo.stockActual ?? 0);
  const stockSeguridad = Number(insumo.stockSeguridad ?? 0);
  const isStockCritico = stockActual <= stockSeguridad;

  // 2. Análisis dinámico de Vencimiento (Sólo para consumibles no periféricos)
  const esPeriferico = (insumo.categoria || '').toLowerCase().startsWith('perif');
  let vencimientoInfo = null;
  if (!esPeriferico && insumo.fechaVencimiento && insumo.fechaVencimiento !== '9999-12-31') {
    const fechaActual = new Date();
    const fechaVenc = new Date(insumo.fechaVencimiento);
    const diffTime = fechaVenc - fechaActual;
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      vencimientoInfo = {
        estado: 'vencido',
        dias: Math.abs(diffDias),
        mensaje: `El producto se encuentra vencido desde hace ${Math.abs(diffDias)} días (${insumo.fechaVencimiento}).`,
        color: 'rose'
      };
    } else if (diffDias <= 45) {
      vencimientoInfo = {
        estado: 'proximo',
        dias: diffDias,
        mensaje: `El insumo está por vencer en ${diffDias} días (${insumo.fechaVencimiento}).`,
        color: 'amber'
      };
    } else {
      vencimientoInfo = {
        estado: 'vigente',
        dias: diffDias,
        mensaje: `Fecha de caducidad vigente hasta el ${insumo.fechaVencimiento} (quedan ${diffDias} días).`,
        color: 'emerald'
      };
    }
  }

  // Tiene alertas críticas o preventivas activas?
  const tieneAlertas = isStockCritico || (vencimientoInfo && vencimientoInfo.estado !== 'vigente');

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          tieneAlertas 
            ? 'bg-amber-50/70 border-amber-100' 
            : 'bg-slate-50/70 border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              tieneAlertas 
                ? 'bg-amber-500/15 text-amber-700' 
                : 'bg-emerald-500/15 text-emerald-700'
            }`}>
              {tieneAlertas ? <ShieldAlert size={22} /> : <CheckCircle2 size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Aviso de Observación Técnica
                </h3>
                <span className="bg-white/80 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                  {insumo.codigoInterno}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Diagnóstico en tiempo real del insumo seleccionado
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* CUERPO DEL AVISO */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Identificación del Insumo */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">{insumo.descripcion}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="flex items-center gap-1"><Layers size={12} /> {insumo.categoria}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {insumo.ubicacionFila || 'Sin depósito'}</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
              {insumo.codigoInterno}
            </span>
          </div>

          {/* TARJETA 1: Diagnóstico de Stock */}
          {isStockCritico ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-rose-800">¡Alerta de Stock Crítico!</h4>
                  <span className="bg-rose-200/80 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                    Urgente
                  </span>
                </div>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                  Actualmente quedan <strong>{stockActual} unidades</strong>, encontrándose por debajo o igual al umbral mínimo de seguridad estipulado (<strong>{stockSeguridad} unidades</strong>).
                </p>
                <div className="mt-2 text-[11px] font-medium text-rose-800 bg-rose-100/60 px-2.5 py-1 rounded-lg inline-block">
                  💡 Acción sugerida: Iniciar solicitud de pedido de reposición interna.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shrink-0 mt-0.5">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-800">Stock en Rango Óptimo</h4>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  El inventario cuenta con <strong>{stockActual} unidades</strong> en existencia (mínimo de seguridad: {stockSeguridad} unidades). No se requiere reabastecimiento en este momento.
                </p>
              </div>
            </div>
          )}

          {/* TARJETA 2: Diagnóstico de Vencimiento / Caducidad */}
          {vencimientoInfo && (
            vencimientoInfo.estado === 'vencido' ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-800">Insumo Vencido</h4>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    {vencimientoInfo.mensaje} No debe ser despachado a los departamentos sin previa inspección técnica.
                  </p>
                </div>
              </div>
            ) : vencimientoInfo.estado === 'proximo' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shrink-0 mt-0.5">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-amber-800">¡Próximo a Vencer!</h4>
                    <span className="bg-amber-200/80 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      {vencimientoInfo.dias} días restantes
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Este insumo tiene fijada su fecha de caducidad o garantía para el <strong>{insumo.fechaVencimiento}</strong>.
                  </p>
                  <div className="mt-2 text-[11px] font-medium text-amber-800 bg-amber-100/60 px-2.5 py-1 rounded-lg inline-block">
                    💡 Acción sugerida: Dar prioridad de salida o coordinar mantenimiento.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-700">Vigencia Garantizada</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {vencimientoInfo.mensaje}
                  </p>
                </div>
              </div>
            )
          )}

          {!vencimientoInfo && (
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-slate-200 text-slate-600 rounded-xl shrink-0">
                <Box size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-700">
                  {esPeriferico ? 'Periférico Informático (Hardware)' : 'Bien de Consumo / Uso Continuo'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {esPeriferico
                    ? 'Los periféricos no cuentan con fecha de caducidad perecedera (valor nulo reglamentario).'
                    : 'No posee fecha de vencimiento perecedera registrada.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PIE DE ACCIONES */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            Entendido
          </button>
          {onVerDetalles && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onVerDetalles(insumo);
              }}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Ficha Completa y Editar</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
