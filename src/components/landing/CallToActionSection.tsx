import React from 'react';
import { Rocket, Compass, Sparkles, Globe2 } from 'lucide-react';

interface CallToActionSectionProps {
  onLaunchExplorer: () => void;
  onExploreMissions: () => void;
}

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({
  onLaunchExplorer,
  onExploreMissions
}) => {
  return (
    <section className="relative py-28 sm:py-36 w-full bg-space-950 border-t border-slate-900 overflow-hidden flex items-center justify-center">
      {/* Background celestial lunar glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-gradient-to-r from-cyan-600/15 via-blue-600/15 to-purple-600/15 rounded-full blur-[170px] pointer-events-none" />

      {/* Simulated Lunar Horizon Arc Curve */}
      <div className="absolute -bottom-[400px] left-1/2 -translate-x-1/2 w-[1400px] h-[600px] rounded-[100%] border-t-2 border-cyan-400/30 bg-gradient-to-b from-cyan-950/20 to-space-950 pointer-events-none shadow-[0_-30px_90px_rgba(6,182,212,0.15)]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Overhead badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-xs tracking-widest uppercase mb-6 shadow-lg shadow-cyan-950/50">
          <Globe2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>YOUR JOURNEY BEGINS</span>
        </div>

        {/* Closing Headline */}
        <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-sans leading-[1.1]">
          THE NEXT GIANT LEAP{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
            STARTS HERE.
          </span>
        </h2>

        {/* Supporting description */}
        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          The Moon is waiting to be explored. Begin your journey across its surface and
          discover the science, missions, and mysteries behind Earth's closest celestial neighbour.
        </p>

        {/* Primary & Secondary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
          <button
            onClick={onLaunchExplorer}
            className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-space-950 font-mono font-bold text-sm tracking-wider uppercase shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            <Rocket className="w-5 h-5 text-space-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>Launch SELENE 3D</span>
          </button>

          <button
            onClick={onExploreMissions}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-space-900/90 hover:bg-space-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-white font-mono text-sm tracking-wide transition-all shadow-lg backdrop-blur-md"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Explore Lunar Missions</span>
          </button>
        </div>

        {/* Technical compliance footnote */}
        <div className="mt-8 text-xs font-mono text-slate-500">
          Instant WebGL initialization • No installation required • NASA / ISRO Datasets
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;

