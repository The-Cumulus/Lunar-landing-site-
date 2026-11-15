import React, { useEffect } from 'react';
import { CheckCircle2, Copy, MapPin, X } from 'lucide-react';

export interface ToastData {
  id?: string;
  title: string;
  coordinates: string;
  siteName?: string;
}

interface CoordinateCopyToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const CoordinateCopyToast: React.FC<CoordinateCopyToastProps> = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 2800);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <aside
      aria-label="Notification"
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto animate-bounce-in max-w-md w-[92%] sm:w-auto"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-space-900/95 border border-emerald-500/60 shadow-2xl backdrop-blur-2xl text-xs font-mono text-slate-100">
        <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>

        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <span>{toast.title}</span>
          </div>
          <div className="text-slate-200 font-semibold truncate text-[11px]">
            {toast.coordinates}
          </div>
          {toast.siteName && (
            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{toast.siteName}</span>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors shrink-0 ml-1"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
