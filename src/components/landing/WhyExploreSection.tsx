import React from 'react';
import { Orbit, Eye, Layers, Compass, Crosshair, Sparkles, CheckCircle2 } from 'lucide-react';

export const WhyExploreSection: React.FC = () => {
  const capabilities = [
    {
      icon: <Orbit className="w-5 h-5 text-cyan-400" />,
      title: '60 FPS Fullscreen Orbit',
      subtitle: 'GPU-ACCELERATED THREE.JS',
      description: 'Interact with a complete 3D lunar sphere featuring zero camera lag, smooth lerp fly-to animations, and responsive zoom.',
      badge: 'SMOOTH LERP'
    },
    {
      icon: <Eye className="w-5 h-5 text-sky-400" />,
      title: 'Photographic 8K Resolution',
      subtitle: 'LROC WAC MOSAIC',
      description: 'Study realistic crater textures, impact ejecta blankets, and dark basalt maria at authentic visual fidelity.',
      badge: 'NASA 8K/2K'
    },
    {
      icon: <Layers className="w-5 h-5 text-amber-400" />,
      title: 'Real LOLA Elevation & Slope',
      subtitle: 'DIGITAL ELEVATION MODEL',
      description: 'Instant point-by-point height measurements in meters, surface gradients, and continuous false-color hypsometric tinting.',
      badge: '6.5B PULSES'
    },
    {
      icon: <Compass className="w-5 h-5 text-orange-400" />,
      title: '29+ International Landing Sites',
      subtitle: 'APOLLO • ISRO • ARTEMIS • CHANG\'E',
      description: 'Explore historic and planned touchdown coordinates complete with astronaut crews, sample weights, and scientific payloads.',
      badge: 'GLOBAL MISSIONS'
    },
    {
      icon: <Crosshair className="w-5 h-5 text-emerald-400" />,
      title: 'Precision Coordinate Search',
      subtitle: 'WGS-LUNAR & DMS NAVIGATION',
      description: 'Search any lunar location by decimal degrees or degrees-minutes-seconds, with automatic camera centering and distance calculation.',
      badge: 'IAU GEODESY'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      title: 'Dynamic Solar Simulator',
      subtitle: 'REAL-TIME TERMINATOR ILLUMINATION',
      description: 'Control the sub-solar angle and witness realistic terminator shadows stretch across crater walls and polar ridges in real time.',
      badge: 'SHADOW ENGINE'
    }
  ];

  return (
    <section id="why-explore" className="relative py-24 sm:py-32 w-full bg-space-950 border-t border-slate-900 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-600/5 rounded-full blur-[170px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs tracking-widest uppercase mb-3.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            WHY EXPLORE WITH{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              SELENE 3D?
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Engineered with the visual standards of modern space agencies and the computational
            precision demanded by planetary science researchers.
          </p>
        </div>

        {/* 6 Futuristic Dashboard-Style Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((item, index) => (
            <div
              key={index}
              className="group relative rounded-3xl bg-gradient-to-b from-space-900/90 to-space-950/95 border border-slate-800/80 hover:border-cyan-500/50 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 backdrop-blur-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-space-950 border border-slate-800 group-hover:border-cyan-500/40 flex items-center justify-center transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-space-950 border border-slate-800">
                    {item.badge}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase mb-1">
                  {item.subtitle}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-2.5">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyExploreSection;

