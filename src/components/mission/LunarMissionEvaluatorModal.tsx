import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Rocket,
  Sun,
  Radio,
  Calendar,
  Clock,
  Compass,
  MapPin,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  BarChart2,
  Globe2,
  BookmarkPlus,
  Trash2,
  Info,
  Mountain,
  Sliders,
  Activity,
  ClipboardPaste,
  Check
} from 'lucide-react';
import { LunarDEMService } from '../../utils/demAnalysis';
import { parseCoordinatesFromClipboard, readFromClipboard } from '../../utils/clipboard';
import {
  JPL_LANDING_SITES,
  EvaluatedLandingSite,
  MissionEvaluationResult,
  VisibilityInterval,
  SavedMissionFeature,
  evaluateLunarMission,
  findNextEvent,
  getSavedMissionFeatures,
  saveMissionFeature,
  deleteMissionFeature
} from '../../utils/jplMissionEvaluator';

interface LunarMissionEvaluatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToSite?: (lat: number, lng: number, altitudeMeters?: number) => void;
  onSetSimulationDate?: (date: Date) => void;
  currentHoverCoord?: { lat: number; lng: number } | null;
}

// Quick Mission Duration Presets
const DURATION_PRESETS = [
  { label: '24 Hours (1 Day)', hours: 24 },
  { label: '72 Hours (3 Days)', hours: 72 },
  { label: '168 Hours (7 Days)', hours: 168 },
  { label: '336 Hours (14d Lunar Day)', hours: 336 },
  { label: '708 Hours (29.5d Lunar Month)', hours: 708 }
];

export const LunarMissionEvaluatorModal: React.FC<LunarMissionEvaluatorModalProps> = ({
  isOpen,
  onClose,
  onFlyToSite,
  onSetSimulationDate,
  currentHoverCoord
}) => {
  // Mode: 'preset' or 'custom'
  const [siteMode, setSiteMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('apollo11');

  // Custom coordinate inputs
  const [customName, setCustomName] = useState<string>('Custom Target Site');
  const [customLat, setCustomLat] = useState<string>('0.6740');
  const [customLng, setCustomLng] = useState<string>('23.4730');
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  // Paste coordinates from clipboard handler (supports decimal, GeoJSON, DMS, directional, JSON)
  const handlePasteCoordinates = async () => {
    let text = await readFromClipboard();
    if (!text) {
      text = window.prompt('Paste Selenographic Coordinates (e.g. 0.6740, 23.4730 or [23.4730, 0.6740]):');
    }
    if (!text) return;

    const parsed = parseCoordinatesFromClipboard(text);
    if (parsed) {
      setCustomLat(parsed.lat.toFixed(4));
      setCustomLng(parsed.lng.toFixed(4));
      setPasteFeedback(`Pasted: ${parsed.lat >= 0 ? '+' : ''}${parsed.lat.toFixed(4)}°, ${parsed.lng >= 0 ? '+' : ''}${parsed.lng.toFixed(4)}°`);
      setTimeout(() => setPasteFeedback(null), 2500);
    } else {
      setPasteFeedback('Invalid format');
      setTimeout(() => setPasteFeedback(null), 2500);
    }
  };

  // Mission time inputs (default to now and 14 days duration)
  const getDefaultDates = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const startIso = now.toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 336 * 3600000);
    const endIso = end.toISOString().slice(0, 16);
    return { startIso, endIso };
  };

  const [startDateStr, setStartDateStr] = useState<string>(() => getDefaultDates().startIso);
  const [endDateStr, setEndDateStr] = useState<string>(() => getDefaultDates().endIso);
  const [durationHours, setDurationHours] = useState<number>(336);

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [missionResult, setMissionResult] = useState<MissionEvaluationResult | null>(null);

  // Active sub-tab in results: 'overview' | 'solar' | 'earth' | 'features'
  const [activeTab, setActiveTab] = useState<'overview' | 'solar' | 'earth' | 'features'>('overview');

  // Interactive 30-min Timeline Scrubber state
  const [currentSampleIndex, setCurrentSampleIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const animationTimerRef = useRef<number | null>(null);

  // Interactive Solar Elevation Trajectory Graph Tooltip & Inspection state
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartPointer, setChartPointer] = useState<{
    active: boolean;
    sampleIndex: number;
    containerX: number;
    containerY: number;
    touchLocked: boolean;
  }>({
    active: false,
    sampleIndex: 0,
    containerX: 0,
    containerY: 0,
    touchLocked: false
  });

  const handleChartPointer = (clientX: number, clientY: number, isTouch = false) => {
    if (!chartContainerRef.current || !missionResult || !missionResult.samples.length) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const sampleIdx = Math.round(relX * (missionResult.samples.length - 1));

    const contX = clientX - rect.left;
    const contY = clientY - rect.top;

    setChartPointer({
      active: true,
      sampleIndex: sampleIdx,
      containerX: contX,
      containerY: contY,
      touchLocked: isTouch
    });

    setCurrentSampleIndex(sampleIdx);
  };

  const handleChartPointerLeave = () => {
    setChartPointer(prev => {
      if (prev.touchLocked) return prev;
      return { ...prev, active: false };
    });
  };

  // Saved Features
  const [savedFeatures, setSavedFeatures] = useState<SavedMissionFeature[]>([]);
  const [newFeatureName, setNewFeatureName] = useState<string>('');
  const [newFeatureDesc, setNewFeatureDesc] = useState<string>('');

  // Load saved features
  useEffect(() => {
    setSavedFeatures(getSavedMissionFeatures());
  }, []);

  // Update dates when duration preset button clicked
  const handleSelectDurationPreset = (hours: number) => {
    setDurationHours(hours);
    const start = new Date(startDateStr);
    if (!isNaN(start.getTime())) {
      const end = new Date(start.getTime() + hours * 3600000);
      setEndDateStr(end.toISOString().slice(0, 16));
    }
  };

  // Keep durationHours in sync when user changes end date manually
  const handleEndDateChange = (newEndStr: string) => {
    setEndDateStr(newEndStr);
    const start = new Date(startDateStr);
    const end = new Date(newEndStr);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
      const hrs = Math.round((end.getTime() - start.getTime()) / 3600000);
      setDurationHours(hrs);
    }
  };

  // Active site coordinates
  const activeCoordinates = useMemo(() => {
    if (siteMode === 'preset') {
      const p = JPL_LANDING_SITES[selectedPresetId];
      return p ? { name: p.name, lat: p.latitude, lng: p.longitude, site: p } : null;
    } else {
      const lat = parseFloat(customLat);
      const lng = parseFloat(customLng);
      return {
        name: customName || 'Custom Coordinate',
        lat: isNaN(lat) ? 0 : lat,
        lng: isNaN(lng) ? 0 : lng,
        site: undefined
      };
    }
  }, [siteMode, selectedPresetId, customName, customLat, customLng]);

  // Sample real LOLA DEM Geodesy, Slope, Roughness and Classification for target site
  const terrainAnalysis = useMemo(() => {
    if (!activeCoordinates) return null;
    const demService = LunarDEMService.getInstance();
    return demService.getPointAnalysis(activeCoordinates.lat, activeCoordinates.lng);
  }, [activeCoordinates]);

  // Run evaluation
  const handleEvaluate = useCallback(async () => {
    if (!activeCoordinates) return;

    const lat = activeCoordinates.lat;
    const lng = activeCoordinates.lng;
    const start = new Date(startDateStr);

    if (isNaN(start.getTime())) {
      setEvaluationError('Please enter a valid mission start date & time.');
      return;
    }

    if (durationHours <= 0 || durationHours > 17520) {
      setEvaluationError('Mission duration must be between 1 hour and 17520 hours (730 days).');
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const result = await evaluateLunarMission(
        lat,
        lng,
        start,
        durationHours,
        activeCoordinates.name
      );
      setMissionResult(result);
      setCurrentSampleIndex(0);
      setIsPlaying(false);
    } catch (err: any) {
      setEvaluationError(err?.message || 'Failed to evaluate mission.');
    } finally {
      setIsEvaluating(false);
    }
  }, [activeCoordinates, startDateStr, durationHours]);

  // Initial evaluation on mount if opened
  useEffect(() => {
    if (isOpen && !missionResult && !isEvaluating) {
      handleEvaluate();
    }
  }, [isOpen]);

  // Playback timer for interactive scrubber
  useEffect(() => {
    if (isPlaying && missionResult && missionResult.samples.length > 0) {
      const intervalMs = Math.max(30, 250 / playbackSpeed);
      animationTimerRef.current = window.setInterval(() => {
        setCurrentSampleIndex(prev => {
          if (prev >= missionResult.samples.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    }
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, missionResult]);

  // Current scrubbed sample
  const currentSample = useMemo(() => {
    if (!missionResult || !missionResult.samples.length) return null;
    const idx = Math.min(Math.max(0, currentSampleIndex), missionResult.samples.length - 1);
    return missionResult.samples[idx];
  }, [missionResult, currentSampleIndex]);

  // Separate intervals
  const sunIntervals: VisibilityInterval[] = useMemo(() => {
    return missionResult?.intervals.filter(i => i.type === 'sun') || [];
  }, [missionResult]);

  const earthIntervals: VisibilityInterval[] = useMemo(() => {
    return missionResult?.intervals.filter(i => i.type === 'earth') || [];
  }, [missionResult]);

  // Live countdowns updated from scrubber position
  const currentCountdowns = useMemo(() => {
    if (!missionResult || !missionResult.samples.length) {
      return {
        solar: { event: 'Sunset', countdown: '--', timeStr: '--' },
        earth: { event: 'Earthset', countdown: '--', timeStr: '--' }
      };
    }

    const curIdx = currentSampleIndex;
    const curElev = missionResult.samples[curIdx]?.solar_elevation_deg ?? 0;
    const solarEventType = curElev > 0 ? 'set' : 'rise';
    const nextSolar = findNextEvent(missionResult.samples, curIdx, 'solar_elevation_deg', solarEventType);

    const curEarthElev = missionResult.samples[curIdx]?.earth_elevation_deg ?? 0;
    const earthEventType = curEarthElev > 0 ? 'set' : 'rise';
    const nextEarth = findNextEvent(missionResult.samples, curIdx, 'earth_elevation_deg', earthEventType);

    let solarCountdown = nextSolar.formatted;
    if (nextSolar.time === null || nextSolar.formatted.includes('No event')) {
      solarCountdown = solarEventType === 'set'
        ? 'There is no upcoming sunset as per given interval of time'
        : 'There is no upcoming sunrise as per given interval of time';
    }

    let earthCountdown = nextEarth.formatted;
    if (nextEarth.time === null || nextEarth.formatted.includes('No event')) {
      earthCountdown = earthEventType === 'set'
        ? 'There is no upcoming earthset as per given interval of time'
        : 'There is no upcoming earthrise as per given interval of time';
    }

    return {
      solar: {
        event: solarEventType === 'set' ? 'Next Sunset' : 'Next Sunrise',
        countdown: solarCountdown,
        timeStr: nextSolar.time ? new Date(nextSolar.time).toUTCString().slice(5, 22) : 'Beyond Window'
      },
      earth: {
        event: earthEventType === 'set' ? 'Next Earthset' : 'Next Earthrise',
        countdown: earthCountdown,
        timeStr: nextEarth.time ? new Date(nextEarth.time).toUTCString().slice(5, 22) : (curEarthElev > 10 ? 'Continuous Nearside LOS' : 'Beyond Window')
      }
    };
  }, [missionResult, currentSampleIndex]);

  // Feasibility level
  const feasibilityLevel = useMemo<'optimal' | 'moderate' | 'critical'>(() => {
    if (!missionResult) return 'moderate';
    if (missionResult.feasibility.rating === 'Potentially feasible') return 'optimal';
    if (missionResult.feasibility.rating === 'Limited availability') return 'moderate';
    return 'critical';
  }, [missionResult]);

  // Handle fly to site and camera sync
  const handleFlyToSite = () => {
    if (activeCoordinates && onFlyToSite) {
      onFlyToSite(activeCoordinates.lat, activeCoordinates.lng, 150000);
    }
  };

  // Handle sync globe date to current scrubbed sample
  const handleSyncGlobeDate = () => {
    if (currentSample && onSetSimulationDate) {
      onSetSimulationDate(new Date(currentSample.time));
    }
  };

  // Reset all fields
  const handleReset = () => {
    setSiteMode('preset');
    setSelectedPresetId('apollo11');
    const { startIso, endIso } = getDefaultDates();
    setStartDateStr(startIso);
    setEndDateStr(endIso);
    setDurationHours(336);
    setIsPlaying(false);
    setCurrentSampleIndex(0);
    setMissionResult(null);
    setEvaluationError(null);
  };

  // Add custom saved feature
  const handleSaveFeature = () => {
    if (!newFeatureName.trim() || !activeCoordinates) return;
    saveMissionFeature(
      newFeatureName.trim(),
      newFeatureDesc.trim() || `Saved landing coordinate at ${activeCoordinates.lat.toFixed(4)}°, ${activeCoordinates.lng.toFixed(4)}°`,
      activeCoordinates.lat,
      activeCoordinates.lng
    );
    setSavedFeatures(getSavedMissionFeatures());
    setNewFeatureName('');
    setNewFeatureDesc('');
  };

  // Delete saved feature
  const handleDeleteFeature = (id: string) => {
    deleteMissionFeature(id);
    setSavedFeatures(getSavedMissionFeatures());
  };

  // Load a saved feature into custom coordinates
  const handleLoadSavedFeature = (feat: SavedMissionFeature) => {
    setSiteMode('custom');
    setCustomName(feat.name);
    setCustomLat(feat.latitude.toFixed(4));
    setCustomLng(feat.longitude.toFixed(4));
    setActiveTab('overview');
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Feasibility color mapping
  const getFeasibilityStyle = (level: 'optimal' | 'moderate' | 'critical') => {
    switch (level) {
      case 'optimal':
        return {
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          border: 'border-emerald-500/50',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        };
      case 'moderate':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          border: 'border-amber-500/50',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      case 'critical':
      default:
        return {
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          border: 'border-rose-500/50',
          icon: <XCircle className="w-5 h-5 text-rose-400" />
        };
    }
  };

  // Grouped presets
  const groupedPresets = Object.values(JPL_LANDING_SITES).reduce((acc, site) => {
    const cat = site.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(site);
    return acc;
  }, {} as Record<string, EvaluatedLandingSite[]>);

  const categoryLabels: Record<string, string> = {
    historic: 'Historic Crewed Missions (Apollo)',
    commercial: 'Commercial Artemis Landers (CLPS)',
    polar: 'International Polar Explorers (ISRO / CNSA / JAXA)',
    robotic: 'Pioneering Robotic Landers'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-5 lg:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Centred Modal Container - Expanded Widescreen Dashboard Size (92%-96% Screen Width) */}
      <div
        className="relative w-full max-w-[96vw] xl:max-w-[92vw] 2xl:max-w-[1720px] max-h-[94vh] rounded-2xl bg-space-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL TOP HEADER ================= */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800/80 bg-space-900/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-300 shadow-md shadow-blue-950/50">
              <Rocket className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider text-white">
                  Lunar Mission Evaluator
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  JPL HORIZONS ENGINE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hidden sm:inline">
                  SOLAR & DTE COMMS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hidden md:inline">
                  FEASIBILITY RATING
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                NASA/JPL Horizons Astrodynamics • Sun/Earth Elevation Trajectories, Day/Night Cycles & Direct Comms Feasibility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
              title="Reset parameters to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors"
              title="Close Evaluator (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= SCROLLABLE MODAL CONTENT ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 solar-scrollbar">

          {/* ================= 1. LOCATION & MISSION CONFIGURATION ================= */}
          <div className="rounded-xl bg-space-900/60 border border-slate-800/80 p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                  Target Landing Site & Coordinates
                </span>
              </div>
              <div className="flex items-center gap-1 bg-space-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setSiteMode('preset')}
                  className={`px-3 py-1 rounded-lg transition-all ${siteMode === 'preset'
                      ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Curated Presets (18 Sites)
                </button>
                <button
                  onClick={() => setSiteMode('custom')}
                  className={`px-3 py-1 rounded-lg transition-all ${siteMode === 'custom'
                      ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Custom Coordinate
                </button>
              </div>
            </div>

            {/* Presets or Custom Coordinate Selector */}
            {siteMode === 'preset' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Select Curated Mission / Landing Site:
                  </label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {Object.entries(groupedPresets).map(([catKey, sites]) => (
                      <optgroup key={catKey} label={categoryLabels[catKey] || catKey.toUpperCase()}>
                        {sites.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.latitude >= 0 ? `+${s.latitude.toFixed(2)}°` : `${s.latitude.toFixed(2)}°`}, {s.longitude >= 0 ? `+${s.longitude.toFixed(2)}°` : `${s.longitude.toFixed(2)}°`})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {activeCoordinates?.site && (
                  <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800 text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-bold text-blue-300">{activeCoordinates.site.agency}</span>
                      <span className="text-slate-400">
                        {activeCoordinates.lat.toFixed(4)}°, {activeCoordinates.lng.toFixed(4)}°
                      </span>
                    </div>
                    <p className="text-slate-400 line-clamp-2 leading-relaxed">
                      {activeCoordinates.site.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Site / Target Identifier:
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Shackleton Crater Rim"
                    className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Latitude (-90° to +90°):
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="±90.0000"
                    className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-mono text-slate-400">
                      Longitude (-180° to +180°):
                    </label>
                    {pasteFeedback && (
                      <span className={`text-[10px] font-mono font-bold ${
                        pasteFeedback.startsWith('Pasted') ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {pasteFeedback}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      min="-180"
                      max="180"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      placeholder="±180.0000"
                      className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handlePasteCoordinates}
                      className={`px-3.5 py-2 rounded-xl border font-mono text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 shadow-sm active:scale-95 ${
                        pasteFeedback && pasteFeedback.startsWith('Pasted')
                          ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-emerald-500/20'
                          : pasteFeedback?.startsWith('Invalid')
                          ? 'bg-rose-950/70 border-rose-500/60 text-rose-300'
                          : 'bg-cyan-950/60 border-cyan-500/50 hover:bg-cyan-900/60 text-cyan-300 hover:shadow-cyan-500/20'
                      }`}
                      title="Paste coordinates from clipboard (Latitude & Longitude)"
                    >
                      {pasteFeedback && pasteFeedback.startsWith('Pasted') ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pasted!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardPaste className="w-3.5 h-3.5" />
                          <span>Paste</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Live LOLA Geodesy & Terrain Telemetry for Selected Site */}
            {terrainAnalysis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                <div className="p-2 rounded-xl bg-space-950/80 border border-purple-500/30 flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-950/60 text-purple-400">
                    <Mountain className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">LOLA Elevation</span>
                    <span className="text-purple-300 font-bold">
                      {terrainAnalysis.elevationMeters >= 0 ? '+' : ''}{terrainAnalysis.elevationMeters.toLocaleString()} m
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-space-950/80 border border-cyan-500/30 flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-cyan-950/60 text-cyan-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Slope Gradient</span>
                    <span className="text-cyan-300 font-bold">
                      {terrainAnalysis.slopeDeg.toFixed(1)}° ({terrainAnalysis.slopeCategory === '0-5' ? 'Plains' : terrainAnalysis.slopeCategory === '15+' ? 'Steep' : 'Moderate'})
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-space-950/80 border border-amber-500/30 flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-950/60 text-amber-400">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Roughness (RMS)</span>
                    <span className="text-amber-300 font-bold">
                      {terrainAnalysis.roughnessM.toFixed(1)} m RMS
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-space-950/80 border border-emerald-500/30 flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-950/60 text-emerald-400">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Terrain Class</span>
                    <span className="text-emerald-300 font-bold truncate block">
                      {terrainAnalysis.elevationCategoryName}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mission Time Window & Duration Presets */}
            <div className="pt-3 border-t border-slate-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold uppercase tracking-wider">Mission Timeline Window (UTC)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Start Date & Time (UTC):
                  </label>
                  <input
                    type="datetime-local"
                    value={startDateStr}
                    onChange={(e) => {
                      setStartDateStr(e.target.value);
                      const start = new Date(e.target.value);
                      if (!isNaN(start.getTime())) {
                        const end = new Date(start.getTime() + durationHours * 3600000);
                        setEndDateStr(end.toISOString().slice(0, 16));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    End Date & Time (UTC):
                  </label>
                  <input
                    type="datetime-local"
                    value={endDateStr}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1 flex flex-col justify-end">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEvaluate}
                      disabled={isEvaluating}
                      className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isEvaluating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Calculating Ephemeris...</span>
                        </>
                      ) : (
                        <>
                          <Rocket className="w-3.5 h-3.5" />
                          <span>Evaluate Mission</span>
                        </>
                      )}
                    </button>

                    {onFlyToSite && activeCoordinates && (
                      <button
                        onClick={handleFlyToSite}
                        className="p-2 rounded-xl bg-space-950 border border-slate-700 hover:border-blue-500 text-blue-400 hover:text-white transition-colors"
                        title="Fly 3D Globe camera to this site"
                      >
                        <Globe2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick duration presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-slate-400">Quick Duration:</span>
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.hours}
                    onClick={() => handleSelectDurationPreset(preset.hours)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors border ${durationHours === preset.hours
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 font-bold'
                        : 'bg-space-950/70 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error banner if any */}
            {evaluationError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{evaluationError}</span>
              </div>
            )}
          </div>

          {/* ================= 2. EVALUATION RESULTS DASHBOARD ================= */}
          {missionResult && (
            <div className="space-y-5 animate-fadeIn">

              {/* --- 2A. Primary Metrics Grid --- */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Peak Solar Elevation */}
                <div className="p-3 rounded-xl bg-space-900/80 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-[10px] uppercase text-slate-400">Peak Solar Elev</span>
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-bold text-white">
                    {missionResult.metrics.solar_elevation_deg >= 0 ? '+' : ''}
                    {missionResult.metrics.solar_elevation_deg.toFixed(1)}°
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {missionResult.metrics.solar_elevation_deg > 0 ? 'Max Altitude' : 'Sub-horizon (Night)'}
                  </div>
                </div>

                {/* 2. Total Sunlight Hours */}
                <div className="p-3 rounded-xl bg-space-900/80 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-[10px] uppercase text-slate-400">Sunlight Hours</span>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-bold text-amber-300">
                    {missionResult.metrics.sunlight_hours.toFixed(1)} h
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {((missionResult.metrics.sunlight_hours / missionResult.duration_hours) * 100).toFixed(0)}% of Mission
                  </div>
                </div>

                {/* 3. Solar Power Efficiency */}
                <div className="p-3 rounded-xl bg-space-900/80 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-yellow-400">
                    <span className="text-[10px] uppercase text-slate-400">Solar Efficiency</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-bold text-yellow-300">
                    {missionResult.metrics.solar_power_efficiency_percent.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Geometric sin(θ) proxy
                  </div>
                </div>

                {/* 4. Earth Visibility Status */}
                <div className="p-3 rounded-xl bg-space-900/80 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-cyan-400">
                    <span className="text-[10px] uppercase text-slate-400">Earth Visibility</span>
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm font-bold text-cyan-300 truncate">
                    {missionResult.metrics.earth_visible ? 'Direct Line of Sight' : 'Occulted (Far Side / Rim)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {missionResult.metrics.communication_hours > 0
                      ? `${((missionResult.metrics.communication_hours / missionResult.duration_hours) * 100).toFixed(0)}% of Mission`
                      : 'No Direct Comms'}
                  </div>
                </div>

                {/* 5. Total Comms Hours */}
                <div className="p-3 rounded-xl bg-space-900/80 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-cyan-400">
                    <span className="text-[10px] uppercase text-slate-400">Direct Comms</span>
                    <BarChart2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-bold text-white">
                    {missionResult.metrics.communication_hours.toFixed(1)} h
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Direct-to-Earth (DTE)
                  </div>
                </div>

                {/* 6. Overall Feasibility Rating */}
                <div className={`p-3 rounded-xl bg-space-900/80 border text-xs font-mono space-y-1 ${getFeasibilityStyle(feasibilityLevel).border}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-slate-400">Feasibility</span>
                    {getFeasibilityStyle(feasibilityLevel).icon}
                  </div>
                  <div className="text-xs font-bold text-white truncate" title={missionResult.feasibility.rating}>
                    {missionResult.feasibility.rating}
                  </div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${getFeasibilityStyle(feasibilityLevel).badgeBg}`}>
                    {feasibilityLevel.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* --- 2B. Live Event Countdowns & Horizon Crossings --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Solar Event Countdown */}
                <div className="p-3 rounded-xl bg-space-900/60 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400 shrink-0">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-mono text-slate-400">
                        {currentCountdowns.solar.event}
                      </div>
                      <div className="text-xs sm:text-sm font-bold font-mono text-white leading-tight">
                        {currentCountdowns.solar.countdown}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[10px] font-mono text-slate-400">
                    <span>Target Event:</span>
                    <div className="text-slate-300">{currentCountdowns.solar.timeStr}</div>
                  </div>
                </div>

                {/* Earth Event Countdown */}
                <div className="p-3 rounded-xl bg-space-900/60 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-mono text-slate-400">
                        {currentCountdowns.earth.event}
                      </div>
                      <div className="text-xs sm:text-sm font-bold font-mono text-white leading-tight">
                        {currentCountdowns.earth.countdown}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[10px] font-mono text-slate-400">
                    <span>Target Event:</span>
                    <div className="text-slate-300">{currentCountdowns.earth.timeStr}</div>
                  </div>
                </div>
              </div>

              {/* --- 2C. Interactive 30-min Temporal Trajectory Scrubber & Player --- */}
              <div className="rounded-xl bg-space-900/90 border border-slate-800/90 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                      Mission Timeline Inspector (30-min Astrodynamic Steps)
                    </span>
                  </div>

                  {currentSample && (
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400">
                        Sample <span className="text-white font-bold">{currentSampleIndex + 1}</span> of {missionResult.samples.length}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-space-950 border border-slate-800 text-blue-300 font-bold">
                        {new Date(currentSample.time).toUTCString().slice(0, 22)} UTC
                      </span>
                    </div>
                  )}
                </div>

                {/* Scrubber Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Playback action buttons */}
                  <div className="flex items-center gap-1.5 bg-space-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setCurrentSampleIndex(0)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-space-900 transition-colors"
                      title="Rewind to start"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentSampleIndex(prev => Math.max(0, prev - 1))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-space-900 transition-colors"
                      title="Previous 30-min step"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(prev => !prev)}
                      className={`p-2 rounded-lg font-bold transition-all ${isPlaying
                          ? 'bg-amber-600/40 text-amber-300 border border-amber-500/50'
                          : 'bg-blue-600/40 text-blue-300 border border-blue-500/50 hover:bg-blue-500/50'
                        }`}
                      title={isPlaying ? 'Pause animation' : 'Play mission timeline'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setCurrentSampleIndex(prev => Math.min(missionResult.samples.length - 1, prev + 1))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-space-900 transition-colors"
                      title="Next 30-min step"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Scrubber Range Slider */}
                  <div className="flex-1 w-full flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={missionResult.samples.length - 1}
                      value={currentSampleIndex}
                      onChange={(e) => setCurrentSampleIndex(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-space-950 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-slate-800"
                    />
                  </div>

                  {/* Playback speed selector */}
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <span className="text-[10px]">Speed:</span>
                    {[1, 2, 5, 10].map(s => (
                      <button
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${playbackSpeed === s
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                            : 'bg-space-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instantaneous Sample Telemetry Readouts */}
                {currentSample && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Sun Position */}
                    <div className="p-3 rounded-xl bg-space-950/80 border border-amber-900/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Sun className={`w-5 h-5 ${currentSample.solar_elevation_deg > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
                        <div>
                          <div className="text-[10px] uppercase font-mono text-slate-400">
                            Sun Position @ Moment
                          </div>
                          <div className="text-sm font-bold font-mono text-white">
                            Elev: <span className={currentSample.solar_elevation_deg > 0 ? 'text-amber-300' : 'text-slate-400'}>
                              {currentSample.solar_elevation_deg >= 0 ? '+' : ''}{currentSample.solar_elevation_deg.toFixed(2)}°
                            </span> • Az: <span className="text-slate-300">{currentSample.solar_azimuth_deg.toFixed(1)}°</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${currentSample.solar_elevation_deg > 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                        {currentSample.solar_elevation_deg > 0 ? 'DAYLIGHT' : 'NIGHT'}
                      </span>
                    </div>

                    {/* Earth Position */}
                    <div className="p-3 rounded-xl bg-space-950/80 border border-cyan-900/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Radio className={`w-5 h-5 ${currentSample.earth_elevation_deg > 0 ? 'text-cyan-400' : 'text-slate-600'}`} />
                        <div>
                          <div className="text-[10px] uppercase font-mono text-slate-400">
                            Earth Position @ Moment
                          </div>
                          <div className="text-sm font-bold font-mono text-white">
                            Elev: <span className={currentSample.earth_elevation_deg > 0 ? 'text-cyan-300' : 'text-rose-400'}>
                              {currentSample.earth_elevation_deg >= 0 ? '+' : ''}{currentSample.earth_elevation_deg.toFixed(2)}°
                            </span> • Az: <span className="text-slate-300">{currentSample.earth_azimuth_deg.toFixed(1)}°</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${currentSample.earth_elevation_deg > 0
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-rose-950/50 text-rose-300 border-rose-800/50'
                          }`}>
                          {currentSample.earth_elevation_deg > 0 ? 'DIRECT LOS' : 'OCCULTED'}
                        </span>

                        {onSetSimulationDate && (
                          <button
                            onClick={handleSyncGlobeDate}
                            className="px-2 py-1 rounded-lg bg-blue-950 border border-blue-500/40 text-[10px] font-mono text-blue-300 hover:text-white hover:bg-blue-900 transition-colors"
                            title="Synchronize 3D Moon Globe lighting and shadows to this moment"
                          >
                            Sync 3D
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 2D. SVG Elevation Trajectory Line Chart --- */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <span className="font-bold text-slate-300 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                      Solar & Earth Elevation Trajectory (Full Mission Period)
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
                        Sun Elevation (°)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
                        Earth Elevation (°)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-0.5 bg-slate-500 inline-block" />
                        0° Horizon
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart Container with Interactive Tooltip */}
                  <div
                    ref={chartContainerRef}
                    onMouseMove={(e) => handleChartPointer(e.clientX, e.clientY, false)}
                    onMouseEnter={(e) => handleChartPointer(e.clientX, e.clientY, false)}
                    onMouseLeave={handleChartPointerLeave}
                    onClick={(e) => handleChartPointer(e.clientX, e.clientY, false)}
                    onTouchStart={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleChartPointer(e.touches[0].clientX, e.touches[0].clientY, true);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleChartPointer(e.touches[0].clientX, e.touches[0].clientY, true);
                      }
                    }}
                    className="relative w-full h-64 sm:h-72 lg:h-80 bg-space-950 rounded-xl border border-slate-800/90 overflow-hidden select-none touch-none"
                  >
                    {(() => {
                      const samples = missionResult.samples;
                      if (!samples.length) return null;

                      const width = 1200;
                      const height = 290;
                      const padTop = 26;
                      const padBottom = 52;
                      const padLeft = 84;
                      const padRight = 24;
                      const plotW = width - padLeft - padRight;
                      const plotH = height - padTop - padBottom;

                      const minElev = -90;
                      const maxElev = 90;

                      const getY = (val: number) => {
                        const clamped = Math.max(minElev, Math.min(maxElev, val));
                        return padTop + plotH - ((clamped - minElev) / (maxElev - minElev)) * plotH;
                      };

                      const getX = (idx: number) => {
                        return padLeft + (idx / (samples.length - 1)) * plotW;
                      };

                      const zeroY = getY(0);

                      // Build SVG paths
                      const sunPath = samples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(s.solar_elevation_deg).toFixed(1)}`).join(' ');
                      const earthPath = samples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(s.earth_elevation_deg).toFixed(1)}`).join(' ');

                      // Active inspection point
                      const activeIndex = chartPointer.active ? chartPointer.sampleIndex : currentSampleIndex;
                      const activeSample = samples[activeIndex] || samples[0];
                      const activeSvgX = getX(activeIndex);
                      const sunElev = activeSample.solar_elevation_deg;
                      const earthElev = activeSample.earth_elevation_deg;
                      const activeSunSvgY = getY(sunElev);
                      const activeEarthSvgY = getY(earthElev);

                      // Lunar Location details
                      const lunarLat = missionResult.location?.latitude ?? activeCoordinates?.lat ?? 0;
                      const lunarLng = missionResult.location?.longitude ?? activeCoordinates?.lng ?? 0;
                      const lunarSiteName = missionResult.location?.siteName ?? activeCoordinates?.name ?? 'Target Site';

                      // Adaptive X-axis Time Ticks generator
                      const durHrs = missionResult.duration_hours || durationHours;
                      let stepHours = 4;
                      let formatType: 'time' | 'datetime' | 'date' = 'time';

                      if (durHrs <= 24) {
                        stepHours = 4;
                        formatType = 'time';
                      } else if (durHrs <= 72) {
                        stepHours = 12;
                        formatType = 'datetime';
                      } else if (durHrs <= 168) {
                        stepHours = 24;
                        formatType = 'date';
                      } else if (durHrs <= 336) {
                        stepHours = 48;
                        formatType = 'date';
                      } else {
                        stepHours = 96;
                        formatType = 'date';
                      }

                      const stepSamples = Math.max(1, Math.round(stepHours * 2));
                      const rawTickIndices: number[] = [];
                      for (let i = 0; i < samples.length; i += stepSamples) {
                        rawTickIndices.push(i);
                      }
                      if (rawTickIndices[rawTickIndices.length - 1] !== samples.length - 1) {
                        if (samples.length - 1 - rawTickIndices[rawTickIndices.length - 1] > stepSamples * 0.35) {
                          rawTickIndices.push(samples.length - 1);
                        } else {
                          rawTickIndices[rawTickIndices.length - 1] = samples.length - 1;
                        }
                      }

                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const timeTicks = rawTickIndices.map(idx => {
                        const s = samples[idx];
                        const d = new Date(s.time);
                        const day = d.getUTCDate();
                        const month = monthNames[d.getUTCMonth()];
                        const hours = d.getUTCHours().toString().padStart(2, '0');
                        const mins = d.getUTCMinutes().toString().padStart(2, '0');

                        let label = '';
                        let subLabel = '';
                        if (formatType === 'time') {
                          label = `${hours}:${mins}`;
                          subLabel = `${day} ${month}`;
                        } else if (formatType === 'datetime') {
                          label = `${day} ${month}`;
                          subLabel = `${hours}:${mins}`;
                        } else {
                          label = `${day} ${month}`;
                          subLabel = '';
                        }
                        return { index: idx, label, subLabel };
                      });

                      // Tooltip position calculation with boundary clamping
                      const containerW = chartContainerRef.current?.clientWidth || 1000;
                      const containerH = chartContainerRef.current?.clientHeight || 280;
                      const tooltipWidth = 270;
                      const tooltipHeight = 165;

                      const pointerPxX = chartPointer.active
                        ? chartPointer.containerX
                        : (activeIndex / (samples.length - 1)) * containerW;

                      const pointerPxY = chartPointer.active
                        ? chartPointer.containerY
                        : (activeSunSvgY / height) * containerH;

                      let tipLeft = pointerPxX > containerW - 290
                        ? pointerPxX - tooltipWidth - 14
                        : pointerPxX + 14;
                      tipLeft = Math.max(10, Math.min(containerW - tooltipWidth - 10, tipLeft));

                      let tipTop = pointerPxY > containerH - 180
                        ? pointerPxY - tooltipHeight - 10
                        : pointerPxY + 10;
                      tipTop = Math.max(8, Math.min(containerH - tooltipHeight - 8, tipTop));

                      return (
                        <>
                          <svg
                            viewBox={`0 0 ${width} ${height}`}
                            className="w-full h-full cursor-crosshair select-none"
                            preserveAspectRatio="none"
                          >
                            {/* --- Y-Axis Line & Grid --- */}
                            <line
                              x1={padLeft}
                              y1={padTop}
                              x2={padLeft}
                              y2={height - padBottom}
                              stroke="#475569"
                              strokeWidth="1.5"
                            />

                            {/* Y-axis Title: Rotated Label */}
                            <text
                              transform="rotate(-90)"
                              x={-(padTop + plotH / 2)}
                              y={24}
                              fill="#f59e0b"
                              fontSize="11"
                              textAnchor="middle"
                              fontFamily="monospace"
                              fontWeight="bold"
                              letterSpacing="0.05em"
                            >
                              Solar Elevation Angle (°)
                            </text>

                            {/* Top Y-Axis Unit Header */}
                            <text
                              x={padLeft}
                              y={padTop - 8}
                              fill="#f59e0b"
                              fontSize="10"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              Elevation (°)
                            </text>

                            {/* Y-axis Horizontal Gridlines & Degree Values */}
                            {/* +90° */}
                            <line x1={padLeft} y1={getY(90)} x2={width - padRight} y2={getY(90)} stroke="#1e293b" strokeWidth="1" />
                            <text x={padLeft - 8} y={getY(90) + 4} fill="#cbd5e1" fontSize="10" textAnchor="end" fontFamily="monospace">+90°</text>

                            {/* +45° */}
                            <line x1={padLeft} y1={getY(45)} x2={width - padRight} y2={getY(45)} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                            <text x={padLeft - 8} y={getY(45) + 4} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">+45°</text>

                            {/* 0° Lunar Horizon Reference Line */}
                            <line
                              x1={padLeft}
                              y1={zeroY}
                              x2={width - padRight}
                              y2={zeroY}
                              stroke="#64748b"
                              strokeWidth="1.5"
                              strokeDasharray="4,4"
                            />
                            <text x={padLeft - 8} y={zeroY + 4} fill="#f1f5f9" fontSize="10" textAnchor="end" fontFamily="monospace" fontWeight="bold">0°</text>
                            <text x={padLeft + 8} y={zeroY - 4} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                              0° Lunar Horizon
                            </text>

                            {/* -45° */}
                            <line x1={padLeft} y1={getY(-45)} x2={width - padRight} y2={getY(-45)} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                            <text x={padLeft - 8} y={getY(-45) + 4} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">-45°</text>

                            {/* -90° */}
                            <line x1={padLeft} y1={getY(-90)} x2={width - padRight} y2={getY(-90)} stroke="#1e293b" strokeWidth="1" />
                            <text x={padLeft - 8} y={getY(-90) + 4} fill="#cbd5e1" fontSize="10" textAnchor="end" fontFamily="monospace">-90°</text>

                            {/* --- X-Axis Baseline & Time Ticks --- */}
                            <line
                              x1={padLeft}
                              y1={height - padBottom}
                              x2={width - padRight}
                              y2={height - padBottom}
                              stroke="#475569"
                              strokeWidth="1.5"
                            />

                            {/* Time Ticks & Formatted Labels */}
                            {timeTicks.map((t, i) => {
                              const tickX = getX(t.index);
                              return (
                                <g key={i}>
                                  {/* Vertical Grid Line */}
                                  <line
                                    x1={tickX}
                                    y1={padTop}
                                    x2={tickX}
                                    y2={height - padBottom}
                                    stroke="#1e293b"
                                    strokeWidth="1"
                                    strokeDasharray="2,3"
                                  />
                                  {/* Tick Mark */}
                                  <line
                                    x1={tickX}
                                    y1={height - padBottom}
                                    x2={tickX}
                                    y2={height - padBottom + 5}
                                    stroke="#64748b"
                                    strokeWidth="1"
                                  />
                                  {/* Primary Time Value (HH:MM or Date) */}
                                  <text
                                    x={tickX}
                                    y={height - padBottom + 16}
                                    fill="#cbd5e1"
                                    fontSize="10"
                                    fontFamily="monospace"
                                    fontWeight="600"
                                    textAnchor="middle"
                                  >
                                    {t.label}
                                  </text>
                                  {/* Secondary Sub-Label */}
                                  {t.subLabel && (
                                    <text
                                      x={tickX}
                                      y={height - padBottom + 27}
                                      fill="#94a3b8"
                                      fontSize="8.5"
                                      fontFamily="monospace"
                                      textAnchor="middle"
                                    >
                                      {t.subLabel}
                                    </text>
                                  )}
                                </g>
                              );
                            })}

                            {/* Centered X-Axis Label: "Time (UTC)" */}
                            <text
                              x={padLeft + plotW / 2}
                              y={height - 7}
                              fill="#38bdf8"
                              fontSize="11"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                              letterSpacing="0.05em"
                            >
                              Time (UTC)
                            </text>

                            {/* --- Curves --- */}
                            {/* Sun Elevation Curve (Gold) */}
                            <path
                              d={sunPath}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Earth Elevation Curve (Cyan) */}
                            <path
                              d={earthPath}
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* --- Interactive Highlight Guidelines & Target Dots --- */}
                            {/* Vertical Guideline Tracker */}
                            <line
                              x1={activeSvgX}
                              y1={padTop}
                              x2={activeSvgX}
                              y2={height - padBottom}
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              strokeDasharray="3,3"
                            />

                            {/* Active Sun Elevation Target Point Highlight */}
                            <circle
                              cx={activeSvgX}
                              cy={activeSunSvgY}
                              r="8"
                              fill="#f59e0b"
                              fillOpacity="0.3"
                              stroke="#f59e0b"
                              strokeWidth="1.5"
                            />
                            <circle
                              cx={activeSvgX}
                              cy={activeSunSvgY}
                              r="5"
                              fill="#f59e0b"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />

                            {/* Active Earth Elevation Target Point Highlight */}
                            <circle
                              cx={activeSvgX}
                              cy={activeEarthSvgY}
                              r="4.5"
                              fill="#06b6d4"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          </svg>

                          {/* --- Interactive Inspection Tooltip Overlay --- */}
                          {activeSample && (
                            <div
                              style={{
                                left: `${tipLeft}px`,
                                top: `${tipTop}px`,
                                width: `${tooltipWidth}px`
                              }}
                              className={`pointer-events-auto absolute z-30 p-2.5 rounded-xl bg-space-950/95 border shadow-2xl backdrop-blur-md text-[11px] font-mono space-y-1.5 transition-all duration-75 select-none ${
                                chartPointer.active ? 'border-cyan-400 ring-1 ring-cyan-500/30' : 'border-slate-800/90'
                              }`}
                            >
                              {/* Tooltip Header: Target Location & Timeline step */}
                              <div className="border-b border-slate-800/80 pb-1 flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  <span className="font-bold text-white truncate text-[11px]" title={lunarSiteName}>
                                    {lunarSiteName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                                    T+{Math.floor(activeIndex * 0.5)}h
                                  </span>
                                  {chartPointer.touchLocked && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setChartPointer(prev => ({ ...prev, active: false, touchLocked: false }));
                                      }}
                                      className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                                      title="Dismiss Tooltip"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* 1. Time corresponding to that data point */}
                              <div className="flex items-start gap-1.5 text-slate-300">
                                <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <span className="text-[10px] text-slate-400 block leading-tight">Time (UTC):</span>
                                  <span className="font-bold text-slate-100 text-[10.5px]">
                                    {new Date(activeSample.time).toUTCString().slice(0, 22)} UTC
                                  </span>
                                </div>
                              </div>

                              {/* 2. Solar elevation angle in degrees */}
                              <div className="flex items-start gap-1.5 bg-amber-950/30 p-1.5 rounded-lg border border-amber-500/30">
                                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-amber-300 font-bold">Solar Elevation:</span>
                                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                      sunElev > 0
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {sunElev > 0 ? 'DAYLIGHT' : 'NIGHT / SHADOW'}
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-white">
                                    {sunElev >= 0 ? '+' : ''}{sunElev.toFixed(2)}°
                                    <span className="text-[10px] font-normal text-slate-400 ml-1.5">
                                      (Az: {activeSample.solar_azimuth_deg.toFixed(1)}°)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 3 & 4. Latitude & Longitude of selected lunar location */}
                              <div className="pt-0.5 border-t border-slate-800/60 grid grid-cols-2 gap-1.5 text-[10px]">
                                <div>
                                  <span className="text-slate-400 block text-[9px]">Latitude:</span>
                                  <span className="font-bold text-cyan-300">
                                    {lunarLat >= 0 ? `+${lunarLat.toFixed(4)}°` : `${lunarLat.toFixed(4)}°`}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px]">Longitude:</span>
                                  <span className="font-bold text-cyan-300">
                                    {lunarLng >= 0 ? `+${lunarLng.toFixed(4)}°` : `${lunarLng.toFixed(4)}°`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* --- 2E. Sunlight & Earth Communication Timeline Bars --- */}
                <div className="space-y-2 pt-1">
                  {/* Sunlight Availability Timeline */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5 text-amber-300">
                        <Sun className="w-3 h-3" />
                        Sunlight Illumination Availability:
                      </span>
                      <span>
                        {missionResult.metrics.sunlight_hours.toFixed(1)} / {missionResult.duration_hours} h
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-md bg-space-950 border border-slate-800 overflow-hidden flex">
                      {missionResult.samples.map((s, idx) => (
                        <div
                          key={idx}
                          className={`h-full flex-1 ${s.solar_elevation_deg > 0 ? 'bg-amber-400' : 'bg-slate-900'}`}
                          title={`Time: ${new Date(s.time).toUTCString().slice(5, 22)} • Sun: ${s.solar_elevation_deg.toFixed(1)}°`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Earth Line-of-Sight Timeline */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <Radio className="w-3 h-3" />
                        Earth Direct Comms Line-of-Sight:
                      </span>
                      <span>
                        {missionResult.metrics.communication_hours.toFixed(1)} / {missionResult.duration_hours} h
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-md bg-space-950 border border-slate-800 overflow-hidden flex">
                      {missionResult.samples.map((s, idx) => (
                        <div
                          key={idx}
                          className={`h-full flex-1 ${s.earth_elevation_deg > 0 ? 'bg-cyan-400' : 'bg-rose-950/70'}`}
                          title={`Time: ${new Date(s.time).toUTCString().slice(5, 22)} • Earth: ${s.earth_elevation_deg.toFixed(1)}°`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Timeline start/mid/end time labels */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                    <span>{new Date(missionResult.start_time).toUTCString().slice(5, 16)}</span>
                    <span>Midpoint ({Math.round(missionResult.duration_hours / 2)}h)</span>
                    <span>{new Date(missionResult.end_time).toUTCString().slice(5, 16)}</span>
                  </div>
                </div>
              </div>

              {/* --- 2F. Detailed Tabs: Overview & Feasibility, Solar Passes, Earth Passes, Saved Features --- */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'overview'
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    Feasibility Assessment
                  </button>

                  <button
                    onClick={() => setActiveTab('solar')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'solar'
                        ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Solar Passes ({sunIntervals.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('earth')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'earth'
                        ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    Earth Windows ({earthIntervals.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('features')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'features'
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Saved Features ({savedFeatures.length})
                  </button>
                </div>

                {/* TAB 1: Feasibility Assessment */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 rounded-xl bg-space-900/60 border border-slate-800 p-4 font-mono text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-slate-300">
                          Mission Feasibility Evaluation:
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold border ${getFeasibilityStyle(feasibilityLevel).badgeBg}`}>
                          {missionResult.feasibility.rating}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed bg-space-950/60 p-3 rounded-xl border border-slate-800/80">
                        {missionResult.feasibility.summary}
                      </p>
                    </div>

                    {/* Operational Reasons */}
                    <div className="space-y-2">
                      <span className="font-bold uppercase tracking-wider text-slate-300 block">
                        Astrodynamic & Operational Factors:
                      </span>
                      <ul className="space-y-1.5">
                        {missionResult.feasibility.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-400">
                            <span className="text-blue-400 font-bold">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* TAB 2: Solar Passes Table */}
                {activeTab === 'solar' && (
                  <div className="rounded-xl bg-space-900/60 border border-slate-800 overflow-hidden font-mono text-xs">
                    <div className="p-3 bg-space-950/80 border-b border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-amber-300 uppercase tracking-wider">
                        Solar Illumination Intervals ({sunIntervals.length} total)
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Total: {missionResult.metrics.sunlight_hours.toFixed(1)} hours
                      </span>
                    </div>

                    {sunIntervals.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        No periods of solar illumination occur at this site during the specified mission time window (continuous lunar night / polar shadow).
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-[10px] text-slate-400 bg-space-950/40">
                              <th className="p-2.5">Pass #</th>
                              <th className="p-2.5">Start Time (UTC)</th>
                              <th className="p-2.5">End Time (UTC)</th>
                              <th className="p-2.5">Duration</th>
                              <th className="p-2.5">Max Sun Elev</th>
                              <th className="p-2.5">Mean Sun Elev</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {sunIntervals.map((interval: VisibilityInterval, idx: number) => (
                              <tr key={idx} className="hover:bg-amber-950/20 transition-colors">
                                <td className="p-2.5 font-bold text-amber-400">#{idx + 1}</td>
                                <td className="p-2.5">{new Date(interval.start).toUTCString().slice(5, 22)}</td>
                                <td className="p-2.5">{new Date(interval.end).toUTCString().slice(5, 22)}</td>
                                <td className="p-2.5 text-white font-bold">{interval.metrics.duration_hours.toFixed(1)} hrs</td>
                                <td className="p-2.5 text-amber-300">+{interval.metrics.maximum_elevation_deg.toFixed(1)}°</td>
                                <td className="p-2.5">+{interval.metrics.mean_elevation_deg.toFixed(1)}°</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Earth Comms Passes Table */}
                {activeTab === 'earth' && (
                  <div className="rounded-xl bg-space-900/60 border border-slate-800 overflow-hidden font-mono text-xs">
                    <div className="p-3 bg-space-950/80 border-b border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-cyan-300 uppercase tracking-wider">
                        Direct-to-Earth (DTE) Communication Windows ({earthIntervals.length} total)
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Total: {missionResult.metrics.communication_hours.toFixed(1)} hours
                      </span>
                    </div>

                    {earthIntervals.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        No direct line of sight to Earth exists from this coordinate (lunar far side or persistent crater shadow). An orbital relay is mandatory.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-[10px] text-slate-400 bg-space-950/40">
                              <th className="p-2.5">Window #</th>
                              <th className="p-2.5">Start Time (UTC)</th>
                              <th className="p-2.5">End Time (UTC)</th>
                              <th className="p-2.5">Duration</th>
                              <th className="p-2.5">Max Earth Elev</th>
                              <th className="p-2.5">Mean Earth Elev</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {earthIntervals.map((interval: VisibilityInterval, idx: number) => (
                              <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                                <td className="p-2.5 font-bold text-cyan-400">#{idx + 1}</td>
                                <td className="p-2.5">{new Date(interval.start).toUTCString().slice(5, 22)}</td>
                                <td className="p-2.5">{new Date(interval.end).toUTCString().slice(5, 22)}</td>
                                <td className="p-2.5 text-white font-bold">{interval.metrics.duration_hours.toFixed(1)} hrs</td>
                                <td className="p-2.5 text-cyan-300">+{interval.metrics.maximum_elevation_deg.toFixed(1)}°</td>
                                <td className="p-2.5">+{interval.metrics.mean_elevation_deg.toFixed(1)}°</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Saved Exploration Features (CRUD) */}
                {activeTab === 'features' && (
                  <div className="space-y-4 rounded-xl bg-space-900/60 border border-slate-800 p-4 font-mono text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                      <div>
                        <span className="font-bold text-purple-300 uppercase tracking-wider block">
                          Saved Exploration Features & Custom Sites
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Save custom targets, landmarks, or mission waypoints to evaluate their solar & communication availability.
                        </p>
                      </div>
                    </div>

                    {/* Add Feature Form */}
                    <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80 space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                        Save Current Location ({activeCoordinates?.lat.toFixed(4)}°, {activeCoordinates?.lng.toFixed(4)}°) as New Feature:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newFeatureName}
                          onChange={(e) => setNewFeatureName(e.target.value)}
                          placeholder="Feature Name (e.g., Artemis Base Camp Ridge)"
                          className="px-3 py-1.5 rounded-lg bg-space-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                        />
                        <input
                          type="text"
                          value={newFeatureDesc}
                          onChange={(e) => setNewFeatureDesc(e.target.value)}
                          placeholder="Feature Notes / Exploration objectives"
                          className="px-3 py-1.5 rounded-lg bg-space-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <button
                        onClick={handleSaveFeature}
                        disabled={!newFeatureName.trim()}
                        className="px-3 py-1.5 rounded-lg bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 border border-purple-500/50 font-bold text-xs font-mono transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Save Feature</span>
                      </button>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Saved Target Landmarks ({savedFeatures.length}):
                      </span>

                      {savedFeatures.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">
                          No saved exploration features yet. Use the form above to bookmark your favorite lunar targets.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {savedFeatures.map(feat => (
                            <div
                              key={feat.id}
                              className="p-3 rounded-xl bg-space-950 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between gap-3"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{feat.name}</span>
                                  <span className="text-[10px] text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
                                    {feat.latitude.toFixed(4)}°, {feat.longitude.toFixed(4)}°
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-1">{feat.description}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleLoadSavedFeature(feat)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-500/40 text-blue-300 hover:text-white hover:bg-blue-900 text-[10px] font-bold transition-colors"
                                >
                                  Evaluate
                                </button>
                                <button
                                  onClick={() => handleDeleteFeature(feat.id)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                                  title="Delete feature"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800/80 bg-space-900/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NASA Horizons Astrodynamics Engine • 30-min Planetary Ephemeris Active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-space-950 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
            >
              Close Evaluator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
