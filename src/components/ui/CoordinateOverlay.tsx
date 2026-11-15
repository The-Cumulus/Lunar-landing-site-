import React, { useState } from 'react';
import { Crosshair, Copy, Check } from 'lucide-react';
import { LunarCoordinateHover } from '../../types/lunar';
import { formatCoordinatesDecimal } from '../../utils/coordinates';

interface CoordinateOverlayProps {
  hoverCoordinate: LunarCoordinateHover | null;
  clickedCoordinate?: { lat: number; lng: number } | null;
  selectedPOIName?: string;
  onResetView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  className?: string;
}

export const CoordinateOverlay: React.FC<CoordinateOverlayProps> = ({
  hoverCoordinate,
  className = ''
}) => {
  if (!hoverCoordinate) {
    return null;
  }

  const [copied, setCopied] = useState(false);
  const { lat, lng } = hoverCoordinate;

  const copyToClipboard = () => {
    const text = formatCoordinatesDecimal(lat, lng);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const latFormatted = (lat >= 0 ? '+' : '') + lat.toFixed(4) + '°';
  const lngFormatted = (lng >= 0 ? '+' : '') + lng.toFixed(4) + '°';

  return (
    <div
      className={`pointer-events-auto self-end inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-space-950/90 border border-slate-800/90 hover:border-cyan-500/50 backdrop-blur-xl shadow-xl text-xs font-mono transition-all animate-fadeIn ${className}`}
    >
      <div className="flex items-center gap-1.5 text-cyan-400 shrink-0">
        <Crosshair className="w-3.5 h-3.5 animate-pulse" />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-semibold">LAT:</span>
          <span className="text-white font-bold">{latFormatted}</span>
        </div>
        <span className="text-slate-600 font-bold">•</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-semibold">LNG:</span>
          <span className="text-white font-bold">{lngFormatted}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={copyToClipboard}
        className="p-1 rounded-md hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors ml-0.5 shrink-0 cursor-pointer"
        title="Copy coordinates (Lat, Lng)"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-cyan-400" />
        )}
      </button>
    </div>
  );
};
