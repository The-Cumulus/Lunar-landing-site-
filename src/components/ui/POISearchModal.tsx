import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  ArrowRight, 
  Crosshair, 
  Compass, 
  MapPin, 
  Mountain, 
  TrendingUp, 
  Globe2, 
  Navigation,
  Sparkles,
  Layers
} from 'lucide-react';
import { LunarPOI } from '../../types/lunar';
import { 
  formatCoordinatesDecimal, 
  formatCoordinatesDMS, 
  parseCoordinatesString, 
  calculateLunarDistanceKm 
} from '../../utils/coordinates';
import { LunarDEMService } from '../../utils/demAnalysis';
import { LUNAR_LANDMARKS } from '../../data/lunarPOIs';

interface POISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pois: LunarPOI[];
  onSelectPOI: (poi: LunarPOI) => void;
  onNavigateCoordinate?: (lat: number, lng: number, customPOI?: LunarPOI) => void;
}

// Popular lunar coordinate presets for fast exploration
const COORDINATE_PRESETS = [
  { name: 'Apollo 11', lat: 0.6740, lng: 23.4730, label: 'Mare Tranquillitatis' },
  { name: 'Chandrayaan-3', lat: -69.3730, lng: 32.3190, label: 'Shiv Shakti Point' },
  { name: 'Artemis III Candidate', lat: -89.9000, lng: 0.0000, label: 'Connecting Ridge' },
  { name: 'Shackleton Crater', lat: -89.6700, lng: 129.7800, label: 'South Polar Rim' },
  { name: 'Chang\'e 4 (Far Side)', lat: -45.4500, lng: 177.6000, label: 'Von Kármán Basin' },
  { name: 'Tycho Crater Peak', lat: -43.3100, lng: -11.2000, label: 'Central Uplift' },
  { name: 'Lunar South Pole', lat: -90.0000, lng: 0.0000, label: 'South Pole Geodetic Datum' },
  { name: 'Lunar North Pole', lat: 90.0000, lng: 0.0000, label: 'Peary Crater Region' },
  { name: 'Prime Meridian Equator', lat: 0.0000, lng: 0.0000, label: 'Sinus Medii (Center Face)' }
];

export const POISearchModal: React.FC<POISearchModalProps> = ({
  isOpen,
  onClose,
  pois,
  onSelectPOI,
  onNavigateCoordinate
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'coordinate'>('search');
  const [searchTerm, setSearchTerm] = useState('');

  // Coordinate Tool state
  const [latInput, setLatInput] = useState<string>('0.0000');
  const [lngInput, setLngInput] = useState<string>('0.0000');
  const [pasteString, setPasteString] = useState<string>('');
  const [coordError, setCoordError] = useState<string | null>(null);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '/' && !isOpen) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset tab on open
  useEffect(() => {
    if (isOpen) {
      setCoordError(null);
    }
  }, [isOpen]);

  // Parse numeric values from lat/lng inputs safely
  const parsedLat = useMemo(() => {
    const val = parseFloat(latInput);
    return isNaN(val) ? 0 : Math.max(-90, Math.min(90, val));
  }, [latInput]);

  const parsedLng = useMemo(() => {
    const val = parseFloat(lngInput);
    return isNaN(val) ? 0 : Math.max(-180, Math.min(180, val));
  }, [lngInput]);

  // Real-time LOLA Geodetic analysis for the selected coordinate
  const coordinateAnalysis = useMemo(() => {
    return LunarDEMService.getInstance().getPointAnalysis(parsedLat, parsedLng);
  }, [parsedLat, parsedLng]);

  // Find nearest known POI & Landmark for current coordinate
  const nearestInfo = useMemo(() => {
    let nearestPOI: LunarPOI | null = null;
    let minPOIDist = 99999;
    for (const p of pois) {
      const dist = calculateLunarDistanceKm(parsedLat, parsedLng, p.lat, p.lng);
      if (dist < minPOIDist) {
        minPOIDist = dist;
        nearestPOI = p;
      }
    }

    let nearestLandmark = 'Lunar Highland Regolith';
    let minLandmarkDist = 99999;
    for (const lm of LUNAR_LANDMARKS) {
      const dist = calculateLunarDistanceKm(parsedLat, parsedLng, lm.lat, lm.lng);
      if (dist < minLandmarkDist) {
        minLandmarkDist = dist;
        nearestLandmark = lm.name;
      }
    }

    return {
      nearestPOI,
      minPOIDist,
      nearestLandmark,
      minLandmarkDist
    };
  }, [parsedLat, parsedLng, pois]);

  // Check if search bar input contains coordinates
  const detectedCoordinatesFromSearch = useMemo(() => {
    if (!searchTerm.trim()) return null;
    return parseCoordinatesString(searchTerm);
  }, [searchTerm]);

  if (!isOpen) return null;

  // Build or find appropriate POI representation for custom coordinates
  const createPOIForCoordinate = (lat: number, lng: number): LunarPOI => {
    // If within 10 km of an existing catalog POI, use that catalog POI
    if (nearestInfo.nearestPOI && nearestInfo.minPOIDist <= 10) {
      return nearestInfo.nearestPOI;
    }

    const elev = coordinateAnalysis?.elevationMeters ?? 0;
    const slope = coordinateAnalysis?.slopeDeg ?? 0;
    const terrainClass = coordinateAnalysis?.elevationCategoryName ?? 'Regolith';
    const isNearside = Math.abs(lng) <= 90;
    const isNorth = lat >= 0;

    return {
      id: `coord-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: `Target (${formatCoordinatesDecimal(lat, lng)})`,
      subTitle: `Geodetic Point: ${formatCoordinatesDMS(lat, lng)}`,
      category: 'geological',
      lat,
      lng,
      elevationMeters: elev,
      agency: 'Coordinate Navigator Tool',
      country: isNearside ? 'Lunar Nearside' : 'Lunar Far Side',
      accentColor: '#38bdf8',
      description: `Target coordinate located at latitude ${lat.toFixed(4)}°, longitude ${lng.toFixed(4)}° (${isNearside ? 'Nearside' : 'Far Side'}, ${isNorth ? 'Northern' : 'Southern'} Hemisphere). LOLA surface elevation is ${elev > 0 ? `+${elev.toLocaleString()}` : elev.toLocaleString()} m above lunar datum.`,
      historicalSignificance: `Targeted coordinate exploration via SELENE 3D Coordinate Search Tool. Closest named lunar feature is ${nearestInfo.nearestLandmark} (${nearestInfo.minLandmarkDist} km away).`,
      keyScientificGoals: [
        `Geodetic Location: ${formatCoordinatesDMS(lat, lng)}`,
        `LOLA Hypsometric Elevation: ${elev > 0 ? `+${elev.toLocaleString()}` : elev.toLocaleString()} meters`,
        `Surface Gradient Slope: ${slope.toFixed(1)}°`,
        `Terrain Morphology Class: ${terrainClass}`
      ],
      surfaceFeatures: `Terrain slope measured at ${slope.toFixed(1)}° with surface roughness ${coordinateAnalysis?.roughnessM?.toFixed(1) ?? '--'} m. Region categorized under ${terrainClass}.`
    };
  };

  // Execute navigation to coordinate
  const handleNavigateToCoords = (lat: number, lng: number) => {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setCoordError('Coordinates out of range. Latitude must be -90° to +90°, Longitude -180° to +180°.');
      return;
    }

    const targetPOI = createPOIForCoordinate(lat, lng);

    if (onNavigateCoordinate) {
      onNavigateCoordinate(lat, lng, targetPOI);
    } else {
      onSelectPOI(targetPOI);
    }
    onClose();
  };

  // Handle Quick Paste Parse
  const handlePasteChange = (val: string) => {
    setPasteString(val);
    setCoordError(null);
    if (!val.trim()) return;

    const parsed = parseCoordinatesString(val);
    if (parsed) {
      setLatInput(parsed.lat.toString());
      setLngInput(parsed.lng.toString());
    } else {
      setCoordError('Could not recognize format. Try: "-89.5, 45.2" or "0°40\'N, 23°28\'E"');
    }
  };

  // Apply a preset coordinate
  const applyPreset = (preset: typeof COORDINATE_PRESETS[0]) => {
    setLatInput(preset.lat.toFixed(4));
    setLngInput(preset.lng.toFixed(4));
    setPasteString('');
    setCoordError(null);
  };

  // Flip signs
  const toggleLatHemisphere = () => {
    setLatInput(prev => (-parseFloat(prev || '0')).toFixed(4));
  };

  const toggleLngHemisphere = () => {
    setLngInput(prev => (-parseFloat(prev || '0')).toFixed(4));
  };

  const query = searchTerm.toLowerCase().trim();
  const results = pois.filter(poi => {
    if (!query) return true;
    const matchName = poi.name.toLowerCase().includes(query);
    const matchSubtitle = poi.subTitle?.toLowerCase().includes(query) ?? false;
    const matchAgency = poi.agency.toLowerCase().includes(query);
    const matchCountry = poi.country.toLowerCase().includes(query);
    const matchDescription = poi.description.toLowerCase().includes(query);
    const matchCrew = poi.crew?.some(c => c.toLowerCase().includes(query)) ?? false;
    return matchName || matchSubtitle || matchAgency || matchCountry || matchDescription || matchCrew;
  });

  const isNearside = Math.abs(parsedLng) <= 90;
  const isNorthern = parsedLat >= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-2xl bg-space-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-space-950/70 p-2 sm:p-2.5 gap-2">
          <div className="flex items-center gap-1.5 flex-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-semibold transition-all ${
                activeTab === 'search'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search Sites & Missions</span>
            </button>

            <button
              onClick={() => setActiveTab('coordinate')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-semibold transition-all ${
                activeTab === 'coordinate'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Coordinate Tool</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 hidden sm:inline">
                LAT/LON
              </span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-mono transition-colors shrink-0"
            title="Close (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= TAB 1: CATALOG SEARCH ================= */}
        {activeTab === 'search' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Search Input Box */}
            <div className="p-3.5 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-cyan-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search missions, craters, astronauts, or enter lat/lon coordinates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="px-2 py-1 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
              >
                ESC
              </button>
            </div>

            {/* If Coordinates are detected in search query, highlight instant action */}
            {detectedCoordinatesFromSearch && (
              <div className="p-3 bg-cyan-950/40 border-b border-cyan-700/40 flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold font-mono text-white flex items-center gap-1.5 truncate">
                      <span>Coordinates Detected:</span>
                      <span className="text-cyan-300">
                        {formatCoordinatesDecimal(detectedCoordinatesFromSearch.lat, detectedCoordinatesFromSearch.lng)}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      {formatCoordinatesDMS(detectedCoordinatesFromSearch.lat, detectedCoordinatesFromSearch.lng)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleNavigateToCoords(detectedCoordinatesFromSearch.lat, detectedCoordinatesFromSearch.lng)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-space-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Locate Here</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 pointer-events-auto">
              {results.length === 0 && !detectedCoordinatesFromSearch ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs space-y-2">
                  <p>No lunar sites found matching "{searchTerm}"</p>
                  <button
                    onClick={() => setActiveTab('coordinate')}
                    className="text-cyan-400 hover:underline text-xs"
                  >
                    Switch to Coordinate Tool to search by Latitude & Longitude &rarr;
                  </button>
                </div>
              ) : (
                results.map(poi => (
                  <div
                    key={poi.id}
                    onClick={() => {
                      onSelectPOI(poi);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-space-950/60 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-cyan-950/20 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: poi.accentColor }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">
                            {poi.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {poi.agency}
                          </span>
                        </div>
                        {poi.subTitle && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                            {poi.subTitle}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 mt-1 flex-wrap">
                          <span>Lat: {poi.lat.toFixed(3)}°</span>
                          <span>Lng: {poi.lng.toFixed(3)}°</span>
                          <span>Elev: {poi.elevationMeters.toLocaleString()}m</span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: COORDINATE SEARCH TOOL ================= */}
        {activeTab === 'coordinate' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs pointer-events-auto">
            {/* Tool Header banner */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-space-950/70 border border-cyan-800/40">
              <Compass className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Lunar Latitude & Longitude Search Tool
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Input lunar coordinates to inspect real LOLA elevation, surface slope, and fly the 3D globe camera directly to any target on the Moon.
                </p>
              </div>
            </div>

            {/* Quick String Paste / Parser Bar */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                <span>Quick Coordinate Input / Paste:</span>
                <span className="text-cyan-400 font-normal">Decimal or DMS</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder='e.g., -89.5, 45.2  or  0°40&apos;26" N, 23°28&apos;22" E  or  89.5° S, 0° E'
                  value={pasteString}
                  onChange={(e) => handlePasteChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-space-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
                {pasteString && (
                  <button
                    onClick={() => {
                      setPasteString('');
                      setCoordError(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {coordError && (
                <p className="text-[10px] text-rose-400 mt-1">{coordError}</p>
              )}
            </div>

            {/* Interactive Latitude & Longitude Input Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Latitude Input Card */}
              <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    Lunar Latitude
                  </span>
                  <span className="text-[9px] text-slate-500">-90° to +90°</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    value={latInput}
                    onChange={(e) => {
                      setLatInput(e.target.value);
                      setCoordError(null);
                    }}
                    className="flex-1 bg-space-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={toggleLatHemisphere}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 transition-all shrink-0"
                    title="Toggle North (+) / South (-)"
                  >
                    {parsedLat >= 0 ? 'N (+)' : 'S (-)'}
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>DMS:</span>
                  <span className="font-semibold text-slate-200">
                    {formatCoordinatesDMS(parsedLat, 0).split(',')[0]}
                  </span>
                </div>
              </div>

              {/* Longitude Input Card */}
              <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    Lunar Longitude
                  </span>
                  <span className="text-[9px] text-slate-500">-180° to +180°</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    value={lngInput}
                    onChange={(e) => {
                      setLngInput(e.target.value);
                      setCoordError(null);
                    }}
                    className="flex-1 bg-space-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={toggleLngHemisphere}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition-all shrink-0"
                    title="Toggle East (+) / West (-)"
                  >
                    {parsedLng >= 0 ? 'E (+)' : 'W (-)'}
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>DMS:</span>
                  <span className="font-semibold text-slate-200">
                    {formatCoordinatesDMS(0, parsedLng).split(',')[1]?.trim() || '0°00\'00" E'}
                  </span>
                </div>
              </div>
            </div>

            {/* Real LOLA Telemetry Live Preview Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/30 to-space-950/80 border border-cyan-800/40 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800/60 pb-1.5">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Mountain className="w-3.5 h-3.5" />
                  Live LOLA Telemetry at Target
                </span>
                <span className="text-slate-300 font-semibold">
                  {formatCoordinatesDecimal(parsedLat, parsedLng)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-space-950/70 border border-slate-800/70">
                  <div className="text-[9px] text-slate-400 uppercase">Elevation</div>
                  <div className="text-xs font-bold text-cyan-300 mt-0.5">
                    {coordinateAnalysis?.elevationMeters !== undefined
                      ? (coordinateAnalysis.elevationMeters > 0
                        ? `+${coordinateAnalysis.elevationMeters.toLocaleString()} m`
                        : `${coordinateAnalysis.elevationMeters.toLocaleString()} m`)
                      : '-- m'}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-space-950/70 border border-slate-800/70">
                  <div className="text-[9px] text-slate-400 uppercase">Slope</div>
                  <div className="text-xs font-bold text-amber-300 mt-0.5">
                    {coordinateAnalysis?.slopeDeg !== undefined
                      ? `${coordinateAnalysis.slopeDeg}°`
                      : '--°'}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-space-950/70 border border-slate-800/70">
                  <div className="text-[9px] text-slate-400 uppercase">Terrain</div>
                  <div className="text-xs font-bold text-emerald-300 mt-0.5 truncate" title={coordinateAnalysis?.elevationCategoryName}>
                    {coordinateAnalysis?.elevationCategoryName || 'Regolith'}
                  </div>
                </div>
              </div>

              {/* Nearest Feature & Hemisphere Info */}
              <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Nearest Landmark:</span>
                  <span className="font-semibold text-slate-100">
                    {nearestInfo.nearestLandmark}
                  </span>
                  <span className="text-slate-500">
                    ({nearestInfo.minLandmarkDist} km)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[9px]">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {isNearside ? 'Nearside' : 'Far Side'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {isNorthern ? 'North' : 'South'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Preset Coordinates */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Quick Lunar Presets:
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COORDINATE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-1 rounded-lg bg-space-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-[10px] flex items-center gap-1"
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleNavigateToCoords(parsedLat, parsedLng)}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-space-950 font-bold font-mono text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-950/40 hover:shadow-cyan-500/20 active:scale-[0.99]"
              >
                <MapPin className="w-4 h-4 fill-current" />
                <span>Locate & Plant Pin on Lunar Surface</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};