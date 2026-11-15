import React from 'react';
import { Compass, Sun, Globe, Eye, Plane, X, RotateCcw, ChevronRight } from 'lucide-react';
import { HorizonActionType } from '../../utils/horizonStatePersistence';

export interface ActiveHorizonState {
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
}

interface HorizonObserverActiveHUDProps {
  state: ActiveHorizonState | null;
  onReopenModal: () => void;
  onOrientSun: () => void;
  onOrientEarth: () => void;
  onExit: () => void;
}

export const HorizonObserverActiveHUD: React.FC<HorizonObserverActiveHUDProps> = ({
  state,
  onReopenModal,
  onOrientSun,
  onOrientEarth,
  onExit
}) => {
  if (!state || !state.action) return null;

  const isSun = state.action === 'orient-sun';
  const isEarth = state.action === 'orient-earth';
  const isFlyover = state.action === 'flyover';

  return (
    <aside
      aria-label="Active Horizon Observation HUD"
      className="fixed bottom-14 sm:bottom-16 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto animate-fadeIn max-w-[94vw] sm:max-w-2xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl bg-space-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-xl text-xs font-mono text-slate-100">
        {/* Left: Active Mode & Site Readout */}
        <div 
          onClick={onReopenModal}
          className="flex items-center gap-2 cursor-pointer hover:text-amber-300 transition-colors group"
          title="Click to reopen Horizon & Ephemeris Observer Tool"
        >
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
            {isFlyover && <Plane className="w-3.5 h-3.5" />}
            {isSun && <Sun className="w-3.5 h-3.5 animate-spin-slow" />}
            {isEarth && <Globe className="w-3.5 h-3.5" />}
          </div>

          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {isFlyover ? 'HORIZON FLYOVER' : isSun ? 'SUN ORIENTATION' : 'EARTH ORIENTATION'}
              </span>
              <span className="text-slate-500 hidden sm:inline">·</span>
              <span className="text-slate-300 font-normal truncate hidden sm:inline">{state.siteName}</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2">
              <span className="text-amber-300 font-semibold">
                Sun: {state.sunAlt >= 0 ? `+${state.sunAlt.toFixed(1)}°` : `${state.sunAlt.toFixed(1)}°`}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-sky-300 font-semibold">
                Earth: {state.earthAlt >= 0 ? `+${state.earthAlt.toFixed(1)}°` : `${state.earthAlt.toFixed(1)}°`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Quick Orient to Sun */}
          <button
            type="button"
            onClick={onOrientSun}
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
              isSun
                ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                : 'bg-space-950/70 border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300'
            }`}
            title="Orient 3D Camera at Sun"
          >
            <Sun className="w-3 h-3 text-amber-400" />
            <span className="hidden xs:inline">Sun</span>
          </button>

          {/* Quick Orient to Earth */}
          <button
            type="button"
            onClick={onOrientEarth}
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
              isEarth
                ? 'bg-sky-500/30 text-sky-200 border-sky-400'
                : 'bg-space-950/70 border-slate-700 hover:border-sky-500/50 text-slate-300 hover:text-sky-300'
            }`}
            title="Orient 3D Camera at Earth"
          >
            <Globe className="w-3 h-3 text-sky-400" />
            <span className="hidden xs:inline">Earth</span>
          </button>

          {/* Reopen Tool */}
          <button
            type="button"
            onClick={onReopenModal}
            className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-[10px] font-bold transition-all flex items-center gap-1"
            title="Open Full Ephemeris & Horizon Tool"
          >
            <Compass className="w-3 h-3" />
            <span className="hidden sm:inline">Tool</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Exit / Clear */}
          <button
            type="button"
            onClick={onExit}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/40 transition-colors"
            title="Exit Horizon Observation Mode (Clear Markers)"
            aria-label="Exit Horizon Observation Mode"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
