import React from 'react';
import { Globe2, Layers, Rocket, ArrowRight, Activity, Compass, Eye } from 'lucide-react';

interface IntroductionSectionProps {
  onLaunchExplorer: () => void;
  onExploreMissions: () => void;
  onExploreScience: () => void;
}

export const IntroductionSection: React.FC<IntroductionSectionProps> = ({
  onLaunchExplorer,
  onExploreMissions,
  onExploreScience
}) => {
  return (
    <section id="explore" className="relative py-24 sm:py-32 w-full bg-space-950/70 border-t border-slate-900 overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs tracking-widest uppercase mb-3.5">
            <span>ABOUT THE PLATFORM</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            THE MOON, <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">REIMAGINED.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            SELENE 3D is an interactive lunar exploration platform that brings together
            scientific observations, photographic lunar maps, topographical information,
            and historical and upcoming lunar missions in one immersive experience.
          </p>
        </div>

        {/* 3 Visual Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1: Interactive Lunar Globe */}
          <div
            onClick={onLaunchExplorer}
            className="group relative rounded-3xl bg-gradient-to-b from-space-900/95 to-space-950/95 border border-slate-800/80 hover:border-cyan-500/50 p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl"
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-sky-400 opacity-60 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Globe2 className="w-6 h-6 animate-pulse-subtle" />
                </div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
                  WebGL 60FPS
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                Interactive Lunar Globe
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Explore a realistic 3D Moon with detailed surface imagery, smooth orbit
                controls, day/night solar terminator lighting, and interactive navigation.
              </p>

              {/* Technical features tags */}
              <div className="space-y-1.5 font-mono text-xs text-slate-400 border-t border-slate-800/60 pt-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>NASA LROC 100 m/px Photographic Mosaic</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Dynamic Real-Time Solar Angle Simulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Horizon-Culled Surface POI Markers</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold group-hover:text-cyan-300 pt-2">
              <span>Launch 3D Globe</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Scientific Lunar Data */}
          <div
            onClick={onExploreScience}
            className="group relative rounded-3xl bg-gradient-to-b from-space-900/95 to-space-950/95 border border-slate-800/80 hover:border-amber-500/50 p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400 opacity-60 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">
                  LOLA DEM V4.2
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
                Scientific Lunar Data
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Discover elevation maps, shaded relief, surface features, and scientific datasets
                derived from over 6.5 billion laser altimeter measurements.
              </p>

              <div className="space-y-1.5 font-mono text-xs text-slate-400 border-t border-slate-800/60 pt-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Hypsometric Elevation Tint (-9km to +10.7km)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Real-time Slope & Surface Roughness Shader</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>High-Contrast Synthetic Hillshade Illumination</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold group-hover:text-amber-300 pt-2">
              <span>View Scientific Datasets</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Mission Exploration */}
          <div
            onClick={onExploreMissions}
            className="group relative rounded-3xl bg-gradient-to-b from-space-900/95 to-space-950/95 border border-slate-800/80 hover:border-purple-500/50 p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Rocket className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60">
                  29+ SITES
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                Mission Exploration
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Explore landing sites, spacecraft missions, and discoveries from international space
                agencies including NASA, ISRO, CNSA, and future Artemis polar sites.
              </p>

              <div className="space-y-1.5 font-mono text-xs text-slate-400 border-t border-slate-800/60 pt-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Apollo 11–17 Crewed Landing Sites</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Chandrayaan-3 Shiv Shakti Polar Landmark</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Artemis III Candidate South Pole Zones</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-semibold group-hover:text-purple-300 pt-2">
              <span>Explore Missions</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroductionSection;

