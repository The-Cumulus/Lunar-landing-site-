import React, { useRef, useState } from 'react';
import { MapPin, Navigation, Info, Crosshair } from 'lucide-react';
import { formatCoordinatesDecimal } from '../../utils/coordinates';

interface LunarComparatorMapProps {
  site1: { name: string; lat: number; lng: number };
  site2: { name: string; lat: number; lng: number };
  distanceKm: number;
  onSelectCoordinate?: (lat: number, lng: number, target: 'site1' | 'site2') => void;
  activeTargetSite?: 'site1' | 'site2';
  onChangeActiveTarget?: (target: 'site1' | 'site2') => void;
}

export const LunarComparatorMap: React.FC<LunarComparatorMapProps> = ({
  site1,
  site2,
  distanceKm,
  onSelectCoordinate,
  activeTargetSite = 'site1',
  onChangeActiveTarget
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredSite, setHoveredSite] = useState<'site1' | 'site2' | null>(null);

  // Convert (lat, lng) to map percentage (0% to 100%)
  // Lng [-180, 180] -> [0%, 100%]
  // Lat [90, -90] -> [0%, 100%] (North is top, South is bottom)
  const getCoordsPercent = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const p1 = getCoordsPercent(site1.lat, site1.lng);
  const p2 = getCoordsPercent(site2.lat, site2.lng);

  // Midpoint for distance badge
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onSelectCoordinate) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const u = Math.max(0, Math.min(1, clickX / rect.width));
    const v = Math.max(0, Math.min(1, clickY / rect.height));

    const lng = Number((u * 360 - 180).toFixed(4));
    const lat = Number(((1 - v) * 180 - 90).toFixed(4));

    onSelectCoordinate(lat, lng, activeTargetSite);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Map Control Bar */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-semibold uppercase text-[10px] tracking-wider">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            Global Equirectangular Surface Projection
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            (Click map to position marker)
          </span>
        </div>

        {onSelectCoordinate && onChangeActiveTarget && (
          <div className="flex items-center gap-1 bg-space-950/80 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <span className="text-slate-400 px-1.5">Click sets:</span>
            <button
              onClick={() => onChangeActiveTarget('site1')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                activeTargetSite === 'site1'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Site 01
            </button>
            <button
              onClick={() => onChangeActiveTarget('site2')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                activeTargetSite === 'site2'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Site 02
            </button>
          </div>
        )}
      </div>

      {/* Map Display Container */}
      <div
        ref={containerRef}
        onClick={handleMapClick}
        className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-slate-800 bg-space-950 shadow-2xl cursor-crosshair group select-none"
        style={{
          backgroundImage: `url('/textures/moon_map.jpg'), url('/textures/moon_bump.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Subtle dark tint & graticule grid lines */}
        <div className="absolute inset-0 bg-space-950/35 pointer-events-none" />

        {/* Meridian & Equator cross lines */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-cyan-400/25 border-t border-dashed border-cyan-400/40 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-cyan-400/25 border-l border-dashed border-cyan-400/40 pointer-events-none" />

        {/* Nearside Boundary Lines (-90° and +90°) */}
        <div className="absolute inset-y-0 left-1/4 -translate-x-1/2 w-px border-l border-dotted border-slate-600/40 pointer-events-none" />
        <div className="absolute inset-y-0 left-3/4 -translate-x-1/2 w-px border-l border-dotted border-slate-600/40 pointer-events-none" />

        {/* Hemisphere Corner Watermarks */}
        <div className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500/80 pointer-events-none">
          Far Side West (-180°)
        </div>
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-300/80 pointer-events-none bg-space-950/60 px-1 rounded">
          Nearside Central (0° Prime Meridian)
        </div>
        <div className="absolute top-1.5 right-2 text-[9px] font-mono text-slate-500/80 pointer-events-none">
          Far Side East (+180°)
        </div>
        <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-emerald-400/70 pointer-events-none bg-space-950/60 px-1 rounded">
          South Polar Region (-90°)
        </div>

        {/* SVG Geodesic Line connecting Site 01 and Site 02 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <line
            x1={`${p1.x}%`}
            y1={`${p1.y}%`}
            x2={`${p2.x}%`}
            y2={`${p2.y}%`}
            stroke="rgba(168, 85, 247, 0.75)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        </svg>

        {/* Distance Badge floating at line midpoint */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${midX}%`, top: `${midY}%` }}
        >
          <div className="px-2 py-0.5 rounded-full bg-space-950/90 border border-purple-500/60 shadow-lg text-[9px] font-mono text-purple-200 font-bold whitespace-nowrap flex items-center gap-1 backdrop-blur-md">
            <Navigation className="w-2.5 h-2.5 text-purple-400" />
            <span>{distanceKm.toLocaleString()} km</span>
          </div>
        </div>

        {/* ================= SITE 01 MARKER (CYAN) ================= */}
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 group/m1 cursor-pointer"
          style={{ left: `${p1.x}%`, top: `${p1.y}%` }}
          onMouseEnter={() => setHoveredSite('site1')}
          onMouseLeave={() => setHoveredSite(null)}
          onClick={(e) => {
            e.stopPropagation();
            onChangeActiveTarget?.('site1');
          }}
        >
          {/* Radar Ping Rings */}
          <span className="absolute -inset-2 rounded-full bg-cyan-400/30 animate-ping opacity-75" />
          <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-space-950 font-bold shadow-lg shadow-cyan-500/50 border-2 border-white text-[10px]">
            1
          </div>

          {/* Hover / Persistent Card */}
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-space-950/95 border border-cyan-500/80 shadow-2xl backdrop-blur-md text-[10px] font-mono whitespace-nowrap transition-all duration-200 pointer-events-none z-40 ${
              hoveredSite === 'site1' ? 'opacity-100 scale-100' : 'opacity-90 scale-95'
            }`}
          >
            <div className="text-cyan-300 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{site1.name || 'Site 01'}</span>
            </div>
            <div className="text-slate-300 text-[9px]">
              {formatCoordinatesDecimal(site1.lat, site1.lng)}
            </div>
          </div>
        </div>

        {/* ================= SITE 02 MARKER (AMBER) ================= */}
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 group/m2 cursor-pointer"
          style={{ left: `${p2.x}%`, top: `${p2.y}%` }}
          onMouseEnter={() => setHoveredSite('site2')}
          onMouseLeave={() => setHoveredSite(null)}
          onClick={(e) => {
            e.stopPropagation();
            onChangeActiveTarget?.('site2');
          }}
        >
          {/* Radar Ping Rings */}
          <span className="absolute -inset-2 rounded-full bg-amber-400/30 animate-ping opacity-75" />
          <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-space-950 font-bold shadow-lg shadow-amber-500/50 border-2 border-white text-[10px]">
            2
          </div>

          {/* Hover / Persistent Card */}
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-space-950/95 border border-amber-500/80 shadow-2xl backdrop-blur-md text-[10px] font-mono whitespace-nowrap transition-all duration-200 pointer-events-none z-40 ${
              hoveredSite === 'site2' ? 'opacity-100 scale-100' : 'opacity-90 scale-95'
            }`}
          >
            <div className="text-amber-300 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{site2.name || 'Site 02'}</span>
            </div>
            <div className="text-slate-300 text-[9px]">
              {formatCoordinatesDecimal(site2.lat, site2.lng)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
