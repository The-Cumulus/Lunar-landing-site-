import React from 'react';
import { Globe2, Rocket, ExternalLink, ShieldCheck, Database, Compass } from 'lucide-react';

interface LandingFooterProps {
  onLaunchExplorer: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onLaunchExplorer }) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="about" className="relative w-full bg-space-950 border-t border-slate-900 text-slate-400 font-sans pt-16 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Column 1: Brand & Description (2 cols on large) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-space-900 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/60">
                <Globe2 className="w-5 h-5 animate-pulse-subtle" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
                  SELENE<span className="text-cyan-400 font-extrabold">3D</span>
                </span>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  Photographic Lunar Globe & Exploration Portal
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal max-w-sm">
              An interactive 3D digital atlas processing raw lunar datasets from NASA, ISRO,
              and USGS into a real-time, hardware-accelerated exploration experience.
            </p>

            <div className="pt-2">
              <button
                onClick={onLaunchExplorer}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white font-mono text-xs font-semibold transition-all shadow-md"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Launch Interactive Atlas</span>
              </button>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3 font-mono text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-200">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('hero')} className="hover:text-cyan-300 transition-colors">
                  Home (Top)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('explore')} className="hover:text-cyan-300 transition-colors">
                  Platform Overview
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('missions')} className="hover:text-cyan-300 transition-colors">
                  Lunar Missions
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('discoveries')} className="hover:text-cyan-300 transition-colors">
                  Geological Discoveries
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('science')} className="hover:text-cyan-300 transition-colors">
                  Science & Technology
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Featured Missions */}
          <div className="space-y-3 font-mono text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-200">Missions</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('missions')} className="hover:text-cyan-300 transition-colors">
                  Apollo 11–17 (NASA)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('missions')} className="hover:text-cyan-300 transition-colors">
                  Chandrayaan-3 (ISRO)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('missions')} className="hover:text-cyan-300 transition-colors">
                  Artemis III Polar Candidate
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('missions')} className="hover:text-cyan-300 transition-colors">
                  Chang'e 4 Far Side (CNSA)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('discoveries')} className="hover:text-cyan-300 transition-colors">
                  Shackleton South Pole Rim
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Data Source Credits */}
          <div className="space-y-3 font-mono text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-200">NASA & Data Credits</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a
                  href="https://svs.gsfc.nasa.gov/4720/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
                >
                  <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>NASA SVS CGI Moon Kit (#4720) ↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://quickmap.lroc.asu.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
                >
                  <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>LROC Science Center (QuickMap) ↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://trek.nasa.gov/moon/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
                >
                  <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>NASA Moon Trek Portal ↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://pds.nasa.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
                >
                  <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>NASA Planetary Data System ↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://astrogeology.usgs.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
                >
                  <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>USGS Astrogeology Center ↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Attribution Banner */}
        <div className="pt-8 space-y-4 text-xs font-mono text-slate-500">
          <div className="p-4 rounded-2xl bg-space-900/60 border border-slate-800/80 leading-relaxed text-slate-400">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Scientific Attribution & Fair Use Disclaimer</span>
            </div>
            <p>
              SELENE 3D is an independent educational and scientific exploration platform.
              Photographic mosaics, topographical elevation datasets, spacecraft telemetry, and
              nomenclature are credited to NASA, ISRO, CNSA, and USGS. This website is not
              officially affiliated with or endorsed by NASA, ISRO, or any government agency.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px]">
            <div>
              © {new Date().getFullYear()} SELENE 3D. Designed for Space Exploration & Planetary Science.
            </div>
            <div className="flex items-center gap-3 text-cyan-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYSTEM STATUS: ALL SENSORS NOMINAL • LOLA DEM V4.2</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;

