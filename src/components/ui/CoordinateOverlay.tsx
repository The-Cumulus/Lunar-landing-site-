import React, { useState } from 'react';
import {
  Copy,
  Check,
  MapPin,
  Crosshair,
  RotateCcw,
  Plus,
  Minus
} from 'lucide-react';
import { LunarCoordinateHover } from '../../types/lunar';
import { formatCoordinatesDMS, formatCoordinatesDecimal } from '../../utils/coordinates';
import { LUNAR_LANDMARKS } from '../../data/lunarPOIs';

interface CoordinateOverlayProps {
  hoverCoordinate: LunarCoordinateHover | null;
  clickedCoordinate: { lat: number; lng: number } | null;
  selectedPOIName?: string;
  onResetView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  className?: string;
}

export const CoordinateOverlay: React.FC<CoordinateOverlayProps> = ({
  hoverCoordinate,
  clickedCoordinate,
  selectedPOIName,
  onResetView,
  onZoomIn,
  onZoomOut,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  // Active coordinates: prioritize live hover raycast; when cursor is in space, strictly reset to zero (0, 0)
  const activeCoord = hoverCoordinate ? { lat: hoverCoordinate.lat, lng: hoverCoordinate.lng } : { lat: 0, lng: 0 };
  const isTracking = Boolean(hoverCoordinate);

  // Detect nearest lunar landmark
  const findNearestLandmark = (lat: number, lng: number): string => {
    let nearest = 'Lunar Highland Regolith';
    let minDistance = 999;

    for (const lm of LUNAR_LANDMARKS) {
      const dLat = lat - lm.lat;
      const dLng = lng - lm.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < lm.radius && dist < minDistance) {
        minDistance = dist;
        nearest = lm.name;
      }
    }
    return nearest;
  };

  const landmark = findNearestLandmark(activeCoord.lat, activeCoord.lng);
  const isNearside = Math.abs(activeCoord.lng) <= 90;
  const isNorthern = activeCoord.lat >= 0;

  const copyToClipboard = () => {
    const text = `${formatCoordinatesDecimal(activeCoord.lat, activeCoord.lng)} (${formatCoordinatesDMS(activeCoord.lat, activeCoord.lng)})`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`pointer-events-auto shrink-0 rounded-2xl bg-space-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl p-3 sm:p-4 text-xs font-mono w-full ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-2 mb-2.5">
        {/* Tracking Status indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTracking ? 'bg-cyan-400' : 'bg-slate-500'
                }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isTracking ? 'bg-cyan-500' : 'bg-slate-600'
                }`}
            />
          </span>
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300 truncate">
            {isTracking
              ? (hoverCoordinate?.siteName ? `SITE: ${hoverCoordinate.siteName.toUpperCase()}` : 'SURFACE RAYCAST TRACKER')
              : 'STANDBY (CURSOR ON MOON)'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom In & Out Controls */}
          {onZoomIn && onZoomOut && (
            <div className="flex items-center bg-space-950/80 rounded-lg p-0.5 border border-cyan-500/30">
              <button
                onClick={onZoomIn}
                className="p-1 rounded hover:bg-cyan-950/80 hover:text-cyan-300 text-slate-300 transition-colors"
                title="Zoom In (or scroll wheel / '+')"
              >
                <Plus className="w-3 h-3 text-cyan-400" />
              </button>
              <div className="w-px h-3 bg-slate-800" />
              <button
                onClick={onZoomOut}
                className="p-1 rounded hover:bg-cyan-950/80 hover:text-cyan-300 text-slate-300 transition-colors"
                title="Zoom Out (or scroll wheel / '-')"
              >
                <Minus className="w-3 h-3 text-cyan-400" />
              </button>
            </div>
          )}

          {/* Center Moon Button */}
          {onResetView && (
            <button
              onClick={onResetView}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-space-950/80 hover:bg-slate-800/80 text-cyan-300 hover:text-white border border-cyan-500/30 transition-all text-[10px]"
              title="Re-center camera directly on the Moon (Press C)"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Center Moon</span>
            </button>
          )}

          {/* Copy Coordinates Button */}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-space-950/80 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800 transition-all text-[10px]"
            title="Copy coordinates to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-cyan-400" />
                <span>Copy Lat/Lng</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Coordinate Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
        {/* Decimal Coordinates */}
        <div className="p-2 rounded-xl bg-space-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              Decimal Degrees
            </span>
            <span className="text-cyan-400 text-[9px]">WGS-Lunar</span>
          </div>
          <div className="text-sm font-bold text-white tracking-wide truncate">
            {formatCoordinatesDecimal(activeCoord.lat, activeCoord.lng)}
          </div>
        </div>

        {/* DMS (Degrees Minutes Seconds) */}
        <div className="p-2 rounded-xl bg-space-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-between">
            <span>Standard DMS</span>
            <span className="text-amber-400 text-[9px]">Navigation</span>
          </div>
          <div className="text-sm font-bold text-amber-200 tracking-tight truncate">
            {formatCoordinatesDMS(activeCoord.lat, activeCoord.lng)}
          </div>
        </div>
      </div>

      {/* Real Scientific LOLA Terrain Metrics: Constant Fixed-Height Row */}
      <div className="grid grid-cols-3 gap-2 mb-2.5 p-2 rounded-xl bg-cyan-950/25 border border-cyan-800/50">
        <div className="min-w-0">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider truncate">LOLA Elevation</div>
          <div className="text-xs font-bold text-cyan-300 font-mono truncate">
            {hoverCoordinate?.elevationMeters !== undefined
              ? (hoverCoordinate.elevationMeters > 0 ? `+${hoverCoordinate.elevationMeters.toLocaleString()} m` : `${hoverCoordinate.elevationMeters.toLocaleString()} m`)
              : (isTracking ? 'Measuring...' : '-- m')}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider truncate">Surface Slope</div>
          <div className="text-xs font-bold text-amber-300 font-mono truncate">
            {hoverCoordinate?.slopeDeg !== undefined ? `${hoverCoordinate.slopeDeg}°` : (isTracking ? 'Calculating...' : '--°')}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider truncate">Terrain Class</div>
          <div
            className={`text-xs font-bold truncate font-mono ${hoverCoordinate?.terrainClass?.includes('Basin')
                ? 'text-purple-300'
                : hoverCoordinate?.terrainClass?.includes('Lowland') || hoverCoordinate?.terrainClass?.includes('Mare')
                  ? 'text-cyan-300'
                  : hoverCoordinate?.terrainClass?.includes('Intermediate')
                    ? 'text-emerald-300'
                    : hoverCoordinate?.terrainClass?.includes('Highland') || hoverCoordinate?.terrainClass?.includes('Peak')
                      ? 'text-amber-300'
                      : 'text-emerald-300'
              }`}
            title={hoverCoordinate?.terrainClass || (isTracking ? 'Highland Regolith' : 'Lunar Surface')}
          >
            {hoverCoordinate?.terrainClass || (isTracking ? 'Highland Regolith' : '--')}
          </div>
        </div>
      </div>

      {/* Region & Hemisphere Badges */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/40">
        <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate" title={hoverCoordinate?.siteName || landmark}>
            {hoverCoordinate?.siteName || landmark}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-slate-300 whitespace-nowrap text-[9px]">
            {isNearside ? 'Nearside' : 'Far Side'}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-slate-300 whitespace-nowrap text-[9px]">
            {isNorthern ? 'North' : 'South'}
          </span>
        </div>
      </div>
    </div>
  );
};
