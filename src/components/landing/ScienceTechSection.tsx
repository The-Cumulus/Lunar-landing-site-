import React from 'react';
import { Database, Cpu, Layers, Sun, Radio, ShieldCheck, Activity, Terminal } from 'lucide-react';

export const ScienceTechSection: React.FC = () => {
  const datasets = [
    {
      title: 'NASA LROC WAC Mosaic',
      agency: 'NASA / ASU SOC',
      specs: '100 m/px • 7-band Multispectral',
      description: 'Acquired by the Lunar Reconnaissance Orbiter Camera Wide Angle Camera. Global calibrated photographic mosaic corrected for solar incidence angles.',
      type: 'Optical Surface Imagery',
      status: 'VERIFIED CALIBRATION'
    },
    {
      title: 'NASA LOLA Laser Altimetry DEM',
      agency: 'NASA GSFC / LRO',
      specs: '1024 px/deg • 6.5B+ Pulses',
      description: 'Lunar Orbiter Laser Altimeter digital elevation model measuring true lunar topography from deep South Pole-Aitken floor (-9.1 km) to highest highland peaks (+10.7 km).',
      type: 'Hypsometric Elevation',
      status: 'REAL LOLA DATASET'
    },
    {
      title: 'USGS Synthetic Hillshade',
      agency: 'USGS Astrogeology / PDS',
      specs: 'Raytraced Azimuth 315° • Altitude 45°',
      description: 'Synthetic solar hillshade illumination highlighting impact crater terraces, sinuous volcanic rilles, and fault grabens across the entire lunar globe.',
      type: 'Topographical Hillshade',
      status: 'PROCESSED SHADING'
    },
    {
      title: 'ISRO Chandrayaan-3 Data Archive',
      agency: 'ISRO / ISSDC',
      specs: '69.373° S Polar Geodetic Site',
      description: 'Direct in-situ observations from the Vikram lander and Pragyan rover, including ChaSTE thermal gradient profiling and LIBS elemental sulfur spectra.',
      type: 'In-Situ Polar Telemetry',
      status: 'AUTHENTIC ISRO DATA'
    }
  ];

  const technologies = [
    {
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      title: 'Real-Time GLSL Shaders',
      description: 'Custom WebGL fragment shaders dynamically calculate hypsometric elevation tint ramps, slope gradients, and surface roughness at 60 FPS.'
    },
    {
      icon: <Sun className="w-5 h-5 text-amber-400" />,
      title: 'Dynamic Solar Simulator',
      description: 'Interactive sub-solar azimuth and phase simulation computes the real-time lunar terminator line and realistic crater rim shadowing.'
    },
    {
      icon: <Terminal className="w-5 h-5 text-purple-400" />,
      title: 'IAU WGS-Lunar Geodesy',
      description: 'Precision spherical-to-Cartesian trigonometry mapping latitude and longitude into 3D space with horizon culling to eliminate occluded pins.'
    },
    {
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      title: 'Surface Raycast Tracker',
      description: 'Interactive mouse raycasting samples 3D surface coordinates and instantaneously queries LOLA elevation and slope without frame drops.'
    }
  ];

  return (
    <section id="science" className="relative py-24 sm:py-32 w-full bg-space-950/70 border-t border-slate-900 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-[170px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs tracking-widest uppercase mb-3.5">
            <Database className="w-3.5 h-3.5" />
            <span>AUTHENTIC PLANETARY DATASETS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            POWERED BY SCIENCE.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              BUILT FOR EXPLORATION.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            SELENE 3D processes petabytes of raw NASA, ISRO, and USGS planetary exploration
            data into an intuitive, high-performance three-dimensional interactive atlas.
          </p>
        </div>

        {/* Datasets 4-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {datasets.map((item, index) => (
            <div
              key={index}
              className="rounded-3xl bg-gradient-to-b from-space-900/90 to-space-950/90 border border-slate-800/80 p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all hover:shadow-xl hover:-translate-y-1 backdrop-blur-xl"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-3">
                  <span className="px-2 py-0.5 rounded bg-space-950 border border-slate-700/80 text-cyan-300">
                    {item.type}
                  </span>
                  <span className="text-emerald-400 font-bold">{item.status}</span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                <div className="text-xs text-slate-400 font-mono mb-3">{item.agency}</div>

                <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800 font-mono text-xs text-cyan-300 mb-4">
                  {item.specs}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Engineering Architecture Breakdown */}
        <div className="rounded-3xl bg-gradient-to-b from-space-900/80 to-space-950/90 border border-slate-800/80 p-6 sm:p-10 backdrop-blur-xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
              Real-Time WebGL Planetary Rendering Architecture
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-mono">
              Designed for smooth 60 FPS performance on both desktop workstations and mobile browsers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologies.map((tech, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-space-950/60 border border-slate-800/70 hover:border-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-space-900 border border-slate-800 flex items-center justify-center mb-4">
                  {tech.icon}
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{tech.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScienceTechSection;

