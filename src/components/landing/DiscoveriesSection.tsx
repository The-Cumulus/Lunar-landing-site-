import React, { useState } from 'react';
import { Mountain, Compass, Sparkles, Activity, Layers, Crosshair, ArrowRight } from 'lucide-react';

interface DiscoveryFeature {
  id: string;
  category: string;
  name: string;
  subtitle: string;
  depthOrHeight: string;
  coordinates: string;
  age: string;
  scientificFact: string;
  description: string;
  significance: string;
  badge: string;
  color: string;
}

const DISCOVERY_FEATURES: DiscoveryFeature[] = [
  {
    id: 'shackleton',
    category: 'Polar Cold Trap & Artemis Base',
    name: 'Shackleton Crater',
    subtitle: 'Lunar South Pole Geodetic Datum (89.67° S)',
    depthOrHeight: '4.2 km Depth • 21 km Diameter',
    coordinates: '89.67° S, 129.78° E',
    age: '3.6 Billion Years (Imbrian)',
    scientificFact: 'Floor remains at a perpetual cryogenic 40 K (-233°C), preserving primordial ice volatiles.',
    description: 'Situated at the southern axis of rotation, Shackleton\'s illuminated rim peaks receive near-continuous sunlight (up to 90% of the year), making it the premier target for human base camp power generation. Inside, perpetual darkness shields deep water-ice deposits from solar sublimination.',
    significance: 'Key site for NASA Artemis base camp and ISRU (In-Situ Resource Utilization) water ice extraction.',
    badge: 'WATER ICE COLD TRAP',
    color: '#38bdf8'
  },
  {
    id: 'tycho',
    category: 'Impact Crater & Giant Ray System',
    name: 'Tycho Crater',
    subtitle: 'Southern Lunar Highlands Benchmark',
    depthOrHeight: '4.8 km Depth • 85 km Diameter',
    coordinates: '43.31° S, 11.20° W',
    age: '108 Million Years (Cretaceous)',
    scientificFact: 'Central mountain peak rises 2.0 km above the crater floor with prominent terraced walls.',
    description: 'One of the youngest and most prominent impact structures on the Moon. Its bright ejecta rays extend over 1,500 kilometers across the near side, serving as a primary chronostratigraphic calibration anchor for planetary impact dating across the solar system.',
    significance: 'Surveyed by Surveyor 7 in 1968; ejecta materials were sampled indirectly by Apollo 17.',
    badge: 'CHRONOLOGY ANCHOR',
    color: '#fbbf24'
  },
  {
    id: 'south-pole-aitken',
    category: 'Deepest Solar System Impact Basin',
    name: 'South Pole-Aitken (SPA) Basin',
    subtitle: 'Ancient Far-Side Giant Impact Structure',
    depthOrHeight: '-9,150 m Minimum Elevation • 2,500 km Diameter',
    coordinates: '53.00° S, 169.00° W (Antoniadi)',
    age: '4.3 Billion Years (Pre-Nectarian)',
    scientificFact: 'Excavated deep through the entire lunar crust, exposing deep-seated lower crust and upper mantle.',
    description: 'The largest, deepest, and oldest recognized impact basin on the Moon. The catastrophic excavation punctured through the upper crust, exposing iron- and magnesium-rich pyroxene minerals that hold vital clues about the Moon\'s internal magma ocean differentiation.',
    significance: 'Explored by China\'s Chang\'e 4 (Von Kármán) and sample returned by Chang\'e 6 in 2024.',
    badge: 'MANTLE EXCAVATION',
    color: '#a855f7'
  },
  {
    id: 'mare-tranquillitatis',
    category: 'Ancient Volcanic Basalt Plain',
    name: 'Mare Tranquillitatis',
    subtitle: 'Sea of Tranquility & Apollo 11 Touchdown',
    depthOrHeight: 'Average -2,570 m Elevation • 873 km Diameter',
    coordinates: '0.67° N, 23.47° E',
    age: '3.8 to 3.5 Billion Years',
    scientificFact: 'Dense ilmenite-rich basalt flows contain up to 13 wt% titanium dioxide (TiO₂).',
    description: 'A dark, expansive volcanic flood basalt plain filling an ancient impact basin. Characterized by high titanium content, wrinkle ridges, and the historic touchdown of Apollo 11 Lunar Module "Eagle" at Tranquility Base on July 20, 1969.',
    significance: 'Provided the first planetary basalt rock samples ever analyzed in Earth laboratories.',
    badge: 'HISTORIC TOUCHDOWN',
    color: '#34d399'
  }
];

interface DiscoveriesSectionProps {
  onLaunchExplorer: (siteId?: string) => void;
}

export const DiscoveriesSection: React.FC<DiscoveriesSectionProps> = ({ onLaunchExplorer }) => {
  const [activeTab, setActiveTab] = useState<string>(DISCOVERY_FEATURES[0].id);

  const activeFeature = DISCOVERY_FEATURES.find(f => f.id === activeTab) || DISCOVERY_FEATURES[0];

  return (
    <section id="discoveries" className="relative py-24 sm:py-32 w-full bg-space-950 border-t border-slate-900 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs tracking-widest uppercase mb-3.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LUNAR GEOLOGY & FORMATIONS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            DISCOVER THE SECRETS OF THE{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              MOON.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Explore the geological wonders sculpted by billions of years of cosmic impacts,
            ancient volcanic basalt flows, and extreme polar shadow traps.
          </p>
        </div>

        {/* Feature Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 font-mono text-xs">
          {DISCOVERY_FEATURES.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveTab(feature.id)}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === feature.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-lg shadow-cyan-950/50'
                  : 'bg-space-900/60 hover:bg-space-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: feature.color }} />
              <span>{feature.name}</span>
            </button>
          ))}
        </div>

        {/* Active Feature Showcase Panel */}
        <div className="rounded-3xl bg-gradient-to-b from-space-900/90 to-space-950/90 border border-slate-800/80 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          {/* Top colored accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1 transition-all"
            style={{ backgroundColor: activeFeature.color }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Description & Verified Science */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs">
                  <span
                    className="px-2 py-0.5 rounded font-bold uppercase"
                    style={{
                      color: activeFeature.color,
                      backgroundColor: `${activeFeature.color}15`,
                      border: `1px solid ${activeFeature.color}40`
                    }}
                  >
                    {activeFeature.badge}
                  </span>
                  <span className="text-slate-400">• {activeFeature.category}</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                  {activeFeature.name}
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  {activeFeature.subtitle}
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                {activeFeature.description}
              </p>

              {/* Scientific Fact Callout Card */}
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
                <Activity className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide">
                    Verified NASA/LOLA Observation
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200 mt-1">
                    {activeFeature.scientificFact}
                  </div>
                </div>
              </div>

              {/* Key Exploration Significance */}
              <div className="text-xs text-slate-400 font-mono border-l-2 pl-3" style={{ borderColor: activeFeature.color }}>
                <span className="text-slate-300 font-bold">Scientific Exploration: </span>
                <span>{activeFeature.significance}</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onLaunchExplorer(activeFeature.id === 'shackleton' ? 'shackleton-crater' : activeFeature.id === 'south-pole-aitken' ? 'south-pole-aitken-basin' : activeFeature.id === 'tycho' ? 'tycho-crater' : 'apollo-11')}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-space-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25"
                >
                  <Compass className="w-4 h-4 text-space-950" />
                  <span>Fly To {activeFeature.name} on 3D Moon</span>
                </button>
              </div>
            </div>

            {/* Right Column: Telemetry Cards & Geological Fact Panel */}
            <div className="lg:col-span-5 space-y-3.5 font-mono">
              <div className="p-4 rounded-2xl bg-space-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                  <span>Geodetic Coordinates</span>
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-base font-bold text-white mt-1">
                  {activeFeature.coordinates}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-space-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                  <span>Topographic Dimensions</span>
                  <Mountain className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-base font-bold text-amber-200 mt-1">
                  {activeFeature.depthOrHeight}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-space-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                  <span>Geological Period & Age</span>
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-base font-bold text-purple-300 mt-1">
                  {activeFeature.age}
                </div>
              </div>

              {/* High-res technical banner */}
              <div className="p-4 rounded-2xl bg-space-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <span>Calibrated with USGS Planetary Nomenclature & NASA LOLA DEM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscoveriesSection;

