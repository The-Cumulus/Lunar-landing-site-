import React, { useState } from 'react';
import {
  Layers,
  Eye,
  Sliders,
  MapPin,
  Grid3X3,
  Camera,
  Mountain,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Check,
  X,
  Compass
} from 'lucide-react';
import { LROCLayerConfig } from '../../types/lunar';

interface LROCLayerSwitcherProps {
  config: LROCLayerConfig;
  onChangeConfig: (config: LROCLayerConfig) => void;
  onFlyToNacTarget: (lat: number, lng: number, altitudeMeters?: number) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NAC_TARGETS = [
  {
    name: 'Apollo 11 Landing Site',
    subtitle: 'Mare Tranquillitatis (0.5 m/px NAC Mosaic)',
    lat: 0.67408,
    lng: 23.47297,
    altitude: 18000,
    badge: 'Apollo 11 NAC'
  },
  {
    name: 'Apollo 12 & Surveyor 3',
    subtitle: 'Oceanus Procellarum (Pinpoint Landing)',
    lat: -3.01239,
    lng: -23.42157,
    altitude: 16000,
    badge: 'Apollo 12 NAC'
  },
  {
    name: 'Apollo 17 Taurus-Littrow',
    subtitle: 'Valley of Taurus-Littrow & North Massif',
    lat: 20.19080,
    lng: 30.77168,
    altitude: 20000,
    badge: 'Apollo 17 NAC'
  },
  {
    name: 'Shackleton Crater Polar Rim',
    subtitle: 'Connecting Ridge Ice Trap (Candidate Basecamp)',
    lat: -89.67000,
    lng: 129.78000,
    altitude: 25000,
    badge: 'South Pole NAC'
  }
];

export const LROCLayerSwitcher: React.FC<LROCLayerSwitcherProps> = ({
  config,
  onChangeConfig,
  onFlyToNacTarget,
  isOpen,
  onClose,
  className = ''
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof LROCLayerConfig) => {
    onChangeConfig({
      ...config,
      [key]: !config[key]
    });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChangeConfig({
      ...config,
      lolaOpacity: val
    });
  };

  const handleFilterChange = (filter: 'all' | 'crater' | 'landing_site' | 'mare') => {
    onChangeConfig({
      ...config,
      nomenclatureFilter: filter
    });
  };

  return (
    <div
      className={`fixed top-16 sm:top-20 right-3 sm:right-4 z-40 w-[calc(100vw-1.5rem)] sm:w-96 rounded-2xl bg-space-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl p-4 text-slate-200 select-none animate-fadeIn ${className}`}
      aria-label="LROC QuickMap Layer Switcher"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>LROC QuickMap Layers</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                WMTS
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              NASA Trek & USGS Selenographic Datasets
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-space-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close Layer Switcher"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
        {/* ================= LAYER 1: LROC WAC GLOBAL MOSAIC ================= */}
        <div className="p-3 rounded-xl bg-space-900/70 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono text-white">LROC WAC Global Mosaic</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              BASE MAP (100m/px)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Calibrated 303 PPD monochrome base map from the LROC Wide Angle Camera streamed via NASA Moon Trek WMTS.
          </p>
        </div>

        {/* ================= LAYER 2: LOLA COLOR ELEVATION OVERLAY ================= */}
        <div className={`p-3 rounded-xl border transition-all ${
          config.showLolaOverlay
            ? 'bg-purple-950/25 border-purple-500/50 shadow-md shadow-purple-950/20'
            : 'bg-space-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showLolaOverlay}
                onChange={() => handleToggle('showLolaOverlay')}
                className="w-4 h-4 rounded text-purple-600 bg-space-950 border-slate-700 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-xs font-bold font-mono text-white">LOLA Color Elevation</span>
            </label>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              ALTIMETRY OVERLAY
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-2">
            Topographic color-shaded relief overlay from NASA LOLA laser altimeter.
          </p>

          {/* Opacity Slider */}
          {config.showLolaOverlay && (
            <div className="pt-2 border-t border-purple-500/20 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-purple-300 flex items-center gap-1">
                  <Sliders className="w-3 h-3" />
                  <span>Overlay Opacity:</span>
                </span>
                <span className="font-bold text-white bg-purple-900/60 px-1.5 py-0.2 rounded border border-purple-500/40">
                  {Math.round(config.lolaOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.lolaOpacity}
                onChange={handleOpacityChange}
                className="w-full h-1.5 bg-space-950 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>10% (Transparent)</span>
                <span>100% (Solid)</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= LAYER 3: LROC NAC HIGH-RESOLUTION OVERLAYS ================= */}
        <div className={`p-3 rounded-xl border transition-all ${
          config.showNacOverlays
            ? 'bg-cyan-950/25 border-cyan-500/50 shadow-md shadow-cyan-950/20'
            : 'bg-space-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showNacOverlays}
                onChange={() => handleToggle('showNacOverlays')}
                className="w-4 h-4 rounded text-cyan-600 bg-space-950 border-slate-700 focus:ring-cyan-500 cursor-pointer"
              />
              <span className="text-xs font-bold font-mono text-white">LROC NAC Regional Mosaics</span>
            </label>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              SUB-METER (0.5m/px)
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-2.5">
            Ultra high-resolution Narrow Angle Camera (NAC) mosaics overlaid on historic sites and Artemis target zones.
          </p>

          {/* Quick fly-to targets */}
          {config.showNacOverlays && (
            <div className="space-y-1.5 pt-2 border-t border-cyan-500/20">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 mb-1">
                Zoom to NAC Targets:
              </div>
              {NAC_TARGETS.map(target => (
                <button
                  key={target.name}
                  type="button"
                  onClick={() => onFlyToNacTarget(target.lat, target.lng, target.altitude)}
                  className="w-full text-left p-2 rounded-lg bg-space-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-semibold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                      <span>{target.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans truncate">{target.subtitle}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= LAYER 4: USGS LUNAR NOMENCLATURE ================= */}
        <div className={`p-3 rounded-xl border transition-all ${
          config.showUSGSNomenclature
            ? 'bg-amber-950/25 border-amber-500/50 shadow-md shadow-amber-950/20'
            : 'bg-space-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showUSGSNomenclature}
                onChange={() => handleToggle('showUSGSNomenclature')}
                className="w-4 h-4 rounded text-amber-600 bg-space-950 border-slate-700 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-bold font-mono text-white">USGS / IAU Nomenclature</span>
            </label>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              CRATERS & SITES
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-2">
            Clickable lunar craters (with diameters in km), historic landing sites, and prominent maria features.
          </p>

          {config.showUSGSNomenclature && (
            <div className="pt-2 border-t border-amber-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'crater', 'landing_site', 'mare'] as const).map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => handleFilterChange(filter)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      (config.nomenclatureFilter || 'all') === filter
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-space-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? 'All (40+)' : filter === 'crater' ? 'Craters (km)' : filter === 'landing_site' ? 'Landers' : 'Maria'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= LAYER 5: SELENOGRAPHIC GRATICULE GRID ================= */}
        <div className="p-3 rounded-xl bg-space-900/60 border border-slate-800/80 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showGraticule}
              onChange={() => handleToggle('showGraticule')}
              className="w-4 h-4 rounded text-cyan-600 bg-space-950 border-slate-700 focus:ring-cyan-500 cursor-pointer"
            />
            <div>
              <div className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Selenographic Graticule</span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                EPSG:4326 Latitude / Longitude 15° Grid
              </div>
            </div>
          </label>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
            GRID
          </span>
        </div>
      </div>

      {/* Attribution footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between font-mono">
        <span>NASA / ASU / USGS Planetary Maps</span>
        <span className="text-cyan-400">EPSG:4326</span>
      </div>
    </div>
  );
};
