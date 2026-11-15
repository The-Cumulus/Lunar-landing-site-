import React, { useState } from 'react';
import { Rocket, Layers, Eye, Crosshair, MapPin, ExternalLink, Compass } from 'lucide-react';
import { PreviewMoonCanvas, PREVIEW_SITES, HighlightSite } from './PreviewMoonCanvas';
import { BasemapType } from '../../types/lunar';
import { formatCoordinatesDecimal, formatCoordinatesDMS } from '../../utils/coordinates';

interface InteractiveMoonPreviewProps {
  onLaunchExplorer: (siteId?: string) => void;
}

export const InteractiveMoonPreview: React.FC<InteractiveMoonPreviewProps> = ({
  onLaunchExplorer
}) => {
  const [basemap, setBasemap] = useState<BasemapType>('natural');
  const [selectedSite, setSelectedSite] = useState<HighlightSite | null>(PREVIEW_SITES[0]);

  return (
    <section id="preview" className="relative py-24 sm:py-32 w-full bg-space-950 border-t border-slate-900 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[750px] h-[750px] bg-cyan-600/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs tracking-widest uppercase mb-3.5">
            <Eye className="w-3.5 h-3.5" />
            <span>INTERACTIVE LABORATORY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            YOUR WINDOW TO THE{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              LUNAR SURFACE.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Navigate lunar geography, discover historic landing locations, and examine
            the surface through scientific imaging.
          </p>
        </div>

        {/* 3D Preview Frame & Scientific Controls */}
        <div className="relative rounded-3xl bg-space-900/80 border border-slate-800/80 backdrop-blur-2xl shadow-2xl p-4 sm:p-6 lg:p-8 overflow-hidden">
          {/* Top Bar: Basemap Mode Switcher & Explorer CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            {/* Basemap Switcher */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-space-950/90 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 px-2 hidden sm:inline-block">Basemap Layer:</span>
              <button
                onClick={() => setBasemap('natural')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  basemap === 'natural'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Natural Mosaic (LROC WAC)</span>
              </button>
              <button
                onClick={() => setBasemap('shaded-relief')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  basemap === 'shaded-relief'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>LOLA Shaded Relief</span>
              </button>
            </div>

            {/* Quick Launch CTA */}
            <button
              onClick={() => onLaunchExplorer(selectedSite?.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-space-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25 hover:scale-[1.02]"
            >
              <Rocket className="w-4 h-4" />
              <span>Open Interactive Explorer</span>
            </button>
          </div>

          {/* Interactive 3D Canvas Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-6 min-h-[480px]">
            {/* Left 3D Viewport */}
            <div className="lg:col-span-8 h-[380px] sm:h-[460px] lg:h-[520px] rounded-2xl bg-space-950/70 border border-slate-800/60 relative overflow-hidden">
              <PreviewMoonCanvas
                basemap={basemap}
                selectedSite={selectedSite}
                onSelectSite={setSelectedSite}
              />

              {/* Viewport Overlay Hints */}
              <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 rounded-lg bg-space-950/80 border border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE 3D PREVIEW • DRAG TO ROTATE • PIN TOUCH ACTIVE</span>
              </div>
            </div>

            {/* Right Telemetry & Site Selector Card */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-4 font-mono">
              {/* Site Details Card */}
              {selectedSite ? (
                <div className="p-5 rounded-2xl bg-space-950/90 border border-cyan-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-[10px] text-cyan-400 uppercase tracking-wider">
                      {selectedSite.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {selectedSite.agency}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedSite.color }} />
                      <span>{selectedSite.name}</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                      {selectedSite.description}
                    </p>
                  </div>

                  {/* Scientific Coordinates Box */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                    <div className="p-2 rounded-xl bg-space-900 border border-slate-800">
                      <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                        <Crosshair className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Coordinates</span>
                      </div>
                      <div className="font-bold text-cyan-300 text-[11px] mt-0.5">
                        {formatCoordinatesDecimal(selectedSite.lat, selectedSite.lng)}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-space-900 border border-slate-800">
                      <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-amber-400" />
                        <span>LOLA Datum</span>
                      </div>
                      <div className="font-bold text-amber-200 text-[11px] mt-0.5">
                        {selectedSite.elevation > 0 ? `+${selectedSite.elevation.toLocaleString()} m` : `${selectedSite.elevation.toLocaleString()} m`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onLaunchExplorer(selectedSite.id)}
                    className="w-full py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Inspect Site In 3D Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}

              {/* Clickable Quick Site Directory */}
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">
                  Featured Landing Zones & Features
                </div>
                <div className="space-y-1.5">
                  {PREVIEW_SITES.map(site => (
                    <button
                      key={site.id}
                      onClick={() => setSelectedSite(site)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between text-xs ${
                        selectedSite?.id === site.id
                          ? 'bg-cyan-950/60 border border-cyan-500/50 text-white font-bold'
                          : 'bg-space-950/50 hover:bg-space-900 border border-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: site.color }} />
                        <span className="truncate">{site.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {site.agency}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveMoonPreview;

