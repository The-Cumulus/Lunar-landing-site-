import React, { useState, useEffect, useRef } from 'react';
import { 
  Crosshair, 
  Copy, 
  Check, 
  Navigation, 
  Compass, 
  MapPin, 
  X, 
  Gauge, 
  Share2, 
  Sparkles,
  Mountain
} from 'lucide-react';
import { 
  copyToClipboard, 
  formatCoordinatesDecimal, 
  formatCoordinatesDecorated, 
  formatCoordinatesDMS, 
  formatCoordinatesGeoJSON 
} from '../../utils/clipboard';

export interface CoordinateContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  lat: number;
  lng: number;
  siteName?: string;
  elevationMeters?: number;
  onClose: () => void;
  onFlyTo?: (lat: number, lng: number) => void;
  onEvaluateMission?: (lat: number, lng: number, siteName?: string) => void;
}

export const CoordinateContextMenu: React.FC<CoordinateContextMenuProps> = ({
  isOpen,
  x,
  y,
  lat,
  lng,
  siteName,
  elevationMeters,
  onClose,
  onFlyTo,
  onEvaluateMission
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-close on escape key or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 150);
    window.addEventListener('wheel', onClose, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('wheel', onClose);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const decimalText = formatCoordinatesDecimal(lat, lng, 5);
  const decoratedText = formatCoordinatesDecorated(lat, lng, 5);
  const dmsText = formatCoordinatesDMS(lat, lng);
  const geojsonText = formatCoordinatesGeoJSON(lat, lng, 5);

  const handleCopy = async (text: string, formatId: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedFormat(formatId);
      setTimeout(() => setCopiedFormat(null), 1600);
    }
  };

  // Clamp popup position so it doesn't overflow viewport
  const menuWidth = 320;
  const menuHeight = 360;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

  const clampedX = Math.max(12, Math.min(x, windowWidth - menuWidth - 16));
  const clampedY = Math.max(12, Math.min(y, windowHeight - menuHeight - 16));

  return (
    <div
      ref={menuRef}
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
      className="fixed z-50 w-80 rounded-2xl bg-space-900/95 border border-cyan-500/50 shadow-2xl backdrop-blur-2xl text-slate-100 font-mono animate-fadeIn select-none overflow-hidden"
    >
      {/* Top Banner */}
      <div className="p-3.5 border-b border-slate-800/80 bg-gradient-to-r from-cyan-950/60 to-space-950/80 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Selenographic Coordinates</span>
            </div>
            <div className="text-xs font-bold text-white truncate max-w-[200px]" title={siteName || 'Lunar Surface Location'}>
              {siteName || 'Lunar Surface Target'}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Close Menu (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Target Readout Strip */}
      <div className="px-3.5 py-2 bg-space-950/60 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">LAT:</span>
          <span className="font-bold text-cyan-300">{lat >= 0 ? `+${lat.toFixed(5)}°` : `${lat.toFixed(5)}°`}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">LON:</span>
          <span className="font-bold text-cyan-300">{lng >= 0 ? `+${lng.toFixed(5)}°` : `${lng.toFixed(5)}°`}</span>
        </div>
        {elevationMeters !== undefined && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
            <Mountain className="w-3 h-3" />
            <span>{Math.round(elevationMeters)}m</span>
          </div>
        )}
      </div>

      {/* Copy Options List */}
      <div className="p-3 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Click to Copy Format
        </div>

        {/* 1. Standard Decimal (Lat, Lon) */}
        <button
          type="button"
          onClick={() => handleCopy(decimalText, 'decimal')}
          className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between group ${
            copiedFormat === 'decimal'
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20'
              : 'bg-space-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-200'
          }`}
        >
          <div className="min-w-0 pr-2">
            <div className="text-[10px] text-slate-400 uppercase">Standard (Lat, Lon)</div>
            <div className="text-xs font-bold text-slate-100 truncate">{decimalText}</div>
          </div>
          <div className="shrink-0 p-1 rounded-lg">
            {copiedFormat === 'decimal' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                <Check className="w-3.5 h-3.5" />
                Copied!
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            )}
          </div>
        </button>

        {/* 2. Decorated Directional (e.g. 0.67408° N, 23.47297° E) */}
        <button
          type="button"
          onClick={() => handleCopy(decoratedText, 'decorated')}
          className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between group ${
            copiedFormat === 'decorated'
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20'
              : 'bg-space-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-200'
          }`}
        >
          <div className="min-w-0 pr-2">
            <div className="text-[10px] text-slate-400 uppercase">Directional Deg (N/S, E/W)</div>
            <div className="text-xs font-bold text-slate-100 truncate">{decoratedText}</div>
          </div>
          <div className="shrink-0 p-1 rounded-lg">
            {copiedFormat === 'decorated' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                <Check className="w-3.5 h-3.5" />
                Copied!
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            )}
          </div>
        </button>

        {/* 3. DMS Format (Degrees Minutes Seconds) */}
        <button
          type="button"
          onClick={() => handleCopy(dmsText, 'dms')}
          className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between group ${
            copiedFormat === 'dms'
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20'
              : 'bg-space-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-200'
          }`}
        >
          <div className="min-w-0 pr-2">
            <div className="text-[10px] text-slate-400 uppercase">DMS Format</div>
            <div className="text-xs font-bold text-slate-100 truncate">{dmsText}</div>
          </div>
          <div className="shrink-0 p-1 rounded-lg">
            {copiedFormat === 'dms' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                <Check className="w-3.5 h-3.5" />
                Copied!
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            )}
          </div>
        </button>

        {/* 4. GeoJSON Coordinates [Lon, Lat] */}
        <button
          type="button"
          onClick={() => handleCopy(geojsonText, 'geojson')}
          className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between group ${
            copiedFormat === 'geojson'
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20'
              : 'bg-space-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-200'
          }`}
        >
          <div className="min-w-0 pr-2">
            <div className="text-[10px] text-slate-400 uppercase">GeoJSON [Lon, Lat]</div>
            <div className="text-xs font-bold text-slate-100 truncate">{geojsonText}</div>
          </div>
          <div className="shrink-0 p-1 rounded-lg">
            {copiedFormat === 'geojson' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                <Check className="w-3.5 h-3.5" />
                Copied!
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            )}
          </div>
        </button>
      </div>

      {/* Action Footer */}
      <div className="p-2.5 bg-space-950/90 border-t border-slate-800/80 flex items-center gap-2">
        {onFlyTo && (
          <button
            type="button"
            onClick={() => {
              onFlyTo(lat, lng);
              onClose();
            }}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-3 h-3" />
            Fly Here
          </button>
        )}

        {onEvaluateMission && (
          <button
            type="button"
            onClick={() => {
              onEvaluateMission(lat, lng, siteName);
              onClose();
            }}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Gauge className="w-3 h-3" />
            Evaluate Site
          </button>
        )}
      </div>
    </div>
  );
};
