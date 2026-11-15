import React from 'react';
import { 
  X, 
  RotateCw, 
  MousePointer, 
  ZoomIn, 
  Sun, 
  Compass, 
  Layers, 
  ShieldCheck,
  BookOpen,
  ChevronLeft
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-space-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-700/50 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white">
                Atlas Navigation & User Guide
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Interactive Controls, Scientific Instruments & Basemaps
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs font-mono text-slate-300">
          {/* Navigation Controls */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Viewport & Orbit Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800/80">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  Orbit / Rotate
                </div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Click and drag anywhere on the 3D globe to orbit smoothly around any lunar coordinate.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800/80">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                  Zoom In / Out
                </div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Use your mouse scroll wheel, on-screen <kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">+</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">-</kbd> HUD buttons, or keyboard keys <kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">+</kbd>/<kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">-</kbd> to inspect crater topography up close.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800/80">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  Fly-To Landmark
                </div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Click on any mission marker pin to smoothly animate the camera directly above the landing site.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800/80">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
                  Collapse Left Toolbar
                </div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Click the small <kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">&lt;</kbd> button on the left toolbar or press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">[</kbd> to slide the toolbar to the side for an unobstructed lunar view.
                </p>
              </div>
            </div>
          </div>

          {/* Scientific Basemaps */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Lunar Basemap Descriptions
            </h3>
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800/80">
                <span className="font-bold text-white block mb-0.5">1. Natural Surface (LROC WAC Visual Mosaic)</span>
                <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                  Reflectance mosaic showing the true visual albedo of the Moon. Features dark volcanic basalt maria (e.g. Mare Tranquillitatis) contrasted with ancient, bright anorthositic highlands and crater ray systems like Tycho.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800/80">
                <span className="font-bold text-white block mb-0.5">2. LOLA Shaded Relief / Hillshade</span>
                <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                  Monochrome directional illumination emphasizing fine structural geology: crater terraces, volcanic rilles, central peaks, and fault scarps.
                </p>
              </div>
            </div>
          </div>

          {/* Scientific Terrain Analysis & Filtering System */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Terrain Analysis & Filtering Suite (LOLA Geodesy)
            </h3>
            <div className="p-3.5 rounded-xl bg-space-950/60 border border-slate-800/80 space-y-2.5 text-[11px] font-sans leading-relaxed">
              <div>
                <span className="text-emerald-400 font-bold font-mono">1. Elevation Filtering (LOLA DEM):</span>
                <p className="text-slate-400 mt-0.5">
                  Filter elevations between -9,000 m and +10,760 m with live dual sliders or quick categories (<span className="text-slate-300">Deep Basins, Lowlands, Intermediate, Highlands & Peaks</span>). Highlights the selected elevation band directly on the 3D Moon while dimming out-of-range topography. Switch across 5 scientific colour palettes (<span className="text-slate-300">LOLA Standard, Turbo, Magma, Monochrome, Cool-Warm</span>).
                </p>
              </div>
              <div>
                <span className="text-cyan-400 font-bold font-mono">2. Slope Analysis (Degrees):</span>
                <p className="text-slate-400 mt-0.5">
                  Computes exact spatial surface gradients using Horn's planetary geodesy algorithm across four standard bins: <span className="text-blue-400">0–5° (Flat Maria)</span>, <span className="text-cyan-400">5–10° (Gentle)</span>, <span className="text-amber-400">10–15° (Moderate)</span>, and <span className="text-red-400">&gt;15° (Steep Terraces & Scarps)</span>.
                </p>
              </div>
              <div>
                <span className="text-amber-400 font-bold font-mono">3. Surface Roughness:</span>
                <p className="text-slate-400 mt-0.5">
                  Measures local root-mean-square (RMS) elevation dispersion across <span className="text-emerald-400">Smooth (&lt;35m)</span>, <span className="text-amber-400">Moderate (35–90m)</span>, and <span className="text-pink-400">Rough (&gt;90m)</span> geomorphological terrain units.
                </p>
              </div>
              <div>
                <span className="text-purple-400 font-bold font-mono">4. Directional Hillshade:</span>
                <p className="text-slate-400 mt-0.5">
                  Adjustable analytical solar illumination direction (Azimuth 0°–360°) and solar altitude angle (10°–80°) with real-time 3D relief updates.
                </p>
              </div>
              <div>
                <span className="text-cyan-300 font-bold font-mono">5. Hover Point Telemetry:</span>
                <p className="text-slate-400 mt-0.5">
                  Move your cursor anywhere over the lunar globe to inspect exact real-time elevation in meters, surface slope in degrees, and terrain classification in the bottom-right HUD.
                </p>
              </div>
            </div>
          </div>

          {/* Solar Terminator & Raycasting */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Real-time Solar Phase Simulator & Surface Shade
            </h3>
            <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800/80 space-y-2">
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                Use the Solar Phase slider in the top-right to rotate the virtual Sun 360° around the lunar equator. Watch craters emerge into grazing sunlight along the day/night terminator line, casting long, dramatic shadows just as seen through high-powered astronomical telescopes.
              </p>
              <p className="text-amber-300/90 text-[11px] font-sans leading-relaxed">
                <span className="font-bold font-mono">Shade Toggle (Key S):</span> Click the <span className="font-mono text-white">Shade ON/OFF</span> toggle or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[10px]">S</kbd> to turn off solar shadows for uniform 360° full illumination across all craters.
              </p>
            </div>
          </div>

          {/* Data Sources and Credits */}
          <div className="p-4 rounded-xl bg-cyan-950/25 border border-cyan-800/40 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Official NASA Scientific Datasets & Direct Portals</span>
            </div>
            <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
              This digital atlas is powered by raw photographic mosaics and altimetry from NASA LRO, calibrated against the NASA Planetary Data System (PDS) and USGS Astrogeology:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px] pt-1">
              <a
                href="https://svs.gsfc.nasa.gov/4720/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-space-950/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 flex items-center justify-between transition-colors"
              >
                <span>NASA SVS CGI Moon Kit (#4720)</span>
                <span className="text-slate-500">↗</span>
              </a>
              <a
                href="https://quickmap.lroc.asu.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-space-950/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 flex items-center justify-between transition-colors"
              >
                <span>NASA LROC QuickMap (Full Zoom)</span>
                <span className="text-slate-500">↗</span>
              </a>
              <a
                href="https://trek.nasa.gov/moon/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-space-950/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 flex items-center justify-between transition-colors"
              >
                <span>NASA Moon Trek Portal</span>
                <span className="text-slate-500">↗</span>
              </a>
              <a
                href="http://localhost:3000/textures/moon_natural_8k.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-space-950/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-emerald-300 flex items-center justify-between transition-colors"
              >
                <span>View Local Raw 8K NASA Texture</span>
                <span className="text-slate-500">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

