import React, { useState } from 'react';
import { Rocket, Calendar, Flag, Award, ChevronRight, X, ExternalLink, Compass, ShieldCheck } from 'lucide-react';

export interface MissionData {
  id: string;
  name: string;
  program: string;
  agency: string;
  country: string;
  date: string;
  tagline: string;
  description: string;
  achievements: string[];
  keyPayloads: string[];
  landingSites: string;
  accentColor: string;
  badge: string;
}

const MISSIONS: MissionData[] = [
  {
    id: 'apollo',
    name: 'Apollo Program',
    program: 'Apollo 11, 12, 14, 15, 16, 17',
    agency: 'NASA',
    country: 'United States',
    date: '1969 – 1972',
    tagline: 'First human footprints on an extraterrestrial celestial body',
    description: 'Project Apollo successfully landed 12 American astronauts on the lunar surface between 1969 and 1972, inaugurating humanity\'s crewed exploration of deep space. Crews deployed surface experiment packages (ALSEP) and returned 382 kg of ancient lunar rock and core samples.',
    achievements: [
      '6 successful crewed lunar landings across diverse geological terrains',
      'Returned 382 kg of lunar rocks, impact breccias, and deep drill cores',
      'Deployed Laser Ranging Retroreflectors (LRRR) still operational today',
      'Traversed over 90 km using the Lunar Roving Vehicle (LRV)'
    ],
    keyPayloads: [
      'Early Apollo Surface Experiments Package (EASEP)',
      'Passive Seismic Experiment (discovered moonquakes)',
      'Solar Wind Composition Experiment (SWCE)',
      'Lunar Surface Magnetometer (LSM)'
    ],
    landingSites: 'Mare Tranquillitatis, Oceanus Procellarum, Fra Mauro, Hadley-Apennine, Descartes Highlands, Taurus-Littrow',
    accentColor: '#38bdf8',
    badge: 'NASA CREWED'
  },
  {
    id: 'chandrayaan-3',
    name: 'Chandrayaan-3',
    program: 'Vikram Lander & Pragyan Rover',
    agency: 'ISRO',
    country: 'India',
    date: 'August 23, 2023',
    tagline: 'Historic first soft-landing in the lunar southern high latitudes',
    description: 'On August 23, 2023, ISRO\'s Chandrayaan-3 mission achieved a historic milestone by executing the world\'s first successful soft landing in the lunar southern polar region (69.37° S) at "Shiv Shakti Point". The Pragyan rover traversed the polar regolith confirming in-situ presence of elemental sulfur.',
    achievements: [
      'First nation in human history to soft-land near the lunar South Pole',
      'First in-situ measurement of polar subsurface thermal conductivity gradient via ChaSTE',
      'Laser-Induced Breakdown Spectroscopy (LIBS) confirmed elemental sulfur in regolith',
      'Alpha Particle X-ray Spectrometer (APXS) detected Al, Ca, Fe, Cr, and Ti'
    ],
    keyPayloads: [
      'ChaSTE (Chandra\'s Surface Thermophysical Experiment)',
      'ILSA (Instrument for Lunar Seismic Activity)',
      'LIBS (Laser-Induced Breakdown Spectroscope)',
      'RAMBHA-LP (Langmuir Probe for plasma density)'
    ],
    landingSites: 'Shiv Shakti Point (69.373° S, 32.319° E)',
    accentColor: '#fb923c',
    badge: 'ISRO POLAR'
  },
  {
    id: 'artemis',
    name: 'Artemis Program',
    program: 'Artemis II & III Crewed Polar Return',
    agency: 'NASA & Coalition',
    country: 'International Coalition',
    date: '2024 – 2030+',
    tagline: 'Returning humanity to the South Pole for permanent exploration',
    description: 'NASA\'s Artemis program is leading an international coalition (ESA, JAXA, CSA) to land the first woman and person of color on the Moon. Targeting extreme South Polar terrain with Peaks of Eternal Light and Permanently Shadowed Regions (PSRs) harboring water ice reserves.',
    achievements: [
      'Artemis I uncrewed Orion spacecraft 1.4-million-mile test flight around the Moon',
      'Identification of 13 refined Artemis III candidate polar landing regions',
      'Development of commercial Human Landing Systems (SpaceX Starship HLS & Blue Origin)',
      'Lunar Gateway orbital station planning for long-duration deep space staging'
    ],
    keyPayloads: [
      'VIPER Rover (Volatiles Investigating Polar Exploration Rover)',
      'Neutron Spectrometer System (NSS) for subsurface hydrogen detection',
      'Next-gen xEMU Extravehicular Surface Mobility Suits',
      'Surface Fission Power System & In-Situ Resource Utilization (ISRU)'
    ],
    landingSites: 'Shackleton Connecting Ridge, Malapert Mountain, Haworth Rim, Nobile Rim, Faustini Rim',
    accentColor: '#a855f7',
    badge: 'HUMAN EXPLORATION'
  },
  {
    id: 'change',
    name: 'Chang\'e Program',
    program: 'Chang\'e 3, 4, 5, 6 Robotic System',
    agency: 'CNSA',
    country: 'China',
    date: '2013 – 2024+',
    tagline: 'Pioneering Far Side exploration and automated sample returns',
    description: 'China\'s lunar exploration program achieved historic firsts with Chang\'e 4 making the first-ever soft landing on the lunar Far Side inside Von Kármán crater. Chang\'e 5 and Chang\'e 6 executed autonomous robotic sampling returns from both Nearside young basalts and the deep Far Side.',
    achievements: [
      'First robotic touchdown on the lunar Far Side (Chang\'e 4 & Yutu-2 rover, 2019)',
      'Queqiao Earth-Moon L2 halo orbit relay communication infrastructure',
      'Chang\'e 5 returned 1.731 kg of youngest lunar mare basalt (2.0 billion years old)',
      'Chang\'e 6 historic first sample return from the Far Side South Pole-Aitken Basin (2024)'
    ],
    keyPayloads: [
      'Visible and Near-Infrared Spectrometer (VNIS)',
      'Lunar Penetrating Radar (LPR down to 40 meters)',
      'Autonomous Robotic Lunar Core Drill and Vacuum Sealer',
      'Lunar Dust and Environment Monitor'
    ],
    landingSites: 'Von Kármán Basin (Far Side), Oceanus Procellarum, South Pole-Aitken Basin (Apollo Rim)',
    accentColor: '#ef4444',
    badge: 'CNSA DEEP SPACE'
  }
];

interface MissionsSectionProps {
  onLaunchExplorer: (siteId?: string) => void;
}

export const MissionsSection: React.FC<MissionsSectionProps> = ({ onLaunchExplorer }) => {
  const [selectedMission, setSelectedMission] = useState<MissionData | null>(null);

  return (
    <section id="missions" className="relative py-24 sm:py-32 w-full bg-space-950/80 border-t border-slate-900 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 right-10 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs tracking-widest uppercase mb-3.5">
            <Rocket className="w-3.5 h-3.5" />
            <span>GLOBAL SPACE MISSIONS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            THE MISSIONS THAT{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              BROUGHT US CLOSER.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            From mankind's first steps to autonomous polar rovers and upcoming crewed lunar
            outposts, explore the historic voyages that unraveled the secrets of the Moon.
          </p>
        </div>

        {/* 4 Major Mission Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MISSIONS.map((mission) => (
            <div
              key={mission.id}
              className="group relative rounded-3xl bg-gradient-to-b from-space-900/95 to-space-950/95 border border-slate-800/80 hover:border-cyan-500/50 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1.5 backdrop-blur-xl"
            >
              {/* Accent colored top highlight line */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl transition-opacity opacity-75 group-hover:opacity-100"
                style={{ backgroundColor: mission.accentColor }}
              />

              <div>
                {/* Agency & Program Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                    style={{
                      color: mission.accentColor,
                      borderColor: `${mission.accentColor}55`,
                      backgroundColor: `${mission.accentColor}15`
                    }}
                  >
                    {mission.badge}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{mission.date}</span>
                  </span>
                </div>

                {/* Mission Name */}
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {mission.name}
                </h3>
                <div className="text-xs text-slate-400 font-mono mb-3">
                  {mission.agency} • {mission.country}
                </div>

                {/* Tagline */}
                <p className="text-xs text-cyan-200/90 font-medium italic mb-4 border-l-2 pl-2.5" style={{ borderColor: mission.accentColor }}>
                  "{mission.tagline}"
                </p>

                {/* Brief scientific description */}
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-6 font-normal">
                  {mission.description}
                </p>
              </div>

              {/* Actions: Learn More modal trigger & Globe launch */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedMission(mission)}
                  className="text-xs font-mono font-semibold text-slate-300 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <span>Scientific Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onLaunchExplorer(mission.id === 'chandrayaan-3' ? 'chandrayaan-3' : undefined)}
                  className="p-2 rounded-xl bg-space-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 hover:text-white transition-colors"
                  title="View mission landing sites in 3D"
                >
                  <Rocket className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission Scientific Dossier Modal */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className="w-full max-w-2xl rounded-3xl bg-space-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative text-slate-100 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedMission(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-space-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-2 font-mono text-xs">
              <span
                className="px-2 py-0.5 rounded font-bold uppercase"
                style={{
                  color: selectedMission.accentColor,
                  backgroundColor: `${selectedMission.accentColor}20`
                }}
              >
                {selectedMission.agency}
              </span>
              <span className="text-slate-400">• {selectedMission.country}</span>
              <span className="text-slate-400">• {selectedMission.date}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {selectedMission.name}
            </h2>
            <p className="text-sm text-cyan-300 font-mono italic mb-4">
              "{selectedMission.tagline}"
            </p>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {selectedMission.description}
            </p>

            {/* Mission Key Achievements */}
            <div className="mb-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>Major Scientific Achievements</span>
              </h4>
              <ul className="space-y-1.5">
                {selectedMission.achievements.map((ach, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Payloads */}
            <div className="mb-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Primary Scientific Payloads</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedMission.keyPayloads.map((payload, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-space-950 border border-slate-800 text-xs text-slate-300 font-mono">
                    {payload}
                  </div>
                ))}
              </div>
            </div>

            {/* Landing Coordinates / Regions */}
            <div className="mb-6 p-3 rounded-2xl bg-space-950/70 border border-slate-800 font-mono text-xs">
              <div className="text-[10px] text-slate-500 uppercase mb-1">Target Sites & Coordinates</div>
              <div className="text-cyan-300 font-semibold">{selectedMission.landingSites}</div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedMission(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-space-950 hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold transition-all"
              >
                Close Dossier
              </button>

              <button
                onClick={() => {
                  const targetId = selectedMission.id === 'chandrayaan-3' ? 'chandrayaan-3' : selectedMission.id === 'apollo' ? 'apollo-11' : undefined;
                  setSelectedMission(null);
                  onLaunchExplorer(targetId);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-space-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25"
              >
                <Rocket className="w-4 h-4" />
                <span>View on 3D Globe</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MissionsSection;

