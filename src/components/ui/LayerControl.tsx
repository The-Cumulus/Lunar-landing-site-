import React, { useState, useRef } from 'react';
import {
  Layers,
  Map as MapIcon,
  Mountain,
  Eye,
  Grid3X3,
  MapPin,
  RotateCw,
  Sun,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { BasemapType, ElevationCategory } from '../../types/lunar';
import { LUNAR_BASEMAP_LAYERS } from '../../data/lunarPOIs';

// Precise interpolation matching the LOLA piece-wise shader spectrum
function getLOLAColorHex(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const stops = [
    { t: 0.00, r: 46, g: 5, b: 84 },     // -9150m Deep SPA Basin
    { t: 0.16, r: 10, g: 132, b: 227 },  // -6000m Deep Blue
    { t: 0.31, r: 0, g: 207, b: 201 },   // -3000m Basalt Cyan
    { t: 0.46, r: 107, g: 176, b: 77 },  // 0m Datum Green
    { t: 0.58, r: 242, g: 196, b: 16 },  // +2400m Highland Gold
    { t: 0.78, r: 232, g: 77, b: 61 },   // +6300m Mountain Red
    { t: 1.00, r: 255, g: 255, b: 255 }, // +10760m Highest Peak White
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].t && clamped <= stops[i + 1].t) {
      const localT = (clamped - stops[i].t) / (stops[i + 1].t - stops[i].t);
      const r = Math.round(stops[i].r + (stops[i + 1].r - stops[i].r) * localT);
      const g = Math.round(stops[i].g + (stops[i + 1].g - stops[i].g) * localT);
      const b = Math.round(stops[i].b + (stops[i + 1].b - stops[i].b) * localT);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
  }
  return '#ffffff';
}

function getElevationFromRatio(ratio: number): number {
  return Math.round(-9150 + ratio * 19910);
}

function getRatioFromElevation(elev: number): number {
  return Math.max(0, Math.min(1, (elev - (-9150)) / 19910));
}

function getGeomorphicLabel(elev: number): string {
  if (elev < -5000) return 'Deep Basin Depressions';
  if (elev < -2000) return 'Maria Flood Basalts';
  if (elev < 0) return 'Mare Margin Lowlands';
  if (elev < 2500) return 'Intermediate Plains';
  if (elev < 6500) return 'Highland Massifs';
  return 'Highest Mountain Peaks';
}

interface LayerControlProps {
  className?: string;
  activeBasemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
  continuousTargetElev?: number | null;
  onContinuousElevationChange?: (elevation: number | null) => void;
  continuousWindowM?: number;
  onContinuousWindowChange?: (windowM: number) => void;
  elevationCategory?: ElevationCategory;
  onSelectElevationCategory?: (category: ElevationCategory) => void;
  showGraticule: boolean;
  onToggleGraticule: () => void;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  enableSunShade: boolean;
  onToggleSunShade: () => void;
  isBumpActive?: boolean;
  onToggleBump?: () => void;
  onCollapseToSide?: () => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  className = '',
  activeBasemap,
  onBasemapChange,
  continuousTargetElev,
  onContinuousElevationChange,
  continuousWindowM = 1800,
  onContinuousWindowChange,
  elevationCategory = 'all',
  onSelectElevationCategory,
  showGraticule,
  onToggleGraticule,
  showMarkers,
  onToggleMarkers,
  autoRotate,
  onToggleAutoRotate,
  enableSunShade,
  onToggleSunShade,
  isBumpActive = true,
  onToggleBump,
  onCollapseToSide
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  const isFilterActive = typeof continuousTargetElev === 'number';
  const effectiveRatio = isFilterActive
    ? getRatioFromElevation(continuousTargetElev as number)
    : (hoverRatio ?? 0.46);
  const activeElevation = isFilterActive
    ? (continuousTargetElev as number)
    : getElevationFromRatio(effectiveRatio);
  const activeHex = getLOLAColorHex(effectiveRatio);
  const activePercent = (effectiveRatio * 100).toFixed(1);

  const updateElevationFromClientX = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const elev = getElevationFromRatio(ratio);
    onContinuousElevationChange?.(elev);
  };

  const getBasemapIcon = (id: BasemapType) => {
    switch (id) {
      case 'natural':
        return <Eye className="w-4 h-4 text-slate-300" />;
      case 'topographic':
        return <Mountain className="w-4 h-4 text-emerald-400" />;
      case 'shaded-relief':
        return <MapIcon className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className={className || "w-full pointer-events-auto"}>
      <div className="rounded-2xl bg-space-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* Panel Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3.5 flex items-center justify-between cursor-pointer border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/50 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Basemap & Overlays
              </h3>
              <p className="text-[10px] text-slate-400">
                {LUNAR_BASEMAP_LAYERS.find(b => b.id === activeBasemap)?.shortName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onCollapseToSide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCollapseToSide();
                }}
                className="p-1.5 rounded-lg bg-space-950/70 hover:bg-cyan-950/80 text-cyan-400 hover:text-white border border-slate-800 hover:border-cyan-500/50 transition-all flex items-center justify-center"
                title="Hide left toolbar to side (or press '[')"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <button className="text-slate-400 hover:text-white p-1">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3.5 space-y-4">
            {/* Basemap Options */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                Lunar Basemap Layer
              </label>
              <div className="space-y-1.5">
                {LUNAR_BASEMAP_LAYERS.map(layer => {
                  const isActive = activeBasemap === layer.id;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => onBasemapChange(layer.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 flex items-start gap-2.5 ${isActive
                          ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950/50 text-white'
                          : 'bg-space-950/50 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-space-950/80'
                        }`}
                    >
                      <div className="mt-0.5">{getBasemapIcon(layer.id)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold font-mono">{layer.name}</span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          {layer.description}
                        </p>
                        <span className="inline-block mt-1 text-[9px] font-mono text-cyan-300/80">
                          {layer.instrument}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LOLA Elevation Ramp: Continuous Color Filter with Cursor Scrubbing */}
            {activeBasemap === 'topographic' && (
              <div className="p-3 rounded-xl bg-space-950/85 border border-slate-800/90 space-y-2.5 animate-fadeIn">
                {/* Status Header: Color swatch, Elevation Readout & Show All Button */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  {isFilterActive ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/80 shadow-sm"
                        style={{ backgroundColor: activeHex }}
                      />
                      <div className="truncate font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="text-cyan-300">
                          {activeElevation > 0 ? `+${activeElevation.toLocaleString()}` : activeElevation.toLocaleString()} m
                        </span>
                        <span className="text-slate-400 font-normal text-[9px] truncate">
                          ({getGeomorphicLabel(activeElevation)})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="font-bold text-slate-200">Full Elevation Spectrum</span>
                    </div>
                  )}

                  {isFilterActive ? (
                    <button
                      type="button"
                      onClick={() => onContinuousElevationChange?.(null)}
                      className="text-[9px] text-cyan-400 hover:text-cyan-200 underline font-bold shrink-0 ml-2 cursor-pointer"
                      title="Clear cursor filter and view all elevations on Moon"
                    >
                      Show All
                    </button>
                  ) : (
                    <span className="text-[9px] text-slate-400 italic shrink-0">
                      Move cursor on bar to filter
                    </span>
                  )}
                </div>

                {/* Continuous Seamless Color Filter Track */}
                <div className="relative pt-1 pb-1">
                  <div
                    ref={trackRef}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setIsPointerDown(true);
                      updateElevationFromClientX(e.clientX);
                    }}
                    onPointerMove={(e) => {
                      if (!trackRef.current) return;
                      const rect = trackRef.current.getBoundingClientRect();
                      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      setHoverRatio(ratio);
                      updateElevationFromClientX(e.clientX);
                    }}
                    onPointerUp={(e) => {
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      } catch {}
                      setIsPointerDown(false);
                    }}
                    onPointerLeave={() => {
                      setHoverRatio(null);
                    }}
                    className="relative h-7 w-full rounded-xl cursor-ew-resize select-none overflow-visible shadow-lg border border-slate-700/90 group transition-all"
                    style={{
                      background: 'linear-gradient(to right, #2e0554 0%, #0a84e3 16%, #00cfc9 31%, #6bb04d 46%, #f2c410 58%, #e84d3d 78%, #ffffff 100%)'
                    }}
                    title="Move cursor or drag across the continuous spectrum to change elevation & color on Moon"
                  >
                    {/* Mean Datum (0m) Reference Marker */}
                    <div
                      className="absolute top-0 bottom-0 left-[46%] w-[1px] bg-white/40 pointer-events-none z-10"
                      title="Mean Lunar Datum (0 m)"
                    />

                    {/* Interactive Cursor Indicator Thumb */}
                    {isFilterActive && (
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none transform -translate-x-1/2 flex flex-col items-center justify-between z-20 transition-[left] duration-75"
                        style={{ left: `${activePercent}%` }}
                      >
                        {/* Top indicator handle */}
                        <div
                          className="w-3 h-3 rotate-45 border-2 border-white shadow-[0_0_8px_rgba(255,255,255,0.8)] -mt-1.5 transition-transform group-hover:scale-125"
                          style={{ backgroundColor: activeHex }}
                        />

                        {/* Center vertical scanline */}
                        <div className="w-[2px] h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />

                        {/* Bottom indicator handle */}
                        <div
                          className="w-3 h-3 rotate-45 border-2 border-white shadow-[0_0_8px_rgba(255,255,255,0.8)] -mb-1.5 transition-transform group-hover:scale-125"
                          style={{ backgroundColor: activeHex }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Scale Axis Labels */}
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span className="text-purple-300">-9,000 m (Basins)</span>
                  <span className="text-emerald-300">Datum (0 m)</span>
                  <span className="text-amber-300">+10,760 m (Highlands)</span>
                </div>

                {/* Subtle Band-width adjustment */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[9px] font-mono text-slate-400">
                  <span>Filter Band Width</span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: '±1.0 km', val: 1000 },
                      { label: '±1.8 km', val: 1800 },
                      { label: '±3.0 km', val: 3000 }
                    ].map(b => (
                      <button
                        key={b.val}
                        type="button"
                        onClick={() => onContinuousWindowChange?.(b.val)}
                        className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                          (continuousWindowM || 1800) === b.val
                            ? 'bg-cyan-950 border border-cyan-500/80 text-cyan-300 font-bold'
                            : 'bg-space-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Overlay Toggles */}
            <div className="pt-2 border-t border-slate-800/60">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                Atlas Overlays & Pins
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {/* User Option: Landing Site Pin Markers */}
                <button
                  onClick={onToggleMarkers}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono transition-all ${showMarkers
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 font-semibold'
                      : 'bg-space-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Landing Site Pins
                  </span>
                  <span className="text-[10px] font-bold">
                    {showMarkers ? 'ENABLED' : 'HIDDEN'}
                  </span>
                </button>

                {/* Graticule Grid Toggle */}
                <button
                  onClick={onToggleGraticule}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono transition-all ${showGraticule
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 font-semibold'
                      : 'bg-space-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Coordinate Graticule</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {showGraticule && (
                      <span className="flex items-center gap-1 text-[9px] font-mono mr-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" title="Latitude: Dark Red" />
                        <span className="text-red-400 font-bold">Lat</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ml-1" title="Longitude: Green" />
                        <span className="text-emerald-400 font-bold">Lon</span>
                      </span>
                    )}
                    <span className="text-[10px] font-bold">
                      {showGraticule ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </button>

                {/* Globe Auto-Rotate Toggle */}
                <button
                  onClick={onToggleAutoRotate}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono transition-all ${autoRotate
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                      : 'bg-space-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
                    Idle Globe Rotation
                  </span>
                  <span className="text-[10px] font-bold">
                    {autoRotate ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </button>

                {/* Solar Shade / Terminator Shadows Toggle */}
                <button
                  onClick={onToggleSunShade}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono transition-all ${enableSunShade
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 font-semibold'
                      : 'bg-space-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Sun Shadow Shade
                  </span>
                  <span className="text-[10px] font-bold">
                    {enableSunShade ? 'SHADOW ON' : 'FULL LIT'}
                  </span>
                </button>

                {/* NASA 3D Elevation Relief (LOLA DEM Bump Map 0.05) Toggle */}
                {onToggleBump && (
                  <button
                    onClick={onToggleBump}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono transition-all ${isBumpActive
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 font-semibold'
                        : 'bg-space-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                      3D Relief (LOLA DEM)
                    </span>
                    <span className="text-[10px] font-bold">
                      {isBumpActive ? '0.05 ON' : 'OFF'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
