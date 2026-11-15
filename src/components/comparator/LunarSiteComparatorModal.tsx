import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  GitCompare,
  ArrowLeftRight,
  RotateCcw,
  Sparkles,
  Sun,
  Radio,
  Mountain,
  TrendingUp,
  Activity,
  Thermometer,
  ShieldCheck,
  Compass,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  Droplets,
  Zap,
  Flame,
  Wind,
  Layers,
  Hammer,
  Box,
  FlaskConical,
  Atom,
  Boxes
} from 'lucide-react';
import {
  SiteInput,
  ComparisonReport,
  compareLunarSites,
  ParameterComparison,
  ResourceComparison
} from '../../utils/lunarComparison';
import { LunarComparatorMap } from './LunarComparatorMap';
import { LUNAR_POIS } from '../../data/lunarPOIs';

interface LunarSiteComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSite1?: { name: string; lat: number; lng: number };
  initialSite2?: { name: string; lat: number; lng: number };
}

// Curated scientific comparison presets
const COMPARISON_PRESETS = [
  {
    title: 'Apollo 11 vs. Shackleton Crater',
    tag: 'Equatorial Mare (Fe, TiO₂, He-3) vs. South Pole PSR (H₂O, CO₂, NH₃)',
    site1: { name: 'Apollo 11 (Tranquility Base)', lat: 0.6740, lng: 23.4730 },
    site2: { name: 'Shackleton Crater (South Pole)', lat: -89.6700, lng: 129.7800 }
  },
  {
    title: 'Artemis III vs. Chandrayaan-3',
    tag: 'Polar Ridge (Peaks of Light) vs. High-Latitude Plain',
    site1: { name: 'Artemis III Connecting Ridge', lat: -89.9000, lng: 0.0000 },
    site2: { name: 'Chandrayaan-3 (Shiv Shakti)', lat: -69.3730, lng: 32.3190 }
  },
  {
    title: 'Oceanus Procellarum vs. Chang\'e 4',
    tag: 'Young High-Ti Basalts vs. Far-Side SPA Basin (Mantle)',
    site1: { name: 'Oceanus Procellarum (Mare Plain)', lat: 18.0000, lng: -57.0000 },
    site2: { name: 'Chang\'e 4 (Von Kármán Basin)', lat: -45.4500, lng: 177.6000 }
  },
  {
    title: 'Tycho Crater Peak vs. Mare Tranquillitatis',
    tag: 'Impact Central Uplift (Al, Si) vs. Flood Basalt (Fe, TiO₂)',
    site1: { name: 'Tycho Crater Central Peak', lat: -43.3100, lng: -11.2000 },
    site2: { name: 'Mare Tranquillitatis Plain', lat: 8.0000, lng: 31.0000 }
  }
];

export const LunarSiteComparatorModal: React.FC<LunarSiteComparatorModalProps> = ({
  isOpen,
  onClose,
  initialSite1 = { name: 'Apollo 11 Base', lat: 0.6740, lng: 23.4730 },
  initialSite2 = { name: 'Shackleton Crater Rim', lat: -89.6700, lng: 129.7800 }
}) => {
  // Input fields for Site 01
  const [site1Name, setSite1Name] = useState(initialSite1.name);
  const [site1Lat, setSite1Lat] = useState(initialSite1.lat.toString());
  const [site1Lng, setSite1Lng] = useState(initialSite1.lng.toString());

  // Input fields for Site 02
  const [site2Name, setSite2Name] = useState(initialSite2.name);
  const [site2Lat, setSite2Lat] = useState(initialSite2.lat.toString());
  const [site2Lng, setSite2Lng] = useState(initialSite2.lng.toString());

  // Active target site for click-on-map
  const [activeMapTarget, setActiveMapTarget] = useState<'site1' | 'site2'>('site1');

  // Active comparison report
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'all' | 'resources' | 'volatiles' | 'minerals' | 'physical'
  >('all');

  // Input validation
  const parsed1Lat = parseFloat(site1Lat);
  const parsed1Lng = parseFloat(site1Lng);
  const is1Valid = !isNaN(parsed1Lat) && !isNaN(parsed1Lng) && parsed1Lat >= -90 && parsed1Lat <= 90 && parsed1Lng >= -180 && parsed1Lng <= 180;

  const parsed2Lat = parseFloat(site2Lat);
  const parsed2Lng = parseFloat(site2Lng);
  const is2Valid = !isNaN(parsed2Lat) && !isNaN(parsed2Lng) && parsed2Lat >= -90 && parsed2Lat <= 90 && parsed2Lng >= -180 && parsed2Lng <= 180;

  const canCompare = is1Valid && is2Valid;

  // Execute comparison computation
  const handleRunComparison = () => {
    if (!canCompare) return;
    const s1: SiteInput = {
      name: site1Name.trim() || `Site 01 (${parsed1Lat.toFixed(2)}°, ${parsed1Lng.toFixed(2)}°)`,
      lat: parsed1Lat,
      lng: parsed1Lng
    };
    const s2: SiteInput = {
      name: site2Name.trim() || `Site 02 (${parsed2Lat.toFixed(2)}°, ${parsed2Lng.toFixed(2)}°)`,
      lat: parsed2Lat,
      lng: parsed2Lng
    };
    const computedReport = compareLunarSites(s1, s2);
    setReport(computedReport);
  };

  // Initial computation on modal mount
  useEffect(() => {
    if (isOpen) {
      handleRunComparison();
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Swap locations
  const handleSwap = () => {
    const tempName = site1Name;
    const tempLat = site1Lat;
    const tempLng = site1Lng;

    setSite1Name(site2Name);
    setSite1Lat(site2Lat);
    setSite1Lng(site2Lng);

    setSite2Name(tempName);
    setSite2Lat(tempLat);
    setSite2Lng(tempLng);

    if (canCompare) {
      const s1: SiteInput = { name: site2Name, lat: parseFloat(site2Lat), lng: parseFloat(site2Lng) };
      const s2: SiteInput = { name: tempName, lat: parseFloat(tempLat), lng: parseFloat(tempLng) };
      setReport(compareLunarSites(s1, s2));
    }
  };

  // Reset inputs
  const handleReset = () => {
    setSite1Name('Apollo 11 Base');
    setSite1Lat('0.6740');
    setSite1Lng('23.4730');

    setSite2Name('Shackleton Crater Rim');
    setSite2Lat('-89.6700');
    setSite2Lng('129.7800');

    const s1: SiteInput = { name: 'Apollo 11 Base', lat: 0.6740, lng: 23.4730 };
    const s2: SiteInput = { name: 'Shackleton Crater Rim', lat: -89.6700, lng: 129.7800 };
    setReport(compareLunarSites(s1, s2));
  };

  // Load preset
  const handleLoadPreset = (preset: typeof COMPARISON_PRESETS[0]) => {
    setSite1Name(preset.site1.name);
    setSite1Lat(preset.site1.lat.toString());
    setSite1Lng(preset.site1.lng.toString());

    setSite2Name(preset.site2.name);
    setSite2Lat(preset.site2.lat.toString());
    setSite2Lng(preset.site2.lng.toString());

    const s1: SiteInput = { name: preset.site1.name, lat: preset.site1.lat, lng: preset.site1.lng };
    const s2: SiteInput = { name: preset.site2.name, lat: preset.site2.lat, lng: preset.site2.lng };
    setReport(compareLunarSites(s1, s2));
  };

  // Map coordinate click handler
  const handleMapSelectCoordinate = (lat: number, lng: number, target: 'site1' | 'site2') => {
    if (target === 'site1') {
      setSite1Lat(lat.toString());
      setSite1Lng(lng.toString());
      setSite1Name(`Custom Location (${lat > 0 ? '+' : ''}${lat.toFixed(2)}°, ${lng > 0 ? '+' : ''}${lng.toFixed(2)}°)`);
      setActiveMapTarget('site2'); // alternate target on next click
    } else {
      setSite2Lat(lat.toString());
      setSite2Lng(lng.toString());
      setSite2Name(`Custom Location (${lat > 0 ? '+' : ''}${lat.toFixed(2)}°, ${lng > 0 ? '+' : ''}${lng.toFixed(2)}°)`);
      setActiveMapTarget('site1');
    }
  };

  if (!isOpen) return null;

  const currentSite1 = {
    name: site1Name || 'Site 01',
    lat: is1Valid ? parsed1Lat : 0,
    lng: is1Valid ? parsed1Lng : 0
  };

  const currentSite2 = {
    name: site2Name || 'Site 02',
    lat: is2Valid ? parsed2Lat : 0,
    lng: is2Valid ? parsed2Lng : 0
  };

  // Filtered physical parameters
  const showPhysical = activeCategoryFilter === 'all' || activeCategoryFilter === 'physical';
  const showResources = activeCategoryFilter === 'all' || activeCategoryFilter === 'resources' || activeCategoryFilter === 'volatiles' || activeCategoryFilter === 'minerals';

  const filteredResources = report
    ? activeCategoryFilter === 'volatiles'
      ? report.resources.filter(r => r.subCategory === 'volatile')
      : activeCategoryFilter === 'minerals'
        ? report.resources.filter(r => r.subCategory === 'metal' || r.subCategory === 'mineral')
        : report.resources
    : [];

  const getParameterIcon = (id: string) => {
    switch (id) {
      case 'sunlight':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'earth-comms':
        return <Radio className="w-4 h-4 text-cyan-400" />;
      case 'elevation':
        return <Mountain className="w-4 h-4 text-emerald-400" />;
      case 'slope':
        return <TrendingUp className="w-4 h-4 text-rose-400" />;
      case 'crater-density':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'temperature':
        return <Thermometer className="w-4 h-4 text-sky-400" />;
      case 'landing-suitability':
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
      case 'science-potential':
        return <Sparkles className="w-4 h-4 text-teal-400" />;
      default:
        return <Compass className="w-4 h-4 text-slate-400" />;
    }
  };

  const getResourceIcon = (id: string) => {
    switch (id) {
      case 'water':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'he3':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'co':
      case 'ch4':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'co2':
      case 'nh3':
        return <Wind className="w-4 h-4 text-emerald-400" />;
      case 'h2s':
        return <Layers className="w-4 h-4 text-yellow-400" />;
      case 'si':
        return <Boxes className="w-4 h-4 text-blue-400" />;
      case 'fe':
        return <Hammer className="w-4 h-4 text-rose-400" />;
      case 'al':
        return <Box className="w-4 h-4 text-purple-400" />;
      case 'tio2':
        return <Sparkles className="w-4 h-4 text-fuchsia-400" />;
      default:
        return <FlaskConical className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    // EXACT CENTER OF WEBPAGE WITH SUBTLE DARK OVERLAY
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Centred Modal Dialog Window (75%–85% Screen Width) */}
      <div
        className="relative w-full max-w-5xl lg:max-w-6xl max-h-[92vh] rounded-2xl bg-space-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL TOP HEADER ================= */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800/80 bg-space-900/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-md shadow-purple-950/50">
              <GitCompare className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider text-white">
                  Lunar Site Comparator
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  DUAL SITE ENGINE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hidden sm:inline">
                  +11 IN-SITU RESOURCES
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Comparative analysis across 8 physical parameters & 11 in-situ resources (Water, He-3, CO, CO₂, CH₄, NH₃, H₂S, Si, Fe, Al, TiO₂)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
              title="Reset to default comparison"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors"
              title="Close Comparator (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= SCROLLABLE MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 solar-scrollbar">
          {/* Quick Scientific Presets Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-space-900/60 border border-slate-800/80 text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5 shrink-0 text-[11px] uppercase tracking-wider font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Scientific Presets:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {COMPARISON_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadPreset(p)}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-mono whitespace-nowrap transition-all bg-space-950/70 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50 hover:bg-purple-950/30"
                  title={p.tag}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* ================= SECTION 1: LOCATION INPUT INTERFACE ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
            {/* SITE 01 PANEL (CYAN THEME) */}
            <div className="lg:col-span-5 p-3.5 sm:p-4 rounded-2xl bg-space-900/70 border border-cyan-500/40 shadow-lg shadow-cyan-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-space-950 font-bold text-xs">
                      1
                    </span>
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-300">
                      LOCATION A – SITE 01
                    </h3>
                  </div>
                  {is1Valid ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Valid Coordinates
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
                      <AlertTriangle className="w-3 h-3" /> Invalid Input
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                      Site Designation / Landmark Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apollo 11 Base / Shackleton"
                      value={site1Name}
                      onChange={(e) => setSite1Name(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-space-950 border border-slate-800 focus:border-cyan-400 text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                        Latitude [-90° to +90°]
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        value={site1Lat}
                        onChange={(e) => setSite1Lat(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-xl bg-space-950 border text-white focus:outline-none transition-colors ${is1Valid ? 'border-slate-800 focus:border-cyan-400' : 'border-rose-500/70 focus:border-rose-400'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                        Longitude [-180° to +180°]
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        value={site1Lng}
                        onChange={(e) => setSite1Lng(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-xl bg-space-950 border text-white focus:outline-none transition-colors  ${is1Valid ? 'border-slate-800 focus:border-cyan-400' : 'border-rose-500/70 focus:border-rose-400'
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Select Mission Pills */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                <span className="text-[10px] font-mono text-slate-500 block mb-1.5">Quick Pick:</span>
                <div className="flex flex-wrap gap-1">
                  {LUNAR_POIS.slice(0, 4).map(poi => (
                    <button
                      key={poi.id}
                      onClick={() => {
                        setSite1Name(poi.name);
                        setSite1Lat(poi.lat.toString());
                        setSite1Lng(poi.lng.toString());
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-space-950 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
                    >
                      {poi.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER ACTION CONTROLS */}
            <div className="lg:col-span-2 flex lg:flex-col items-center justify-center gap-2.5 py-1">
              <button
                onClick={handleSwap}
                className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-space-900 border border-slate-800 hover:border-purple-500/60 text-slate-300 hover:text-purple-300 text-xs font-mono transition-all group shadow-md"
                title="Swap Location 1 and Location 2"
              >
                <ArrowLeftRight className="w-4 h-4 text-purple-400 group-hover:rotate-180 transition-transform duration-300" />
                <span className="hidden sm:inline">Swap</span>
              </button>

              <button
                onClick={handleRunComparison}
                disabled={!canCompare}
                className={`flex-2 lg:flex-none w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all shadow-xl ${canCompare
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-purple-950/60 cursor-pointer hover:scale-[1.02]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
              >
                <GitCompare className="w-4 h-4" />
                <span>COMPARE SITES</span>
              </button>
            </div>

            {/* SITE 02 PANEL (AMBER THEME) */}
            <div className="lg:col-span-5 p-3.5 sm:p-4 rounded-2xl bg-space-900/70 border border-amber-500/40 shadow-lg shadow-amber-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-space-950 font-bold text-xs">
                      2
                    </span>
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                      LOCATION B – SITE 02
                    </h3>
                  </div>
                  {is2Valid ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Valid Coordinates
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
                      <AlertTriangle className="w-3 h-3" /> Invalid Input
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                      Site Designation / Landmark Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shackleton / Shiv Shakti Point"
                      value={site2Name}
                      onChange={(e) => setSite2Name(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-space-950 border border-slate-800 focus:border-amber-400 text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                        Latitude [-90° to +90°]
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        value={site2Lat}
                        onChange={(e) => setSite2Lat(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-xl bg-space-950 border text-white focus:outline-none transition-colors ${is2Valid ? 'border-slate-800 focus:border-amber-400' : 'border-rose-500/70 focus:border-rose-400'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                        Longitude [-180° to +180°]
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        value={site2Lng}
                        onChange={(e) => setSite2Lng(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-xl bg-space-950 border text-white focus:outline-none transition-colors ${is2Valid ? 'border-slate-800 focus:border-amber-400' : 'border-rose-500/70 focus:border-rose-400'
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Select Mission Pills */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                <span className="text-[10px] font-mono text-slate-500 block mb-1.5">Quick Pick:</span>
                <div className="flex flex-wrap gap-1">
                  {LUNAR_POIS.slice(4, 8).map(poi => (
                    <button
                      key={poi.id}
                      onClick={() => {
                        setSite2Name(poi.name);
                        setSite2Lat(poi.lat.toString());
                        setSite2Lng(poi.lng.toString());
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-space-950 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
                    >
                      {poi.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: MAP VISUALIZATION ================= */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-space-900/60 border border-slate-800/90 shadow-xl">
            <LunarComparatorMap
              site1={currentSite1}
              site2={currentSite2}
              distanceKm={report ? report.distanceKm : 0}
              onSelectCoordinate={handleMapSelectCoordinate}
              activeTargetSite={activeMapTarget}
              onChangeActiveTarget={(t) => setActiveMapTarget(t)}
            />
          </div>

          {/* ================= SECTION 3: COMPARISON DASHBOARD & RESULTS ================= */}
          {report && (
            <div className="space-y-4 animate-fadeIn">
              {/* Category Filter Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none font-mono text-xs">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mr-1">
                    Filter:
                  </span>
                  {[
                    { id: 'all', label: 'All 19 Metrics' },
                    { id: 'resources', label: 'In-Situ Resources (11)' },
                    { id: 'volatiles', label: 'Volatiles (H₂O, He-3, etc.)' },
                    { id: 'minerals', label: 'Metals (Si, Fe, Al, TiO₂)' },
                    { id: 'physical', label: '8 Physical Parameters' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategoryFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${activeCategoryFilter === tab.id
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                          : 'bg-space-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  Angular Separation:{' '}
                  <strong className="text-white">{report.distanceKm.toLocaleString()} km</strong>{' '}
                  <span className="text-purple-300">({report.distancePercentMoonCircumference}% circum.)</span>
                </div>
              </div>

              {/* ================= SECTION 3A: 11 IN-SITU RESOURCES (ISRU) ================= */}
              {showResources && (
                <div className="space-y-3">
                  {/* Section Title Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/40 text-purple-200 shadow-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-xl bg-purple-900/60 border border-purple-500/50 text-purple-300">
                        <Atom className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-white">
                          In-Situ Lunar Resources & Mineral Wealth (11 Elements)
                        </h3>
                        <p className="text-[11px] text-purple-300/80 font-sans">
                          Volatile gases, cryogenic water ice, and structural metals essential for self-sustaining lunar bases and rocket fuel.
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      LCROSS & APOLLO CALIBRATED
                    </span>
                  </div>

                  {/* Resource Cards */}
                  <div className="space-y-3 font-mono">
                    {filteredResources.map((res) => {
                      const is1Better = res.betterSite === 'site1';
                      const is2Better = res.betterSite === 'site2';

                      return (
                        <div
                          key={res.resourceId}
                          className="rounded-2xl border border-white/80 hover:border-white transition-all p-3.5 sm:p-4 space-y-3 shadow-lg bg-space-950/90 shadow-white/5"
                        >
                          {/* Card Header: Name, Formula, Plain Meaning & Winner Tag */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-xl bg-space-900 border border-slate-800 text-purple-300 shrink-0">
                                {getResourceIcon(res.resourceId)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm sm:text-base text-white tracking-wide">
                                    {res.name}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-space-900 text-purple-300 border border-purple-500/40">
                                    {res.formula}
                                  </span>
                                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                    • {res.subCategory}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug font-sans">
                                  {res.plainEnglishMeaning}
                                </p>
                              </div>
                            </div>

                            {/* Header Winner Status Badge */}
                            <div className="shrink-0 self-start sm:self-center">
                              {is1Better ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/40">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                  <span>Site 01 Advantage ({report.site1.name})</span>
                                </span>
                              ) : is2Better ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/40">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                  <span>Site 02 Advantage ({report.site2.name})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  <span>Equal Regional Abundance</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Side-by-Side Dual Location Metrics */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Site 01 Card */}
                            <div
                              className={`p-3 rounded-xl border transition-all ${is1Better
                                  ? 'bg-cyan-950/25 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                                  : 'bg-space-900/40 border-slate-800/80'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 truncate">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                                  SITE 01: {report.site1.name}
                                </span>
                                {is1Better && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                                    ADVANTAGE
                                  </span>
                                )}
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                                {res.site1Value}
                              </div>
                              <p className="text-[10px] text-slate-400 mb-2 leading-tight font-sans">
                                {res.site1Detail}
                              </p>
                              {/* Visual Score Meter Bar */}
                              <div className="w-full bg-space-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                <div
                                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                                  style={{ width: `${res.site1Score}%` }}
                                />
                              </div>
                            </div>

                            {/* Site 02 Card */}
                            <div
                              className={`p-3 rounded-xl border transition-all ${is2Better
                                  ? 'bg-amber-950/25 border-amber-500/50 shadow-md shadow-amber-950/20'
                                  : 'bg-space-900/40 border-slate-800/80'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 truncate">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                  SITE 02: {report.site2.name}
                                </span>
                                {is2Better && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                                    ADVANTAGE
                                  </span>
                                )}
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                                {res.site2Value}
                              </div>
                              <p className="text-[10px] text-slate-400 mb-2 leading-tight font-sans">
                                {res.site2Detail}
                              </p>
                              {/* Visual Score Meter Bar */}
                              <div className="w-full bg-space-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                <div
                                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                  style={{ width: `${res.site2Score}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Full-Width "Why This Matters / Advantage Reason" Callout */}
                          <div className="p-3 rounded-xl bg-space-900/70 border border-slate-800/90 text-xs leading-relaxed flex items-start gap-2.5">
                            <div className="p-1 rounded-lg bg-space-950 border border-slate-800 text-purple-400 shrink-0 mt-0.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                            </div>
                            <div className="text-slate-300 font-sans">
                              <strong className={is1Better ? "text-cyan-300 mr-1.5 font-mono" : is2Better ? "text-amber-300 mr-1.5 font-mono" : "text-purple-300 mr-1.5 font-mono"}>
                                {is1Better ? `Why ${report.site1.name} has the advantage:` : is2Better ? `Why ${report.site2.name} has the advantage:` : "Comparative analysis:"}
                              </strong>
                              <span>{res.advantageReason}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= SECTION 3B: 8 PHYSICAL & ENVIRONMENT PARAMETERS ================= */}
              {showPhysical && (
                <div className="space-y-3">
                  {/* Section Title Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-space-900/90 border border-slate-800 text-slate-200 shadow-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-xl bg-space-950 border border-slate-800 text-cyan-400">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-white">
                          8 Core Exploration & Physical Parameters
                        </h3>
                        <p className="text-[11px] text-slate-400 font-sans">
                          Sunlight availability, direct Earth communication, topography, landing safety, and scientific potential.
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      NASA LOLA GEODESY
                    </span>
                  </div>

                  {/* Parameter Cards */}
                  <div className="space-y-3 font-mono">
                    {report.parameters.map((param) => {
                      const is1Better = param.betterSite === 'site1';
                      const is2Better = param.betterSite === 'site2';

                      return (
                        <div
                          key={param.parameterId}
                          className="rounded-2xl border border-white/80 hover:border-white transition-all p-3.5 sm:p-4 space-y-3 shadow-lg bg-space-950/90 shadow-white/5"
                        >
                          {/* Card Header: Title, Category, Plain Meaning & Winner Tag */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-xl bg-space-900 border border-slate-800 text-cyan-400 shrink-0">
                                {getParameterIcon(param.parameterId)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm sm:text-base text-white tracking-wide">
                                    {param.title}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-space-900 text-slate-400 border border-slate-800 uppercase">
                                    {param.category}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug font-sans">
                                  {param.plainEnglishMeaning}
                                </p>
                              </div>
                            </div>

                            {/* Header Winner Status Badge */}
                            <div className="shrink-0 self-start sm:self-center">
                              {is1Better ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/40">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                  <span>Site 01 Advantage ({report.site1.name})</span>
                                </span>
                              ) : is2Better ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/40">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                  <span>Site 02 Advantage ({report.site2.name})</span>
                                </span>
                              ) : param.betterSite === 'contextual' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                  <span>Context Dependent Elevation</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  <span>Equal Conditions</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Side-by-Side Dual Location Metrics */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Site 01 Card */}
                            <div
                              className={`p-3 rounded-xl border transition-all ${is1Better
                                  ? 'bg-cyan-950/25 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                                  : 'bg-space-900/40 border-slate-800/80'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 truncate">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                                  SITE 01: {report.site1.name}
                                </span>
                                {is1Better && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                                    ADVANTAGE
                                  </span>
                                )}
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                                {param.site1Value}
                              </div>
                              <p className="text-[10px] text-slate-400 mb-2 leading-tight font-sans">
                                {param.site1Detail}
                              </p>
                              {/* Visual Score Meter Bar */}
                              <div className="w-full bg-space-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                <div
                                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                                  style={{ width: `${param.site1Score}%` }}
                                />
                              </div>
                            </div>

                            {/* Site 02 Card */}
                            <div
                              className={`p-3 rounded-xl border transition-all ${is2Better
                                  ? 'bg-amber-950/25 border-amber-500/50 shadow-md shadow-amber-950/20'
                                  : 'bg-space-900/40 border-slate-800/80'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 truncate">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                  SITE 02: {report.site2.name}
                                </span>
                                {is2Better && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                                    ADVANTAGE
                                  </span>
                                )}
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                                {param.site2Value}
                              </div>
                              <p className="text-[10px] text-slate-400 mb-2 leading-tight font-sans">
                                {param.site2Detail}
                              </p>
                              {/* Visual Score Meter Bar */}
                              <div className="w-full bg-space-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                <div
                                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                  style={{ width: `${param.site2Score}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Full-Width "Why This Matters / Advantage Reason" Callout */}
                          <div className="p-3 rounded-xl bg-space-900/70 border border-slate-800/90 text-xs leading-relaxed flex items-start gap-2.5">
                            <div className="p-1 rounded-lg bg-space-950 border border-slate-800 text-cyan-400 shrink-0 mt-0.5">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                            </div>
                            <div className="text-slate-300 font-sans">
                              <strong className={is1Better ? "text-cyan-300 mr-1.5 font-mono" : is2Better ? "text-amber-300 mr-1.5 font-mono" : "text-purple-300 mr-1.5 font-mono"}>
                                {is1Better ? `Why ${report.site1.name} has the advantage:` : is2Better ? `Why ${report.site2.name} has the advantage:` : param.betterSite === 'contextual' ? "Elevation mission context:" : "Comparative analysis:"}
                              </strong>
                              <span>{param.advantageReason}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SIDE-BY-SIDE GEOGRAPHIC & SCIENTIFIC SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 font-mono text-xs">
                {/* Site 01 Summary Card */}
                <div className="p-3.5 rounded-2xl bg-space-900/70 border border-cyan-500/40 space-y-2">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                    <span className="text-cyan-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {report.site1.name} Profile
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {report.site1.hemisphereLng} · {report.site1.hemisphereLat}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-400">Coordinates:</span> {report.site1.formattedDecimal} ({report.site1.formattedDMS})
                    </div>
                    <div>
                      <span className="text-slate-400">Nearest Landmark:</span> {report.site1.nearestLandmark.name} (~{report.site1.nearestLandmark.distanceKm.toLocaleString()} km)
                    </div>
                    <div>
                      <span className="text-slate-400">Historical Anchor:</span> {report.site1.nearestMission.name} (~{report.site1.nearestMission.distanceKm.toLocaleString()} km)
                    </div>
                    <div>
                      <span className="text-slate-400">Geomorphic Unit:</span> {report.site1.elevation.geomorphicClass} ({report.site1.elevation.elevationMeters > 0 ? '+' : ''}{report.site1.elevation.elevationMeters.toLocaleString()} m)
                    </div>
                    <div className="pt-1 text-[10px] text-cyan-300">
                      <span className="text-slate-400">Dominant Resources: </span>
                      {report.site1.resources.filter(r => r.score >= 80).map(r => r.formula).join(', ') || 'Silicates (Si)'}
                    </div>
                  </div>
                </div>

                {/* Site 02 Summary Card */}
                <div className="p-3.5 rounded-2xl bg-space-900/70 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                    <span className="text-amber-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {report.site2.name} Profile
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {report.site2.hemisphereLng} · {report.site2.hemisphereLat}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-400">Coordinates:</span> {report.site2.formattedDecimal} ({report.site2.formattedDMS})
                    </div>
                    <div>
                      <span className="text-slate-400">Nearest Landmark:</span> {report.site2.nearestLandmark.name} (~{report.site2.nearestLandmark.distanceKm.toLocaleString()} km)
                    </div>
                    <div>
                      <span className="text-slate-400">Historical Anchor:</span> {report.site2.nearestMission.name} (~{report.site2.nearestMission.distanceKm.toLocaleString()} km)
                    </div>
                    <div>
                      <span className="text-slate-400">Geomorphic Unit:</span> {report.site2.elevation.geomorphicClass} ({report.site2.elevation.elevationMeters > 0 ? '+' : ''}{report.site2.elevation.elevationMeters.toLocaleString()} m)
                    </div>
                    <div className="pt-1 text-[10px] text-amber-300">
                      <span className="text-slate-400">Dominant Resources: </span>
                      {report.site2.resources.filter(r => r.score >= 80).map(r => r.formula).join(', ') || 'Silicates (Si)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* FINAL COMPARATIVE NARRATIVE & ENGINEERING SYNTHESIS */}
              <div className="p-4 rounded-2xl bg-purple-950/25 border border-purple-500/40 font-mono text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Comparative Scientific Evaluation & Resource Synthesis</span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {report.comparativeSummary.overview}
                </p>

                {/* Resource Synthesis Card */}
                <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/50 text-[11px] text-purple-200">
                  <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                    In-Situ Resource Utilization (ISRU) Architecture:
                  </span>
                  <p className="leading-snug text-slate-300">
                    {report.comparativeSummary.isruSummary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-space-950/60 border border-cyan-500/30">
                    <span className="text-[10px] font-bold text-cyan-300 uppercase block mb-0.5">
                      {report.site1.name} Primary Trade-off:
                    </span>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {report.comparativeSummary.site1KeyAdvantage}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-space-950/60 border border-amber-500/30">
                    <span className="text-[10px] font-bold text-amber-300 uppercase block mb-0.5">
                      {report.site2.name} Primary Trade-off:
                    </span>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {report.comparativeSummary.site2KeyAdvantage}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-space-900/80 border border-slate-800 text-[11px] text-slate-300">
                  <span className="font-bold text-purple-300">Exploration Recommendation: </span>
                  {report.comparativeSummary.missionRecommendation}
                </div>

                {/* Transparent Methodology Disclosure */}
                <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/80 leading-normal flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Scientific Methodology:</strong> Resource estimates are calibrated against NASA LCROSS impact spectroscopy (volatile ratios: H₂O 100%, CO₂ 21.7%, CO 5.7%, NH₃ 6.0%, H₂S 1.6%, CH₄ 0.65%), Lunar Prospector GRS maps (Fe, Ti, He-3 correlation with ilmenite), and Apollo/Luna returned soil assays (anorthositic Al, universal Si). Landing suitability uses an engineering weighted model (Slope 35%, Roughness 25%, DTE Comms 20%, Light 20%).
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-800/80 bg-space-900/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>NASA LOLA DEM & LCROSS/Lunar Prospector Geochemistry Engine Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-space-950 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all text-xs font-semibold"
          >
            Close Comparator
          </button>
        </div>
      </div>
    </div>
  );
};
