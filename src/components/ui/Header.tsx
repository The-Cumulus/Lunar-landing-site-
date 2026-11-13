import React, { useState } from 'react';
import { 
  Globe2, 
  Search, 
  HelpCircle, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Rocket, 
  RotateCcw,
  Eye,
  EyeOff,
  Satellite,
  ChevronDown,
  MapPin,
  ArrowLeft,
  Home
} from 'lucide-react';
import { POICategory, LunarPOI, LunarCoordinateHover } from '../../types/lunar';
import { LunarDEMService } from '../../utils/demAnalysis';

// NASA Artemis Program stylized launch trajectory logo
const ArtemisIcon: React.FC<{ className?: string }> = ({ className = "w-3 h-3 text-emerald-400" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Stylized Artemis 'A' trajectory pointing to lunar South Pole */}
    <path d="M12 2L4 21h3.5l4.5-11 4.5 11H20L12 2z" fill="currentColor" fillOpacity="0.25" />
    <path d="M7.5 15.5c2.8-1.5 6.2-1.5 9 0" />
    <circle cx="12" cy="7" r="1.2" fill="currentColor" />
  </svg>
);

// Lunar Impact Crater logo (terraced rim, shadowed floor & central peak)
const CraterIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5 text-purple-400" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Outer crater terraced rim */}
    <ellipse cx="12" cy="12" rx="9.5" ry="6.5" />
    {/* Sunken shadowed crater floor */}
    <ellipse cx="12" cy="12.5" rx="5.5" ry="3.5" fill="currentColor" fillOpacity="0.25" />
    {/* Central rebound uplift peak */}
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

interface HeaderProps {
  activeCategory: POICategory | 'all';
  onCategoryChange: (cat: POICategory | 'all') => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  totalPOICount: number;
  filteredCount: number;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  onResetView?: () => void;
  categoryCounts?: Partial<Record<POICategory | 'all', number>>;
  pois?: LunarPOI[];
  onHoverSite?: (coord: LunarCoordinateHover | null) => void;
  onSelectSite?: (poi: LunarPOI) => void;
  onBackToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onCategoryChange,
  onOpenSearch,
  onOpenHelp,
  totalPOICount,
  filteredCount,
  showMarkers,
  onToggleMarkers,
  onResetView,
  categoryCounts,
  pois,
  onHoverSite,
  onSelectSite,
  onBackToLanding
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<POICategory | 'all' | null>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Helper to find representative POI for a category
  const getCategoryRepresentativePOI = (catId: POICategory | 'all'): LunarPOI | null => {
    if (!pois || catId === 'all') return null;
    if (catId === 'chandrayaan') {
      return pois.find(p => p.category === 'chandrayaan') || null;
    }
    if (catId === 'apollo') {
      return pois.find(p => p.id === 'apollo-11') || pois.find(p => p.category === 'apollo') || null;
    }
    if (catId === 'artemis') {
      return pois.find(p => p.id === 'artemis-3-candidate') || pois.find(p => p.category === 'artemis') || null;
    }
    if (catId === 'change') {
      return pois.find(p => p.category === 'change') || null;
    }
    if (catId === 'geological') {
      return pois.find(p => p.id === 'shackleton-crater') || pois.find(p => p.category === 'geological') || null;
    }
    return null;
  };

  const dispatchHoverTelemetry = (poi: LunarPOI | null) => {
    if (!onHoverSite) return;
    if (!poi) {
      onHoverSite(null);
      return;
    }
    const analysis = LunarDEMService.getInstance().getPointAnalysis(poi.lat, poi.lng);
    onHoverSite({
      lat: poi.lat,
      lng: poi.lng,
      elevationMeters: poi.elevationMeters ?? analysis?.elevationMeters,
      elevationApprox: poi.elevationMeters ?? analysis?.elevationMeters,
      slopeDeg: analysis?.slopeDeg ?? 0,
      roughnessM: analysis?.roughnessM ?? 0,
      terrainClass: analysis?.elevationCategoryName || 'Lunar Surface',
      siteName: poi.name
    });
  };

  const handleCategoryMouseEnter = (catId: POICategory | 'all') => {
    setHoveredCategory(catId);
    const rep = getCategoryRepresentativePOI(catId);
    if (rep) {
      dispatchHoverTelemetry(rep);
    }
  };

  const handleCategoryMouseLeave = () => {
    setHoveredCategory(null);
    dispatchHoverTelemetry(null);
  };

  const categories: { id: POICategory | 'all'; label: string; count?: number }[] = [
    { id: 'all', label: 'All Sites', count: categoryCounts?.all ?? totalPOICount },
    { id: 'apollo', label: 'Apollo (NASA)', count: categoryCounts?.apollo },
    { id: 'chandrayaan', label: 'Chandrayaan-3 (ISRO)', count: categoryCounts?.chandrayaan },
    { id: 'artemis', label: 'Artemis III (South Pole)', count: categoryCounts?.artemis },
    { id: 'change', label: 'Chang\'e (CNSA)', count: categoryCounts?.change },
    { id: 'geological', label: 'Landmarks & Craters', count: categoryCounts?.geological }
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
      {/* Brand Title and Status */}
      <div className="flex items-center gap-3 pointer-events-auto shrink-0">
        <div 
          onClick={onResetView}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-space-900/90 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/40 backdrop-blur-md cursor-pointer hover:border-cyan-400 transition-colors"
          title="Click to Center Moon"
        >
          <Globe2 className="w-5 h-5 animate-pulse-subtle" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-wider text-slate-100 font-mono flex items-center gap-1.5">
              SELENE<span className="text-cyan-400">3D</span>
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
              NASA/LROC ATLAS
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Photographic Lunar Globe & Exploration Portal
          </p>
        </div>

        {/* Back to Landing Page button */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-space-900/90 hover:bg-cyan-950/70 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-all ml-1 shadow-md group"
            title="Return to Landing Page Homepage"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Homepage</span>
          </button>
        )}
      </div>

      {/* Category Filter Pills (Center/Top) */}
      <div 
        className="pointer-events-auto flex items-center gap-1 overflow-x-auto scrollbar-none py-1 px-1.5 rounded-xl bg-space-900/80 border border-slate-800/80 backdrop-blur-md min-w-0 max-w-full shadow-xl"
        onMouseLeave={handleCategoryMouseLeave}
      >
        {categories.map(cat => {
          const matchingSites = pois?.filter(p => cat.id !== 'all' && p.category === cat.id) || [];
          const isDropdownOpen = hoveredCategory === cat.id && matchingSites.length > 1;

          return (
            <div 
              key={cat.id} 
              className="relative"
              onMouseEnter={() => handleCategoryMouseEnter(cat.id)}
            >
              <button
                onClick={() => onCategoryChange(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {cat.id === 'all' && <Globe2 className="w-3 h-3 text-cyan-400" />}
                {cat.id === 'apollo' && <Rocket className="w-3 h-3 text-cyan-400" />}
                {cat.id === 'chandrayaan' && <Compass className="w-3 h-3 text-orange-400" />}
                {cat.id === 'artemis' && <ArtemisIcon className="w-3 h-3 text-emerald-400" />}
                {cat.id === 'change' && <Satellite className="w-3 h-3 text-rose-400" />}
                {cat.id === 'geological' && <CraterIcon className="w-3.5 h-3.5 text-purple-400" />}
                <span>{cat.label}{cat.count !== undefined ? ` (${cat.count})` : ''}</span>
              </button>

              {/* Hover Dropdown of Sites in this Category */}
              {isDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-1 py-1 px-1 min-w-[210px] max-h-64 overflow-y-auto rounded-xl bg-space-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn font-mono text-xs"
                >
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800/60 mb-1 flex items-center justify-between">
                    <span>{cat.label}</span>
                    <span className="text-cyan-400 font-normal">Hover for Lat/Lng</span>
                  </div>
                  {matchingSites.map(site => (
                    <div
                      key={site.id}
                      onMouseEnter={() => dispatchHoverTelemetry(site)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSite?.(site);
                      }}
                      className="px-2 py-1.5 rounded-lg hover:bg-cyan-950/40 hover:text-cyan-300 text-slate-300 cursor-pointer flex items-center justify-between gap-2 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div 
                          className="w-1.5 h-1.5 rounded-full shrink-0" 
                          style={{ backgroundColor: site.accentColor }} 
                        />
                        <span className="truncate">{site.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 shrink-0 font-mono">
                        {site.lat >= 0 ? `+${site.lat.toFixed(1)}°` : `${site.lat.toFixed(1)}°`}, {site.lng >= 0 ? `+${site.lng.toFixed(1)}°` : `${site.lng.toFixed(1)}°`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Utilities (Find Sites, Pins Toggle, Center Moon, Help, Fullscreen) */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto shrink-0">
        {/* User Option: Toggle Landing Site Pins on/off */}
        <button
          onClick={onToggleMarkers}
          title={showMarkers ? "Hide Landing Site Pins" : "Show Landing Site Pins on Globe"}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border font-mono text-xs transition-all shadow-lg backdrop-blur-md shrink-0 ${
            showMarkers
              ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300 shadow-cyan-950/50'
              : 'bg-space-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          {showMarkers ? (
            <>
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pins: <strong className="text-cyan-300">ON</strong></span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Pins: <strong className="text-slate-400">OFF</strong></span>
            </>
          )}
        </button>

        {/* Find Sites & Coordinate Navigator Tool Bar Button */}
        <button
          onClick={onOpenSearch}
          title="Search sites or navigate by latitude/longitude (Press / or click)"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 hover:text-white backdrop-blur-md transition-all text-xs font-mono shadow-lg shadow-cyan-950/40 shrink-0 font-semibold"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="inline whitespace-nowrap">Find Sites</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-space-950 border border-cyan-700/60 text-[10px] text-cyan-300 font-mono">
            /
          </kbd>
        </button>

        {/* Re-center Camera Button */}
        {onResetView && (
          <button
            onClick={onResetView}
            title="Re-center Moon in Viewport (Press C)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-space-900/80 border border-slate-800/80 hover:border-cyan-500/40 text-slate-300 hover:text-white backdrop-blur-md transition-all text-xs font-mono shadow-lg shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Center Moon</span>
          </button>
        )}

        <button
          onClick={onOpenHelp}
          title="Navigation & Atlas Guide"
          className="p-2 rounded-xl bg-space-900/80 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-lg shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2 rounded-xl bg-space-900/80 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-lg shrink-0"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
