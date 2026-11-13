import React from 'react';
import { Rocket, Compass, ChevronDown, Sparkles, Orbit, Radio, ShieldCheck, Activity } from 'lucide-react';
import { HeroMoonCanvas } from './HeroMoonCanvas';

interface HeroSectionProps {
  onLaunchExplorer: () => void;
  onExploreMissions: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLaunchExplorer,
  onExploreMissions
}) => {
  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-20 pb-16 lg:py-0"
    >
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Subtle coordinate grid lines overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center min-h-[calc(100vh-5rem)]">
        {/* Left Column: Cinematic Headline & Call-To-Actions */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6 pt-4 lg:pt-0">
          {/* Introductory Technical Tag */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-xs tracking-wider uppercase backdrop-blur-md self-start shadow-lg shadow-cyan-950/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span>NASA / ISRO / LROC DATA-POWERED EXPLORATION</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-sans">
            EXPLORE THE MOON.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              BEYOND WHAT WE SEE.
            </span>
          </h1>

          {/* Supporting Description */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            Discover the Moon through high-resolution lunar imagery, scientific datasets,
            mission discoveries, and an interactive three-dimensional exploration experience.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <button
              onClick={onLaunchExplorer}
              className="group flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-space-950 font-mono font-bold text-sm tracking-wider uppercase shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Rocket className="w-4 h-4 text-space-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Explore The Moon</span>
            </button>

            <button
              onClick={onExploreMissions}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-space-900/90 hover:bg-space-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-white font-mono text-sm tracking-wide transition-all shadow-lg backdrop-blur-md"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Discover The Missions</span>
            </button>
          </div>

          {/* Live Quick Telemetry Banner */}
          <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg border-t border-slate-800/80 font-mono text-xs">
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Mean Radius</div>
              <div className="font-bold text-slate-200">1,737.4 km</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase">LOLA Elevation</div>
              <div className="font-bold text-cyan-300">-9.1km to +10.7km</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Surface Gravity</div>
              <div className="font-bold text-slate-200">1.62 m/s² (0.166g)</div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D High-Res Moon with Floating Data Badges */}
        <div className="lg:col-span-6 relative w-full h-[420px] sm:h-[500px] lg:h-[620px] flex items-center justify-center">
          {/* Soft Celestial Radial Glow behind Moon - blends edges smoothly into space */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[420px] sm:w-[500px] h-[420px] sm:h-[500px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.13)_0%,_rgba(14,165,233,0.04)_42%,_transparent_72%)] blur-3xl pointer-events-none" />
          </div>

          {/* 3D Moon Canvas Container */}
          <div className="w-full h-full relative">
            <HeroMoonCanvas />

            {/* Floating Scientific Data Labels around the Moon */}
            {/* Badge 1: Top Right */}
            <div className="absolute top-2 sm:top-5 right-1 sm:right-4 z-20 pointer-events-none animate-fadeIn hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-space-950/85 border border-cyan-500/40 shadow-xl backdrop-blur-md font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400">LROC WAC MOSAIC</div>
                <div className="text-white font-bold">100 m/px Resolution</div>
              </div>
            </div>

            {/* Badge 2: Bottom Left */}
            <div className="absolute bottom-6 sm:bottom-10 left-1 sm:left-4 z-20 pointer-events-none animate-fadeIn hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-space-950/85 border border-slate-700/80 shadow-xl backdrop-blur-md font-mono text-xs">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400">EARTH DISTANCE</div>
                <div className="text-amber-200 font-bold">384,400 km Avg</div>
              </div>
            </div>

            {/* Badge 3: Bottom Right */}
            <div className="absolute bottom-8 right-2 sm:right-4 z-20 pointer-events-none animate-fadeIn hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-space-950/85 border border-slate-700/80 shadow-xl backdrop-blur-md font-mono text-xs">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <div className="text-[10px] text-slate-400">POLAR THERMAL</div>
                <div className="text-purple-300 font-bold">&lt; 40 K (-233°C)</div>
              </div>
            </div>

            {/* Interactive hint pill */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-space-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 whitespace-nowrap">
              <Orbit className="w-3 h-3 text-cyan-400" />
              <span>Drag to rotate Moon in 3D</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Down Indicator */}
      <div
        onClick={onExploreMissions}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 cursor-pointer text-slate-500 hover:text-cyan-400 transition-colors group"
      >
        <span className="text-[10px] font-mono tracking-widest uppercase">Scroll to explore</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-cyan-400" />
      </div>
    </section>
  );
};

export default HeroSection;

