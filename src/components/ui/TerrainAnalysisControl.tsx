import React, { useState } from 'react';
import {
  Activity,
  Mountain,
  TrendingUp,
  Layers,
  Sun,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  TerrainAnalysisMode,
  TerrainFilterConfig,
  PaletteId,
  SlopeCategory,
  RoughnessCategory
} from '../../types/lunar';
import {
  LOLA_DEM_CONFIG,
  TERRAIN_PALETTES,
  SLOPE_BINS,
  ROUGHNESS_BINS
} from '../../utils/demAnalysis';

interface TerrainAnalysisControlProps {
  config: TerrainFilterConfig;
  onChangeConfig: (newConfig: TerrainFilterConfig) => void;
  datasetStatus?: { isLoaded: boolean; error: string | null };
}

// Reusable ticker component for running words from right to left
const RunningText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="overflow-hidden whitespace-nowrap flex-1 min-w-0 relative">
      <div className="inline-flex animate-running-words">
        <span className="pr-6 inline-block">{text}</span>
        <span className="pr-6 inline-block" aria-hidden="true">{text}</span>
      </div>
    </div>
  );
};

export const TerrainAnalysisControl: React.FC<TerrainAnalysisControlProps> = ({
  config,
  onChangeConfig,
  datasetStatus
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateConfig = (partial: Partial<TerrainFilterConfig>) => {
    onChangeConfig({ ...config, ...partial });
  };

  const setMode = (mode: TerrainAnalysisMode) => {
    updateConfig({ mode });
  };

  const activePalette = TERRAIN_PALETTES.find(p => p.id === config.paletteId) || TERRAIN_PALETTES[0];

  return (
    <div className="rounded-2xl bg-space-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 pointer-events-auto">
      {/* Panel Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-center justify-between cursor-pointer border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Terrain Analysis & Filters
              </h3>
              {config.mode !== 'none' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {config.mode === 'none' && 'Scientific LOLA Geodesy Suite'}
              {config.mode === 'elevation' && 'LOLA DEM Hypsometric Elevation'}
              {config.mode === 'slope' && 'Spatial Gradient Slope (Degrees)'}
              {config.mode === 'roughness' && 'RMS Surface Roughness Dispersion'}
              {config.mode === 'hillshade' && 'Directional Analytical Hillshade'}
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-4">
          {/* Error Message if Dataset Unavailable */}
          {datasetStatus?.error && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Dataset Unavailable</span>
                {datasetStatus.error}
              </div>
            </div>
          )}

          {/* 1. Terrain Analysis Mode Selector */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
              Analysis Mode (Real LOLA Dataset)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setMode('none')}
                className={`px-2 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all flex items-center justify-center gap-1.5 col-span-2 ${config.mode === 'none'
                    ? 'bg-slate-800 text-white border-slate-600 shadow-md'
                    : 'bg-space-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <span>Standard Basemap (Analysis OFF)</span>
              </button>

              <button
                onClick={() => setMode('elevation')}
                title="Elevation (LOLA)"
                className={`px-2 py-2 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 overflow-hidden text-left ${config.mode === 'elevation'
                    ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300 font-bold shadow-md shadow-emerald-950/60'
                    : 'bg-space-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
              >
                <Mountain className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <RunningText text="Elevation (LOLA)" />
              </button>

              <button
                onClick={() => setMode('slope')}
                title="Slope (Degrees)"
                className={`px-2 py-2 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 overflow-hidden text-left ${config.mode === 'slope'
                    ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300 font-bold shadow-md shadow-cyan-950/60'
                    : 'bg-space-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <RunningText text="Slope (Degrees)" />
              </button>

              <button
                onClick={() => setMode('roughness')}
                title="Surface Roughness"
                className={`px-2 py-2 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 overflow-hidden text-left ${config.mode === 'roughness'
                    ? 'bg-amber-950/60 border-amber-500/70 text-amber-300 font-bold shadow-md shadow-amber-950/60'
                    : 'bg-space-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <RunningText text="Surface Roughness" />
              </button>

              <button
                onClick={() => setMode('hillshade')}
                title="Hillshade Relief"
                className={`px-2 py-2 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 overflow-hidden text-left ${config.mode === 'hillshade'
                    ? 'bg-purple-950/60 border-purple-500/70 text-purple-300 font-bold shadow-md shadow-purple-950/60'
                    : 'bg-space-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
              >
                <Sun className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <RunningText text="Hillshade Relief" />
              </button>
            </div>
          </div>

          {/* ================= MODE: ELEVATION CONTROLS ================= */}
          {config.mode === 'elevation' && (
            <div className="space-y-3.5 pt-2 border-t border-slate-800/60 animate-fadeIn">
              {/* Min & Max Elevation Sliders */}
              <div className="space-y-2.5 p-2.5 rounded-xl bg-space-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Min Elevation Filter</span>
                  <span className="text-cyan-300 font-bold">
                    {config.minElevation.toLocaleString()} m
                  </span>
                </div>
                <input
                  type="range"
                  min={-9000}
                  max={10760}
                  step={100}
                  value={config.minElevation}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateConfig({
                      minElevation: Math.min(val, config.maxElevation - 200),
                      elevationCategory: 'all',
                      continuousTargetElev: null
                    });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-slate-400">Max Elevation Filter</span>
                  <span className="text-amber-300 font-bold">
                    {config.maxElevation.toLocaleString()} m
                  </span>
                </div>
                <input
                  type="range"
                  min={-9000}
                  max={10760}
                  step={100}
                  value={config.maxElevation}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateConfig({
                      maxElevation: Math.max(val, config.minElevation + 200),
                      elevationCategory: 'all',
                      continuousTargetElev: null
                    });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                {/* Filter Mode Toggle: Highlight vs Hard Mask */}
                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
                  <span>Out-of-Range Display</span>
                  <button
                    onClick={() => updateConfig({ highlightOutOfRange: !config.highlightOutOfRange })}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${config.highlightOutOfRange
                        ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-300'
                        : 'bg-space-900 border-slate-700 text-slate-400'
                      }`}
                  >
                    {config.highlightOutOfRange ? 'Dim Background' : 'Hard Mask'}
                  </button>
                </div>
              </div>

              {/* Dynamic Numerical Elevation Legend */}
              <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800/80 space-y-1.5">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Dynamic Elevation Legend
                </div>
                <div
                  className="w-full h-2.5 rounded-full border border-slate-700"
                  style={{
                    background: `linear-gradient(to right, ${activePalette.colors.join(', ')})`
                  }}
                />
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-300">
                  <span>{config.minElevation.toLocaleString()} m</span>
                  <span>{Math.round((config.minElevation + config.maxElevation) / 2).toLocaleString()} m</span>
                  <span>+{config.maxElevation.toLocaleString()} m</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE: SLOPE CONTROLS ================= */}
          {config.mode === 'slope' && (
            <div className="space-y-3 pt-2 border-t border-slate-800/60 animate-fadeIn">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                Slope Angle Classification (Degrees)
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => updateConfig({ slopeCategory: 'all' })}
                  className={`px-2 py-1.5 rounded-lg text-xs font-mono border text-center col-span-2 transition-all ${config.slopeCategory === 'all'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-space-950/50 border-slate-800 text-slate-300'
                    }`}
                >
                  Show All Slopes (0° to 90°)
                </button>

                {SLOPE_BINS.map(bin => {
                  const isActive = config.slopeCategory === bin.id;
                  return (
                    <button
                      key={bin.id}
                      onClick={() => updateConfig({ slopeCategory: bin.id })}
                      className={`p-2 rounded-xl border text-left transition-all ${isActive
                          ? 'bg-space-950/90 border-cyan-500 shadow-md'
                          : 'bg-space-950/40 border-slate-800/80 hover:border-slate-700'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: bin.color }} />
                        <span className="text-xs font-mono font-bold text-slate-100">{bin.label}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-300 font-semibold">{bin.name}</div>
                      <div className="text-[9px] text-slate-400 leading-tight">{bin.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Slope Legend */}
              <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>0° (Flat Maria)</span>
                  <span>10°</span>
                  <span>&gt;15° (Steep Terraces)</span>
                </div>
                <div
                  className="w-full h-2.5 rounded-full border border-slate-700"
                  style={{
                    background: 'linear-gradient(to right, #3b82f6 0%, #06b6d4 33%, #f59e0b 66%, #ef4444 100%)'
                  }}
                />
              </div>
            </div>
          )}

          {/* ================= MODE: SURFACE ROUGHNESS CONTROLS ================= */}
          {config.mode === 'roughness' && (
            <div className="space-y-3 pt-2 border-t border-slate-800/60 animate-fadeIn">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                Surface Roughness (RMS Elevation Variation)
              </label>

              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => updateConfig({ roughnessCategory: 'all' })}
                  className={`px-2 py-1.5 rounded-lg text-xs font-mono border text-center transition-all ${config.roughnessCategory === 'all'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                      : 'bg-space-950/50 border-slate-800 text-slate-300'
                    }`}
                >
                  Show All Roughness Classes
                </button>

                {ROUGHNESS_BINS.map(bin => {
                  const isActive = config.roughnessCategory === bin.id;
                  return (
                    <button
                      key={bin.id}
                      onClick={() => updateConfig({ roughnessCategory: bin.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${isActive
                          ? 'bg-space-950/90 border-amber-500 shadow-md'
                          : 'bg-space-950/40 border-slate-800/80 hover:border-slate-700'
                        }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: bin.color }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-100">{bin.label}</span>
                          <span className="text-[10px] font-mono text-amber-300/90">{bin.rmsRange}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{bin.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= MODE: HILLSHADE CONTROLS ================= */}
          {config.mode === 'hillshade' && (
            <div className="space-y-3.5 pt-2 border-t border-slate-800/60 animate-fadeIn">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                Illumination Direction & Elevation
              </label>

              {/* Azimuth Slider */}
              <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Illumination Azimuth</span>
                  <span className="text-purple-300 font-bold">
                    {Math.round(config.hillshadeAzimuth)}° ({
                      config.hillshadeAzimuth >= 337.5 || config.hillshadeAzimuth < 22.5 ? 'N' :
                        config.hillshadeAzimuth < 67.5 ? 'NE' :
                          config.hillshadeAzimuth < 112.5 ? 'E' :
                            config.hillshadeAzimuth < 157.5 ? 'SE' :
                              config.hillshadeAzimuth < 202.5 ? 'S' :
                                config.hillshadeAzimuth < 247.5 ? 'SW' :
                                  config.hillshadeAzimuth < 292.5 ? 'W' : 'NW'
                    })
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={config.hillshadeAzimuth}
                  onChange={(e) => updateConfig({ hillshadeAzimuth: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>0° (N)</span>
                  <span>90° (E)</span>
                  <span>180° (S)</span>
                  <span>270° (W)</span>
                  <span>360°</span>
                </div>
              </div>

              {/* Altitude Slider */}
              <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Sun Elevation Angle</span>
                  <span className="text-purple-300 font-bold">
                    {Math.round(config.hillshadeAltitude)}°
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  step={1}
                  value={config.hillshadeAltitude}
                  onChange={(e) => updateConfig({ hillshadeAltitude: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>10° (Grazing Shadows)</span>
                  <span>45° (Standard)</span>
                  <span>80° (High Noon)</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= VISUAL OVERLAY ON NATURAL 8K SURFACE ================= */}
          {config.mode !== 'none' && (
            <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/80 space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Overlay on Natural 8K Surface
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig({ overlayOnNatural: !config.overlayOnNatural })}
                  className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.overlayOnNatural ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${config.overlayOnNatural ? 'translate-x-4' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {config.overlayOnNatural && (
                <div className="space-y-1 animate-fadeIn pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Blend Opacity</span>
                    <span className="text-cyan-300 font-bold">{Math.round(config.blendOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1.0}
                    step={0.05}
                    value={config.blendOpacity}
                    onChange={(e) => updateConfig({ blendOpacity: Number(e.target.value) })}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* Scientific Dataset Integrity Attribution */}
          <div className="p-2 rounded-xl bg-cyan-950/20 border border-cyan-800/30 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-[10px] font-mono text-slate-300 leading-tight">
              <span className="text-white font-bold block">NASA LOLA Scientific Dataset</span>
              LRO LOLA GDR DEM • Datum: 1,737.4 km
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

