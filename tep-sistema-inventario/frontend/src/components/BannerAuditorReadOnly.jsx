import { ShieldAlert, FileText, Lock } from 'lucide-react';

export default function BannerAuditorReadOnly({ modulo = '' }) {
  return (
    <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-4.5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in duration-200 select-none">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2.5 bg-amber-100/90 text-amber-800 rounded-xl shrink-0 border border-amber-300/60 shadow-2xs">
          <ShieldAlert size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900 text-xs sm:text-sm">
              Perfil de Auditoría — Modo de Solo Lectura
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300/80">
              <Lock size={10} />
              Fiscalización
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-amber-800/90 mt-0.5 leading-relaxed">
            Cuenta con permisos institucionales de visualización y descarga de reportes oficiales en PDF{modulo ? ` para ${modulo}` : ''}. Las acciones de registro, modificación y baja están restringidas a los perfiles operativo y administrativo.
          </p>
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-amber-200 rounded-xl text-[11px] font-semibold text-amber-900 shrink-0">
        <FileText size={13} className="text-amber-700" />
        <span>Reportes habilitados</span>
      </div>
    </div>
  );
}
