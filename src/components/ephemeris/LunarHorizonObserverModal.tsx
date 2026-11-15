import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Sun, 
  Globe, 
  Compass, 
  Plane, 
  Eye, 
  Radio, 
  Zap, 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { 
  calculateLunarHorizonEphemeris, 
  LUNAR_HORIZON_PRESETS, 
  HorizonPreset, 
  LunarEphemerisResult 
} from '../../utils/lunarEphemeris';
import { LUNAR_POIS } from '../../data/lunarPOIs';
import { 
  getInitialHorizonState, 
  saveHorizonState, 
  DEFAULT_HORIZON_STATE, 
  HorizonActionType, 
  HorizonPersistedState 
} from '../../utils/horizonStatePersistence';

interface LunarHorizonObserverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToHorizon: (lat: number, lng: number, headingDeg: number, pitchDeg?: number, altitudeMeters?: number) => void;
  onLookAtDirection: (headingDeg: number, pitchDeg: number) => void;
  onSetSimulationDate: (date: Date) => void;
  onShowCelestialMarkers: (siteLat: number, siteLng: number, sunAlt: number, sunAz: number, earthAlt: number, earthAz: number) => void;
  currentHoverCoord?: { lat: number; lng: number; siteName?: string } | null;
  onActionTriggered?: (payload: {
    action: HorizonActionType;
    siteName: string;
    lat: number;
    lng: number;
    headingDeg: number;
    pitchDeg: number;
    sunAlt: number;
    sunAz: number;
    earthAlt: number;
    earthAz: number;
    timestamp: number;
  }) => void;
}

export const LunarHorizonObserverModal: React.FC<LunarHorizonObserverModalProps> = ({
  isOpen,
  onClose,
  onFlyToHorizon,
  onLookAtDirection,
  onSetSimulationDate,
  onShowCelestialMarkers,
  currentHoverCoord,
  onActionTriggered
}) => {
  const defaultPreset = LUNAR_HORIZON_PRESETS[0]; // Apollo 11

  // Load persisted initial state
  const [initialLoadedState] = useState<HorizonPersistedState>(() => getInitialHorizonState());
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialLoadedState.selectedPresetId);
  const [siteName, setSiteName] = useState<string>(initialLoadedState.siteName);
  const [lat, setLat] = useState<number>(initialLoadedState.lat);
  const [lng, setLng] = useState<number>(initialLoadedState.lng);
  const [dateTimeIso, setDateTimeIso] = useState<string>(initialLoadedState.dateTimeIso);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'horizon' | 'ephemeris'>(initialLoadedState.activeFilterTab || 'all');
  const [lastAction, setLastAction] = useState<HorizonActionType>(initialLoadedState.lastAction);
  const [lastActionTimestamp, setLastActionTimestamp] = useState<number | null>(initialLoadedState.lastActionTimestamp);
  const [lastActionSummary, setLastActionSummary] = useState<string>(initialLoadedState.lastActionSummary || '');

  // Synchronize state from localStorage whenever modal opens to restore previous actions & settings
  useEffect(() => {
    if (isOpen) {
      const current = getInitialHorizonState();
      setSelectedPresetId(current.selectedPresetId);
      setSiteName(current.siteName);
      setLat(current.lat);
      setLng(current.lng);
      setDateTimeIso(current.dateTimeIso);
      setActiveFilterTab(current.activeFilterTab || 'all');
      setLastAction(current.lastAction);
      setLastActionTimestamp(current.lastActionTimestamp);
      setLastActionSummary(current.lastActionSummary || '');
    }
  }, [isOpen]);

  // Observation state: calculate live ephemeris
  const activeDate = useMemo(() => {
    try {
      const d = new Date(dateTimeIso);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  }, [dateTimeIso]);

  const ephemeris: LunarEphemerisResult = useMemo(() => {
    return calculateLunarHorizonEphemeris(activeDate, lat, lng);
  }, [activeDate, lat, lng]);

  // Handle Preset Selection
  const handleSelectPreset = useCallback((preset: HorizonPreset) => {
    setSelectedPresetId(preset.id);
    setSiteName(preset.name);
    setLat(preset.lat);
    setLng(preset.lng);
    // Format to YYYY-MM-DDTHH:mm for datetime-local input
    const d = new Date(preset.dateIso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    setDateTimeIso(formatted);
    saveHorizonState({
      selectedPresetId: preset.id,
      siteName: preset.name,
      lat: preset.lat,
      lng: preset.lng,
      dateTimeIso: formatted
    });
  }, []);

  // Use current live time
  const handleSetCurrentTime = useCallback(() => {
    setSelectedPresetId('custom');
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}T${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
    setDateTimeIso(formatted);
    saveHorizonState({
      selectedPresetId: 'custom',
      dateTimeIso: formatted
    });
  }, []);

  // Use coordinates from interactive lunar globe click/hover
  const handleUseCurrentPickedLocation = useCallback(() => {
    if (currentHoverCoord) {
      const newLat = Number(currentHoverCoord.lat.toFixed(4));
      const newLng = Number(currentHoverCoord.lng.toFixed(4));
      const newName = currentHoverCoord.siteName || `Lunar Site (${newLat >= 0 ? '+' : ''}${newLat}°, ${newLng >= 0 ? '+' : ''}${newLng}°)`;
      setSelectedPresetId('custom');
      setLat(newLat);
      setLng(newLng);
      setSiteName(newName);
      saveHorizonState({
        selectedPresetId: 'custom',
        lat: newLat,
        lng: newLng,
        siteName: newName
      });
    }
  }, [currentHoverCoord]);

  // Master Flyover & Observe Horizon Action: triggers flyover, persists state, and automatically closes popup
  const handleFlyoverAndObserve = useCallback(() => {
    const actionTs = Date.now();
    const summary = `Horizon Flyover at ${siteName} (${lat >= 0 ? '+' : ''}${lat.toFixed(3)}°, ${lng >= 0 ? '+' : ''}${lng.toFixed(3)}°)`;

    // 1. Persist state
    saveHorizonState({
      selectedPresetId,
      siteName,
      lat,
      lng,
      dateTimeIso,
      lastAction: 'flyover',
      lastActionTimestamp: actionTs,
      lastActionSummary: summary,
      activeFilterTab
    });
    setLastAction('flyover');
    setLastActionTimestamp(actionTs);
    setLastActionSummary(summary);

    // 2. Sync Cesium simulation date
    onSetSimulationDate(activeDate);

    // 3. Compute preferred initial horizon heading (aim towards Sun or Earth, whichever is above horizon)
    let heading = ephemeris.sun.azimuthDeg;
    let pitch = -5; // looking across horizon
    if (!ephemeris.sun.isVisible && ephemeris.earth.isVisible) {
      heading = ephemeris.earth.azimuthDeg;
    }

    // 4. Fly camera to surface eye-level altitude (280 meters)
    onFlyToHorizon(lat, lng, heading, pitch, 280);

    // 5. Render 3D Celestial vectors & markers in Cesium
    onShowCelestialMarkers(
      lat,
      lng,
      ephemeris.sun.altitudeDeg,
      ephemeris.sun.azimuthDeg,
      ephemeris.earth.altitudeDeg,
      ephemeris.earth.azimuthDeg
    );

    // 6. Notify parent
    onActionTriggered?.({
      action: 'flyover',
      siteName,
      lat,
      lng,
      headingDeg: heading,
      pitchDeg: pitch,
      sunAlt: ephemeris.sun.altitudeDeg,
      sunAz: ephemeris.sun.azimuthDeg,
      earthAlt: ephemeris.earth.altitudeDeg,
      earthAz: ephemeris.earth.azimuthDeg,
      timestamp: actionTs
    });

    // 7. AUTOMATICALLY CLOSE POPUP IMMEDIATELY
    onClose();
  }, [
    activeDate,
    lat,
    lng,
    siteName,
    selectedPresetId,
    dateTimeIso,
    activeFilterTab,
    ephemeris,
    onSetSimulationDate,
    onFlyToHorizon,
    onShowCelestialMarkers,
    onActionTriggered,
    onClose
  ]);

  // Orient at Sun Action: smoothly points camera at Sun, persists state, and automatically closes popup
  const handleOrientAtSun = useCallback(() => {
    const actionTs = Date.now();
    const targetPitch = Math.max(-10, ephemeris.sun.altitudeDeg);
    const summary = `Oriented at Sun (${ephemeris.sun.azimuthDeg}°, Alt ${ephemeris.sun.altitudeDeg >= 0 ? '+' : ''}${ephemeris.sun.altitudeDeg}°) at ${siteName}`;

    // 1. Persist state
    saveHorizonState({
      selectedPresetId,
      siteName,
      lat,
      lng,
      dateTimeIso,
      lastAction: 'orient-sun',
      lastActionTimestamp: actionTs,
      lastActionSummary: summary,
      activeFilterTab
    });
    setLastAction('orient-sun');
    setLastActionTimestamp(actionTs);
    setLastActionSummary(summary);

    // 2. Sync Cesium simulation date
    onSetSimulationDate(activeDate);

    // 3. Ensure 3D celestial markers exist at this site
    onShowCelestialMarkers(
      lat,
      lng,
      ephemeris.sun.altitudeDeg,
      ephemeris.sun.azimuthDeg,
      ephemeris.earth.altitudeDeg,
      ephemeris.earth.azimuthDeg
    );

    // 4. Smoothly point 3D camera towards Sun
    onLookAtDirection(ephemeris.sun.azimuthDeg, targetPitch);

    // 5. Notify parent
    onActionTriggered?.({
      action: 'orient-sun',
      siteName,
      lat,
      lng,
      headingDeg: ephemeris.sun.azimuthDeg,
      pitchDeg: targetPitch,
      sunAlt: ephemeris.sun.altitudeDeg,
      sunAz: ephemeris.sun.azimuthDeg,
      earthAlt: ephemeris.earth.altitudeDeg,
      earthAz: ephemeris.earth.azimuthDeg,
      timestamp: actionTs
    });

    // 6. AUTOMATICALLY CLOSE POPUP IMMEDIATELY
    onClose();
  }, [
    activeDate,
    lat,
    lng,
    siteName,
    selectedPresetId,
    dateTimeIso,
    activeFilterTab,
    ephemeris,
    onSetSimulationDate,
    onShowCelestialMarkers,
    onLookAtDirection,
    onActionTriggered,
    onClose
  ]);

  // Orient at Earth Action: smoothly points camera at Earth, persists state, and automatically closes popup
  const handleOrientAtEarth = useCallback(() => {
    const actionTs = Date.now();
    const targetPitch = Math.max(-10, ephemeris.earth.altitudeDeg);
    const summary = `Oriented at Earth (${ephemeris.earth.azimuthDeg}°, Alt ${ephemeris.earth.altitudeDeg >= 0 ? '+' : ''}${ephemeris.earth.altitudeDeg}°) at ${siteName}`;

    // 1. Persist state
    saveHorizonState({
      selectedPresetId,
      siteName,
      lat,
      lng,
      dateTimeIso,
      lastAction: 'orient-earth',
      lastActionTimestamp: actionTs,
      lastActionSummary: summary,
      activeFilterTab
    });
    setLastAction('orient-earth');
    setLastActionTimestamp(actionTs);
    setLastActionSummary(summary);

    // 2. Sync Cesium simulation date
    onSetSimulationDate(activeDate);

    // 3. Ensure 3D celestial markers exist at this site
    onShowCelestialMarkers(
      lat,
      lng,
      ephemeris.sun.altitudeDeg,
      ephemeris.sun.azimuthDeg,
      ephemeris.earth.altitudeDeg,
      ephemeris.earth.azimuthDeg
    );

    // 4. Smoothly point 3D camera towards Earth
    onLookAtDirection(ephemeris.earth.azimuthDeg, targetPitch);

    // 5. Notify parent
    onActionTriggered?.({
      action: 'orient-earth',
      siteName,
      lat,
      lng,
      headingDeg: ephemeris.earth.azimuthDeg,
      pitchDeg: targetPitch,
      sunAlt: ephemeris.sun.altitudeDeg,
      sunAz: ephemeris.sun.azimuthDeg,
      earthAlt: ephemeris.earth.altitudeDeg,
      earthAz: ephemeris.earth.azimuthDeg,
      timestamp: actionTs
    });

    // 6. AUTOMATICALLY CLOSE POPUP IMMEDIATELY
    onClose();
  }, [
    activeDate,
    lat,
    lng,
    siteName,
    selectedPresetId,
    dateTimeIso,
    activeFilterTab,
    ephemeris,
    onSetSimulationDate,
    onShowCelestialMarkers,
    onLookAtDirection,
    onActionTriggered,
    onClose
  ]);

  // Re-execute last action helper
  const handleReexecuteLastAction = useCallback(() => {
    if (lastAction === 'orient-sun') {
      handleOrientAtSun();
    } else if (lastAction === 'orient-earth') {
      handleOrientAtEarth();
    } else {
      handleFlyoverAndObserve();
    }
  }, [lastAction, handleOrientAtSun, handleOrientAtEarth, handleFlyoverAndObserve]);

  // Reset tool settings to baseline defaults
  const handleResetToBaseline = useCallback(() => {
    handleSelectPreset(defaultPreset);
    setLastAction(null);
    setLastActionTimestamp(null);
    setLastActionSummary('');
    saveHorizonState({
      ...DEFAULT_HORIZON_STATE,
      lastAction: null,
      lastActionTimestamp: null,
      lastActionSummary: ''
    });
  }, [defaultPreset, handleSelectPreset]);

  // Handle Tab Change
  const handleTabChange = useCallback((tab: 'all' | 'horizon' | 'ephemeris') => {
    setActiveFilterTab(tab);
    saveHorizonState({ activeFilterTab: tab });
  }, []);

  if (!isOpen) return null;

  // Cardinal direction helper
  const getCardinal = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return directions[idx];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-space-950/95 border border-amber-500/30 hover:border-amber-500/50 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-hidden font-sans">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800/80 bg-space-900/60 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/40 text-amber-300">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider text-white">
                  Lunar Horizon & Celestial Ephemeris
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hidden sm:inline-block">
                  JEAN MEEUS ASTRONOMY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Observe Sun and Earth positions, altitude above lunar horizon, and direct line-of-sight telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* View Filter Tabs */}
            <div className="flex items-center p-0.5 rounded-xl bg-space-950 border border-slate-800 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeFilterTab === 'all'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View All Horizon & Ephemeris Controls"
              >
                All Overview
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('horizon')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  activeFilterTab === 'horizon'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Focus on Lunar Horizon Flyover"
              >
                <Plane className="w-3 h-3" />
                <span>Horizon</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('ephemeris')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  activeFilterTab === 'ephemeris'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Focus on Celestial Ephemeris & Sun/Earth Orientation"
              >
                <Sun className="w-3 h-3" />
                <span>Ephemeris</span>
              </button>
            </div>

            <button
              onClick={handleResetToBaseline}
              className="p-1.5 rounded-xl bg-space-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset to Apollo 11 Baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-space-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/40 text-slate-400 hover:text-white transition-colors"
              title="Close Ephemeris Tool"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin">

          {/* Persistent State Indicator Banner: Displays Last Performed Action */}
          {lastAction && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-space-900/80 to-cyan-500/15 border border-amber-500/40 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                  {lastAction === 'flyover' && <Plane className="w-4 h-4" />}
                  {lastAction === 'orient-sun' && <Sun className="w-4 h-4" />}
                  {lastAction === 'orient-earth' && <Globe className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Previous Action Restored:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/25 border border-amber-500/50 text-white">
                      {lastAction === 'flyover' && 'Flyover & Observe Horizon'}
                      {lastAction === 'orient-sun' && 'Orient 3D Camera at Sun'}
                      {lastAction === 'orient-earth' && 'Orient 3D Camera at Earth'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">
                    {lastActionSummary || `Configured for ${siteName} (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`}
                    {lastActionTimestamp && (
                      <span className="text-slate-400 ml-2 font-mono text-[11px]">
                        · Executed at {new Date(lastActionTimestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleReexecuteLastAction}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 group"
                  title="Re-execute this action immediately and close popup"
                >
                  <span>Re-Execute</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Mission Presets Bar (Visible in all and horizon views) */}
          {(activeFilterTab === 'all' || activeFilterTab === 'horizon') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Select Historic or Future Mission Event:
                </span>
                {currentHoverCoord && (
                  <button
                    onClick={handleUseCurrentPickedLocation}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Use Active Lunar Globe Location ({currentHoverCoord.lat >= 0 ? '+' : ''}{currentHoverCoord.lat.toFixed(2)}°, {currentHoverCoord.lng >= 0 ? '+' : ''}{currentHoverCoord.lng.toFixed(2)}°)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {LUNAR_HORIZON_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-950/30'
                          : 'bg-space-900/60 border-slate-800 hover:border-slate-700 hover:bg-space-900'
                      }`}
                    >
                      <div className="text-[11px] font-mono font-bold text-white truncate">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {preset.mission}
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={handleSetCurrentTime}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedPresetId === 'custom'
                      ? 'bg-cyan-500/20 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                      : 'bg-space-900/60 border-slate-800 hover:border-cyan-500/40 hover:bg-space-900'
                  }`}
                >
                  <div className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Current Time</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Real-Time Ephemeris
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Input Controls Grid: Date & Time + Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-space-900/70 border border-slate-800/80">
            {/* Observation Date & Time */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>OBSERVATION DATE & TIME (UTC)</span>
              </label>
              <input
                type="datetime-local"
                value={dateTimeIso}
                onChange={(e) => {
                  setSelectedPresetId('custom');
                  setDateTimeIso(e.target.value);
                  saveHorizonState({
                    selectedPresetId: 'custom',
                    dateTimeIso: e.target.value
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white font-mono text-xs outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400">
                Gregorian Calendar UTC. Ephemeris calculates exact solar day/night and libration.
              </p>
            </div>

            {/* Landing Site Coordinates */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>LANDING SITE COORDINATES</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">LAT (-90° to +90°)</div>
                  <input
                    type="number"
                    step="0.001"
                    min="-90"
                    max="90"
                    value={lat}
                    onChange={(e) => {
                      const newLat = Number(e.target.value);
                      setSelectedPresetId('custom');
                      setLat(newLat);
                      saveHorizonState({
                        selectedPresetId: 'custom',
                        lat: newLat
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-space-950 border border-slate-700 focus:border-cyan-400 text-white font-mono text-xs outline-none"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">LNG (-180° to +180°)</div>
                  <input
                    type="number"
                    step="0.001"
                    min="-180"
                    max="180"
                    value={lng}
                    onChange={(e) => {
                      const newLng = Number(e.target.value);
                      setSelectedPresetId('custom');
                      setLng(newLng);
                      saveHorizonState({
                        selectedPresetId: 'custom',
                        lng: newLng
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-space-950 border border-slate-700 focus:border-cyan-400 text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Site Name and Flyover Trigger */}
            <div className="md:col-span-3 flex flex-col justify-between space-y-1.5">
              <div>
                <label className="text-xs font-mono font-bold text-slate-300">
                  SITE LABEL
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => {
                    setSiteName(e.target.value);
                    saveHorizonState({ siteName: e.target.value });
                  }}
                  placeholder="e.g. Tranquility Base"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-space-950 border border-slate-700 text-slate-200 text-xs font-mono outline-none"
                />
              </div>

              {/* Master Flyover & Observe Horizon Action Button */}
              <button
                type="button"
                onClick={handleFlyoverAndObserve}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/50 group"
                title="Immediately launch surface horizon flyover and close popup"
              >
                <Plane className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Flyover & Observe Horizon</span>
                {lastAction === 'flyover' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white text-slate-950 ml-1">
                    ✓
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Dual Horizon Sky Domes / Polar Radars (Visible in all and ephemeris views) */}
          {(activeFilterTab === 'all' || activeFilterTab === 'ephemeris') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. Sun Horizon Radar */}
              <div className="p-4 rounded-2xl bg-space-900/60 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Sun Position vs. Lunar Horizon
                      </h3>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Topocentric celestial elevation and solar azimuth
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      ephemeris.sun.illuminationState === 'daylight'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : ephemeris.sun.illuminationState === 'grazing'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    }`}>
                      {ephemeris.sun.illuminationState.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Visual Radar Container */}
                <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-full bg-space-950 border border-slate-800 flex items-center justify-center p-3">
                  {/* Concentric Elevation Rings */}
                  <div className="absolute inset-4 rounded-full border border-slate-800/80" title="Elevation 30°" />
                  <div className="absolute inset-10 rounded-full border border-slate-800/80" title="Elevation 60°" />
                  <div className="absolute inset-[46%] rounded-full bg-slate-700/60" title="Zenith (90°)" />

                  {/* Compass Crosshairs */}
                  <div className="absolute inset-x-2 top-1/2 h-px bg-slate-800/70" />
                  <div className="absolute inset-y-2 left-1/2 w-px bg-slate-800/70" />

                  {/* Cardinal Labels */}
                  <span className="absolute top-1 text-[9px] font-mono text-slate-400">N (0°)</span>
                  <span className="absolute right-1 text-[9px] font-mono text-slate-400">E (90°)</span>
                  <span className="absolute bottom-1 text-[9px] font-mono text-slate-400">S (180°)</span>
                  <span className="absolute left-1 text-[9px] font-mono text-slate-400">W (270°)</span>

                  {/* Sun Marker Plotted on Radar */}
                  {(() => {
                    const clampedAlt = Math.max(-10, Math.min(90, ephemeris.sun.altitudeDeg));
                    const rPct = Math.max(0, (90 - clampedAlt) / 90) * 44;
                    const azRad = (ephemeris.sun.azimuthDeg - 90) * (Math.PI / 180);
                    const x = 50 + rPct * Math.cos(azRad);
                    const y = 50 + rPct * Math.sin(azRad);

                    return (
                      <div
                        style={{ left: `${x}%`, top: `${y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group cursor-pointer"
                        title={`Sun: Altitude ${ephemeris.sun.altitudeDeg}°, Azimuth ${ephemeris.sun.azimuthDeg}°`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          ephemeris.sun.isVisible
                            ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/80 animate-pulse'
                            : 'bg-slate-700 border border-slate-600 text-slate-400'
                        }`}>
                          <Sun className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Sun Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">HORIZON ALTITUDE</div>
                    <div className={`text-sm font-bold ${ephemeris.sun.altitudeDeg >= 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {ephemeris.sun.altitudeDeg >= 0 ? '+' : ''}{ephemeris.sun.altitudeDeg}°
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {ephemeris.sun.isVisible ? 'Above Horizon' : 'Below Horizon (Night)'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">SOLAR AZIMUTH</div>
                    <div className="text-sm font-bold text-white">
                      {ephemeris.sun.azimuthDeg}°
                    </div>
                    <div className="text-[9px] text-amber-400">
                      Bearing: {getCardinal(ephemeris.sun.azimuthDeg)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">SOLAR FLUX</div>
                    <div className="text-xs font-bold text-amber-300">
                      {ephemeris.sun.solarFluxWm2} W/m²
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {ephemeris.sun.solarFluxWm2 > 0 ? 'Solar Power Active' : 'No Solar Generation'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">SHADOW MULTIPLIER</div>
                    <div className="text-xs font-bold text-white">
                      {ephemeris.sun.altitudeDeg > 0 ? `${ephemeris.sun.shadowLengthFactor}× Height` : 'Diffuse Shadow'}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {ephemeris.sun.altitudeDeg <= 5 && ephemeris.sun.altitudeDeg > 0 ? 'Long Rim Shadows' : 'Standard Shadows'}
                    </div>
                  </div>
                </div>

                {/* Orient At Sun Action: Automatically closes popup and orients camera */}
                <button
                  type="button"
                  onClick={handleOrientAtSun}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-md group ${
                    lastAction === 'orient-sun'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 hover:border-amber-400 text-amber-300'
                  }`}
                  title="Orient 3D lunar camera towards Sun and close popup"
                >
                  <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Orient 3D Camera at Sun ({getCardinal(ephemeris.sun.azimuthDeg)})</span>
                  {lastAction === 'orient-sun' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400 text-slate-950">
                      ✓ LAST ACTION
                    </span>
                  )}
                </button>
              </div>

              {/* 2. Earth Horizon Radar */}
              <div className="p-4 rounded-2xl bg-space-900/60 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Earth Position vs. Lunar Horizon
                      </h3>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Direct line-of-sight & communication window
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      ephemeris.earth.commStatus === 'direct-line-of-sight'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : ephemeris.earth.commStatus === 'horizon-marginal'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {ephemeris.earth.commStatus === 'direct-line-of-sight' ? 'DIRECT DTE' : ephemeris.earth.commStatus === 'horizon-marginal' ? 'MARGINAL' : 'FARSIDE OCCULTED'}
                    </span>
                  </div>
                </div>

                {/* Visual Radar Container */}
                <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-full bg-space-950 border border-slate-800 flex items-center justify-center p-3">
                  <div className="absolute inset-4 rounded-full border border-slate-800/80" title="Elevation 30°" />
                  <div className="absolute inset-10 rounded-full border border-slate-800/80" title="Elevation 60°" />
                  <div className="absolute inset-[46%] rounded-full bg-slate-700/60" title="Zenith (90°)" />

                  <div className="absolute inset-x-2 top-1/2 h-px bg-slate-800/70" />
                  <div className="absolute inset-y-2 left-1/2 w-px bg-slate-800/70" />

                  <span className="absolute top-1 text-[9px] font-mono text-slate-400">N (0°)</span>
                  <span className="absolute right-1 text-[9px] font-mono text-slate-400">E (90°)</span>
                  <span className="absolute bottom-1 text-[9px] font-mono text-slate-400">S (180°)</span>
                  <span className="absolute left-1 text-[9px] font-mono text-slate-400">W (270°)</span>

                  {/* Earth Marker Plotted on Radar */}
                  {(() => {
                    const clampedAlt = Math.max(-10, Math.min(90, ephemeris.earth.altitudeDeg));
                    const rPct = Math.max(0, (90 - clampedAlt) / 90) * 44;
                    const azRad = (ephemeris.earth.azimuthDeg - 90) * (Math.PI / 180);
                    const x = 50 + rPct * Math.cos(azRad);
                    const y = 50 + rPct * Math.sin(azRad);

                    return (
                      <div
                        style={{ left: `${x}%`, top: `${y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group cursor-pointer"
                        title={`Earth: Altitude ${ephemeris.earth.altitudeDeg}°, Azimuth ${ephemeris.earth.azimuthDeg}°, Phase: ${ephemeris.earth.earthPhaseName}`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          ephemeris.earth.isVisible
                            ? 'bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/80 animate-pulse'
                            : 'bg-rose-950/80 border border-rose-500 text-rose-300'
                        }`}>
                          <Globe className="w-3 h-3" />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Earth Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">HORIZON ALTITUDE</div>
                    <div className={`text-sm font-bold ${ephemeris.earth.altitudeDeg >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                      {ephemeris.earth.altitudeDeg >= 0 ? '+' : ''}{ephemeris.earth.altitudeDeg}°
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {ephemeris.earth.isVisible ? 'Above Horizon (Visible)' : 'Below Horizon (Farside)'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">EARTH AZIMUTH</div>
                    <div className="text-sm font-bold text-white">
                      {ephemeris.earth.azimuthDeg}°
                    </div>
                    <div className="text-[9px] text-cyan-400">
                      Bearing: {getCardinal(ephemeris.earth.azimuthDeg)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">EARTH PHASE FROM MOON</div>
                    <div className="text-xs font-bold text-sky-300 truncate">
                      {ephemeris.earth.earthIlluminatedPct}% Lit
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      {ephemeris.earth.earthPhaseName}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/90">
                    <div className="text-[10px] text-slate-400">COMMUNICATION LINK</div>
                    <div className="text-xs font-bold truncate flex items-center gap-1">
                      {ephemeris.earth.commStatus === 'direct-line-of-sight' ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">Direct Link OK</span>
                        </>
                      ) : ephemeris.earth.commStatus === 'horizon-marginal' ? (
                        <>
                          <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="text-amber-300">Marginal Skim</span>
                        </>
                      ) : (
                        <>
                          <Radio className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="text-rose-300">Relay Required</span>
                        </>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Angular Size: 1.9°
                    </div>
                  </div>
                </div>

                {/* Orient At Earth Action: Automatically closes popup and orients camera */}
                <button
                  type="button"
                  onClick={handleOrientAtEarth}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-md group ${
                    lastAction === 'orient-earth'
                      ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                      : 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/40 hover:border-sky-400 text-sky-300'
                  }`}
                  title="Orient 3D lunar camera towards Earth and close popup"
                >
                  <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Orient 3D Camera at Earth ({getCardinal(ephemeris.earth.azimuthDeg)})</span>
                  {lastAction === 'orient-earth' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-400 text-slate-950">
                      ✓ LAST ACTION
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Ephemeris Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-space-900/60 border border-slate-800 text-xs font-mono leading-relaxed flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-white font-bold">{siteName}:</span>{' '}
                At this moment ({activeDate.toUTCString()}), the Sun is{' '}
                <span className="text-amber-300 font-bold">
                  {ephemeris.sun.altitudeDeg >= 0 ? `${ephemeris.sun.altitudeDeg}° above` : `${Math.abs(ephemeris.sun.altitudeDeg)}° below`} the horizon
                </span>{' '}
                and the Earth is{' '}
                <span className="text-sky-300 font-bold">
                  {ephemeris.earth.altitudeDeg >= 0 ? `${ephemeris.earth.altitudeDeg}° above` : `${Math.abs(ephemeris.earth.altitudeDeg)}° below`} the horizon
                </span>.
              </div>
            </div>

            <button
              type="button"
              onClick={handleFlyoverAndObserve}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold transition-all text-xs group"
              title="Fly to surface and close popup"
            >
              <span>Fly To Surface</span>
              {lastAction === 'flyover' && (
                <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-400 text-slate-950">
                  ✓
                </span>
              )}
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800/80 bg-space-900/60 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Meeus Precision Astrodynamics Engine Active</span>
            {lastAction && (
              <span className="text-amber-400 ml-2 hidden sm:inline">
                · Last Action: {lastAction}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close Tool
          </button>
        </div>

      </div>
    </div>
  );
};
