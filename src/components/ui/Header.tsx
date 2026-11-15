import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe2, 
  Search, 
  HelpCircle, 
  Maximize2, 
  Minimize2, 
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  X
} from 'lucide-react';
import { POICategory, LunarPOI, LunarCoordinateHover } from '../../types/lunar';
import { SolarPhaseControl } from './SolarPhaseControl';

interface HeaderProps {
  activeCategory: POICategory | 'all';
  onCategoryChange: (cat: POICategory | 'all') => void;
  onOpenSearch: (initialQuery?: string) => void;
  onOpenHelp: () => void;
  onOpenTutorial?: () => void;
  totalPOICount: number;
  filteredCount: number;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  onResetView?: () => void;
  categoryCounts?: Partial<Record<POICategory | 'all', number>>;
  pois?: LunarPOI[];
  onHoverSite?: (coord: LunarCoordinateHover | null) => void;
  onSelectSite?: (poi: LunarPOI) => void;
  onCopySiteCoordinates?: (coordStr: string, siteName: string) => void;
  onBackToLanding?: () => void;
  onOpenLayers?: () => void;
  // Solar Phase & Lighting Simulator integrated header props
  sunAngle?: number;
  onSunAngleChange?: (angle: number, isUserAction?: boolean) => void;
  autoSunCycle?: boolean;
  onToggleAutoCycle?: () => void;
  enableSunShade?: boolean;
  onToggleSunShade?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onCategoryChange,
  onOpenSearch,
  onOpenHelp,
  onOpenTutorial,
  totalPOICount,
  filteredCount,
  showMarkers,
  onToggleMarkers,
  onResetView,
  categoryCounts,
  pois,
  onHoverSite,
  onSelectSite,
  onCopySiteCoordinates,
  onBackToLanding,
  onOpenLayers,
  sunAngle = 0,
  onSunAngleChange,
  autoSunCycle = false,
  onToggleAutoCycle,
  enableSunShade = true,
  onToggleSunShade
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchInputRef = useRef<HTMLInputElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onOpenSearch(headerSearchQuery.trim());
  };

  // Keyboard shortcut '/' focuses the header search bar if not currently inside an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== headerSearchInputRef.current) {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          headerSearchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 select-none">
      {/* ================= LEFT CLUSTER (Homepage + Brand Logo + Pins Toggle) ================= */}
      <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto shrink-0">
        {/* 1. Return to Homepage Pill Button (Far Left as in Figma) */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B0F19]/95 hover:bg-cyan-950/60 border border-[#1E293B] hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 text-xs font-mono transition-all shadow-lg backdrop-blur-md group"
            title="Return to Landing Page Homepage"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium text-[11.5px]">Homepage</span>
          </button>
        )}

        {/* 2. SELENE 3D Brand Logo Block */}
        <div 
          id="tutorial-brand-header"
          onClick={onResetView}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="SELENE 3D - Click to Center Moon"
        >
          {/* Glowing Rounded Square Icon */}
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0B0F19] border border-[#06B6D4] text-[#06B6D4] shadow-lg shadow-cyan-950/50 backdrop-blur-md group-hover:border-cyan-300 transition-all shrink-0">
            <Globe2 className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-white font-mono flex items-center">
                SELENE<span className="text-cyan-400 ml-1">3D</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#083344] text-[#22D3EE] border border-[#0E7490]">
                NASA/LROC ATLAS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans hidden md:block leading-none mt-0.5">
              Photographic Lunar Globe &amp; Exploration Portal
            </p>
          </div>
        </div>

        {/* 3. Pins: OFF / ON Pill Toggle Button */}
        <button
          id="tutorial-pins-toggle"
          type="button"
          onClick={onToggleMarkers}
          title={showMarkers ? "Hide Landing Site Pins" : "Show Landing Site Pins on Globe"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all shadow-lg backdrop-blur-md shrink-0 ${
            showMarkers
              ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-300 shadow-cyan-950/50'
              : 'bg-[#0B0F19]/95 border-[#1E293B] text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          {showMarkers ? (
            <>
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">Pins: <strong className="text-cyan-300">ON</strong></span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Pins: <strong className="text-slate-400">OFF</strong></span>
            </>
          )}
        </button>
      </div>

      {/* ================= CENTER CLUSTER (Quick Finder / Search Bar) ================= */}
      <div className="pointer-events-auto flex items-center justify-center flex-1 min-w-0 max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg mx-2 hidden lg:flex">
        <form 
          id="tutorial-search-bar"
          onSubmit={handleSearchSubmit}
          className="w-full min-w-0 h-9 flex items-center justify-between rounded-full bg-[#0B0F19]/90 border border-[#1E293B] focus-within:border-cyan-500/80 hover:border-cyan-500/60 shadow-xl backdrop-blur-md pl-3 pr-1.5 transition-all box-border overflow-hidden group"
          title="Search sites or navigate by latitude/longitude (Press / or Enter)"
        >
          {/* Search Icon */}
          <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0 mr-2 group-focus-within:text-cyan-300 transition-colors pointer-events-none" />

          {/* Full-width, overflow-safe Input Field */}
          <input
            ref={headerSearchInputRef}
            type="text"
            value={headerSearchQuery}
            onChange={(e) => setHeaderSearchQuery(e.target.value)}
            placeholder="Search crater, mission, or coordinate..."
            className="min-w-0 flex-1 w-full bg-transparent text-xs font-mono text-white placeholder:text-slate-400 placeholder:truncate focus:outline-none box-border leading-none"
          />

          {/* Clear Button when text entered */}
          {headerSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setHeaderSearchQuery('');
                headerSearchInputRef.current?.focus();
              }}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors shrink-0 mr-1"
              title="Clear search input"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Action Button: Find Sites */}
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#083344] hover:bg-cyan-900/80 border border-[#06B6D4]/70 hover:border-cyan-400 text-[#22D3EE] hover:text-white font-mono text-[10.5px] font-semibold transition-all shrink-0 ml-1 select-none shadow-sm cursor-pointer"
            title="Search or Browse Sites (Press /)"
          >
            <span>Find Sites</span>
            <kbd className="px-1 py-0.2 rounded bg-[#030712] border border-[#0E7490] text-[9px] text-cyan-300 font-mono ml-0.5">
              /
            </kbd>
          </button>
        </form>
      </div>

      {/* ================= RIGHT CLUSTER (Solar Phase Widget + Tutorial + Help + Fullscreen) ================= */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile/Tablet Search Button fallback */}
        <button
          type="button"
          onClick={() => onOpenSearch(headerSearchQuery.trim())}
          title="Search sites (Press /)"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full bg-[#0B0F19] border border-[#1E293B] hover:border-cyan-500/50 text-cyan-400"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Integrated Solar Phase & Lighting Widget (Figma Header Widget) */}
        {onSunAngleChange && onToggleAutoCycle && onToggleSunShade && (
          <div id="tutorial-solar-phase" className="flex items-center">
            <SolarPhaseControl
              variant="inline"
              sunAngle={sunAngle}
              onSunAngleChange={onSunAngleChange}
              autoCycle={autoSunCycle}
              onToggleAutoCycle={onToggleAutoCycle}
              enableSunShade={enableSunShade}
              onToggleSunShade={onToggleSunShade}
            />
          </div>
        )}

        {/* Website Tutorial / Guided User Tour Access Button */}
        {onOpenTutorial && (
          <button
            id="tutorial-start-btn"
            type="button"
            onClick={onOpenTutorial}
            title="Start Interactive Website Tutorial / Guided Tour"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#083344] hover:bg-cyan-900/80 border border-[#06B6D4] hover:border-cyan-300 text-cyan-200 hover:text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-950/40 backdrop-blur-md transition-all group shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline text-[11px] font-mono">Website Tutorial</span>
            <span className="sm:hidden text-[11px] font-mono">Tutorial</span>
          </button>
        )}

        {/* Navigation & Help Guide */}
        <button
          type="button"
          onClick={onOpenHelp}
          title="Navigation & Atlas Guide (Press ?)"
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0B0F19] border border-[#1E293B] hover:border-slate-700 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-lg shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0B0F19] border border-[#1E293B] hover:border-slate-700 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-lg shrink-0"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
