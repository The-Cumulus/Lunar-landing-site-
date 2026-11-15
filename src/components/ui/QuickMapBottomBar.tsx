import React, { useState } from 'react';
import {
  RotateCcw,
  Navigation,
  Compass,
  AlertCircle,
  Eye
} from 'lucide-react';
import { QuickMapTelemetry } from '../../types/lunar';

interface QuickMapBottomBarProps {
  telemetry: QuickMapTelemetry | null;
  onGoToCoordinates: (lat: number, lng: number, altitudeMeters?: number) => void;
  onCenterMoon?: () => void;
  className?: string;
}

export const QuickMapBottomBar: React.FC<QuickMapBottomBarProps> = ({
  telemetry,
  onGoToCoordinates,
  onCenterMoon,
  className = ''
}) => {
  const [coordInput, setCoordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleParseAndGo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const raw = coordInput.trim();
    if (!raw) {
      setErrorMessage('Enter coordinates (e.g., 34.85892, 90.00000)');
      return;
    }

    // Replace directional suffixes or degrees
    // Handle formats like: "34.85892, 90.00000", "34.85892 90.00000", "34.85892N, 90.00000E", "-89.67, 129.78"
    let lat: number | null = null;
    let lng: number | null = null;

    const regexDMS = /([+-]?\d+(?:\.\d+)?)\s*°?\s*([NS])?[\s,;]+([+-]?\d+(?:\.\d+)?)\s*°?\s*([EW])?/i;
    const match = raw.match(regexDMS);

    if (match) {
      let latVal = parseFloat(match[1]);
      if (match[2] && match[2].toUpperCase() === 'S') latVal = -Math.abs(latVal);
      if (match[2] && match[2].toUpperCase() === 'N') latVal = Math.abs(latVal);

      let lngVal = parseFloat(match[3]);
      if (match[4] && match[4].toUpperCase() === 'W') lngVal = -Math.abs(lngVal);
      if (match[4] && match[4].toUpperCase() === 'E') lngVal = Math.abs(lngVal);

      lat = latVal;
      lng = lngVal;
    } else {
      const parts = raw.split(/[\s,;]+/).filter(Boolean);
      if (parts.length >= 2) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      setErrorMessage('Invalid coordinate format. Use: 34.85892, 90.00000');
      return;
    }

    if (lat < -90 || lat > 90) {
      setErrorMessage(`Latitude ${lat.toFixed(5)}° out of bounds (-90° to +90°)`);
      return;
    }

    if (lng < -180 || lng > 180) {
      setErrorMessage(`Longitude ${lng.toFixed(5)}° out of bounds (-180° to +180°)`);
      return;
    }

    setErrorMessage(null);
    onGoToCoordinates(lat, lng, 48000);
  };

  const latDisplay = telemetry ? telemetry.latFormatted : '+0.00000°';
  const lngDisplay = telemetry ? telemetry.lngFormatted : '+0.00000°';
  const resDisplay = telemetry ? telemetry.resolutionFormatted : '100.0 m/px';
  const elevDisplay = telemetry && telemetry.elevationMeters !== undefined
    ? `${telemetry.elevationMeters >= 0 ? '+' : ''}${Math.round(telemetry.elevationMeters).toLocaleString()} m`
    : '-1,750 m';
  const slopeDisplay = telemetry && telemetry.slopeDeg !== undefined
    ? `${telemetry.slopeDeg.toFixed(1)}°`
    : '2.4°';
  const roughnessDisplay = telemetry && telemetry.roughnessM !== undefined
    ? `${telemetry.roughnessM.toFixed(1)} m`
    : '18.2 m';

  return (
    <footer
      id="tutorial-bottom-bar"
      className={`fixed bottom-0 left-0 right-0 z-30 pointer-events-auto bg-[#030712]/90 border-t border-[#1E293B] backdrop-blur-xl text-slate-200 select-none shadow-2xl transition-all ${className}`}
      aria-label="LROC QuickMap Selenographic Telemetry Bar"
    >
      <div className="w-full px-3 sm:px-4 py-1 sm:py-1.5 flex items-center justify-between gap-2 text-xs font-mono overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Left Section: Selenographic Coordinates & Resolution (matching QuickMap bottom bar) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-nowrap">
          {/* LROC QuickMap branding badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#083344] border border-[#06B6D4]/50 text-[#22D3EE] text-[10px] font-bold tracking-wider shrink-0">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>LROC QUICKMAP HUD</span>
          </div>

          {/* Latitude */}
          <div className="flex items-center gap-1.5 bg-[#0B0F19]/90 px-2 py-0.5 rounded-lg border border-[#1E293B] shadow-inner shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LAT:</span>
            <span className="text-white font-bold font-mono tracking-tight text-[11px]">{latDisplay}</span>
          </div>

          {/* Longitude */}
          <div className="flex items-center gap-1.5 bg-[#0B0F19]/90 px-2 py-0.5 rounded-lg border border-[#1E293B] shadow-inner shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LON:</span>
            <span className="text-white font-bold font-mono tracking-tight text-[11px]">{lngDisplay}</span>
          </div>

          {/* Resolution (m/px) - LROC QuickMap specification */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0B0F19]/90 px-2 py-0.5 rounded-lg border border-cyan-500/30 text-cyan-300 shadow-inner shrink-0">
            <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/80">RES:</span>
            <span className="text-cyan-200 font-bold font-mono text-[11px]">{resDisplay}</span>
          </div>

          {/* LOLA Geodetic Elevation */}
          <div className="flex items-center gap-1.5 bg-[#0B0F19]/90 px-2 py-0.5 rounded-lg border border-purple-500/30 text-purple-300 shadow-inner shrink-0" title="LOLA Geodetic Elevation relative to 1737.4 km datum">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ELEV:</span>
            <span className="text-purple-200 font-bold font-mono text-[11px]">{elevDisplay}</span>
          </div>

          {/* LOLA Slope Gradient */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#0B0F19]/90 px-2 py-0.5 rounded-lg border border-cyan-500/30 text-cyan-300 shadow-inner shrink-0" title="LOLA Spatial Slope in degrees (Horn 8-pt gradient)">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SLOPE:</span>
            <span className="text-cyan-200 font-bold font-mono text-[11px]">{slopeDisplay}</span>
          </div>

          {/* LOLA Surface Roughness */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#0B0F19]/90 px-2 py-0.5 rounded-lg border border-amber-500/30 text-amber-300 shadow-inner shrink-0" title="RMS Surface Roughness Dispersion">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ROUGH:</span>
            <span className="text-amber-200 font-bold font-mono text-[11px]">{roughnessDisplay}</span>
          </div>

          {/* Center Moon button */}
          {onCenterMoon && (
            <button
              type="button"
              onClick={onCenterMoon}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#0B0F19]/90 border border-[#1E293B] hover:border-cyan-500/50 hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shrink-0 font-mono text-[11px]"
              title="Center Moon in Viewport (Reset Camera - Press C)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Center Moon</span>
            </button>
          )}
        </div>

        {/* Right Section: "Go to Coordinates" search input */}
        <div className="flex items-center gap-1.5 relative shrink-0">
          {errorMessage && (
            <div className="absolute -top-9 right-0 bg-rose-950/95 border border-rose-500/60 text-rose-200 text-[11px] px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleParseAndGo} className="flex items-center gap-1.5">
            <div className="relative">
              <input
                type="text"
                value={coordInput}
                onChange={(e) => {
                  setCoordInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Go to Lat, Lon (e.g. 34.85892, 90.00000)"
                className="w-44 sm:w-56 md:w-64 px-2 py-1 rounded-lg bg-[#0B0F19]/90 border border-[#1E293B] focus:border-cyan-400 focus:bg-space-950 text-white text-xs placeholder:text-slate-500 font-mono focus:outline-none transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-950/40 transition-all cursor-pointer shrink-0"
              title="Fly camera to entered coordinates"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GO</span>
            </button>
          </form>
        </div>

      </div>
    </footer>
  );
};
