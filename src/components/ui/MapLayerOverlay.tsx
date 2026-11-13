import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  ChevronDown,
  Loader2,
  Check,
  Globe2,
  Mountain,
  Satellite,
  ExternalLink
} from 'lucide-react';
import { MapLayerId, MAP_LAYERS, MapLayerConfig } from '../../utils/nasaWmtsLoader';

interface MapLayerOverlayProps {
  activeLayer: MapLayerId;
  onSelectLayer: (layerId: MapLayerId) => void;
  isLoading: boolean;
  progress?: { loaded: number; total: number } | null;
  isBumpActive?: boolean;
  onToggleBump?: () => void;
  isLoadingBump?: boolean;
  className?: string;
}

export const MapLayerOverlay: React.FC<MapLayerOverlayProps> = ({
  activeLayer,
  onSelectLayer,
  isLoading,
  progress,
  isBumpActive = true,
  onToggleBump,
  isLoadingBump = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentConfig = MAP_LAYERS.find(l => l.id === activeLayer) || MAP_LAYERS[0];

  const getLayerIcon = (id: MapLayerId) => {
    switch (id) {
      case 'default':
        return <Globe2 className="w-4 h-4 text-cyan-400" />;
      case 'nasa-wac':
        return <Satellite className="w-4 h-4 text-emerald-400" />;
      case 'nasa-lola':
        return <Mountain className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`pointer-events-auto select-none font-mono text-xs z-30 ${className}`}
    >
      <div className="rounded-2xl bg-space-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl p-1.5 transition-all">
        {/* Dropdown Header Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl transition-all border ${
            isOpen
              ? 'bg-space-950/90 border-cyan-500/60 text-white shadow-lg shadow-cyan-950/50'
              : 'bg-space-950/60 hover:bg-space-950/90 border-slate-800 hover:border-slate-700 text-slate-200'
          }`}
          title="Switch Moon surface texture"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Layer Icon or Loading Spinner */}
            <div className="flex items-center justify-center p-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 shrink-0">
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : (
                getLayerIcon(activeLayer)
              )}
            </div>

            {/* Label & Active Layer */}
            <div className="text-left min-w-0 pr-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <span>Map Layer</span>
                {isLoading && (
                  <span className="text-cyan-400 font-normal">
                    ({progress ? `${progress.loaded}/${progress.total}` : 'Stitching...'})
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-white truncate max-w-[155px] sm:max-w-[185px]">
                {isLoading ? 'Stitching WMTS Tiles...' : currentConfig.shortLabel}
              </div>
            </div>
          </div>

          {/* Chevron Indicator */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Options */}
        {isOpen && (
          <div className="mt-1.5 p-1 rounded-xl bg-space-950/95 border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-1 w-full animate-fadeIn">
            <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/60 mb-1 flex items-center justify-between">
              <span>Select Surface Texture</span>
              <span className="text-cyan-400 font-normal">Zoom Lvl 2 WMTS</span>
            </div>

            {MAP_LAYERS.map((layer) => {
              const isSelected = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => {
                    onSelectLayer(layer.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 group ${
                    isSelected
                      ? 'bg-cyan-950/60 border border-cyan-500/50 text-white shadow-md'
                      : 'hover:bg-slate-900 border border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {getLayerIcon(layer.id)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {layer.label}
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 shrink-0">
                          {layer.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {layer.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* 3D Surface Relief (NASA LOLA DEM BumpMap) */}
            <div className="pt-2 px-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between px-1.5 py-1 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                  3D Relief (NASA DEM)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-semibold">
                  bumpScale: 0.05
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleBump}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                  isBumpActive
                    ? 'bg-cyan-950/50 border border-cyan-500/50 text-white'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="min-w-0 pr-1">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <span>LOLA Grayscale Elevation</span>
                    {isLoadingBump && (
                      <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {isLoadingBump ? 'Stitching DEM elevation tiles...' : isBumpActive ? 'Active (Zoom 2 CanvasTexture)' : 'Relief Disabled'}
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                  isBumpActive ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                }`}>
                  <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                </div>
              </button>
            </div>

            {/* Attribution note */}
            <div className="pt-1.5 px-2.5 pb-1 border-t border-slate-800/60 text-[9px] text-slate-500 flex items-center justify-between">
              <span>NASA JPL / Moon Trek OGC Tiles</span>
              <a
                href="https://trek.nasa.gov/moon/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
              >
                <span>Trek API</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLayerOverlay;
