import React, { useState } from 'react';
import { 
  Plane, 
  Play, 
  Square, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Camera
} from 'lucide-react';
import { LUNAR_FLYOVER_LANDMARKS, FlyoverWaypoint } from '../../data/flyoverLandmarks';

interface LunarFlyoverControlProps {
  onFlyToLandmark: (landmark: FlyoverWaypoint) => void;
  onStartTour: () => void;
  onStopTour: () => void;
  isTourActive: boolean;
  currentWaypointIndex: number;
  onResetOverview: () => void;
}

export const LunarFlyoverControl: React.FC<LunarFlyoverControlProps> = ({
  onFlyToLandmark,
  onStartTour,
  onStopTour,
  isTourActive,
  currentWaypointIndex,
  onResetOverview
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const activeLandmark = LUNAR_FLYOVER_LANDMARKS[currentWaypointIndex];

  return (
    <div className="rounded-2xl bg-[#0B0F19]/95 border border-[#1E293B] hover:border-indigo-500/50 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 pointer-events-auto text-xs font-mono">
      {/* Panel Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-2.5 sm:p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors select-none ${
          isExpanded ? 'border-b border-slate-800/60' : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#312E81]/70 border border-[#818CF8]/60 text-[#818CF8] flex items-center justify-center shrink-0 shadow-md shadow-indigo-950/40">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                3D Flyover & Tours
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#083344] text-[#22D3EE] border border-[#0E7490]">
                LROC 3D
              </span>
              {isTourActive && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Pitched Camera Flights & Tours
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white p-1" title={isExpanded ? "Collapse Flyovers" : "Expand Flyovers"}>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3">
          {/* Tour Play/Stop & Reset buttons */}
          <div className="flex items-center gap-2">
            {isTourActive ? (
              <button
                type="button"
                onClick={onStopTour}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-xs font-bold transition-all shadow-md shadow-rose-950/40"
                title="Stop Continuous Flyover Tour"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Tour</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartTour}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-950/50 group"
                title="Start Continuous Chain Flyover Tour"
              >
                <Play className="w-3 h-3 fill-current group-hover:scale-110 transition-transform" />
                <span>Continuous Tour</span>
              </button>
            )}

            <button
              type="button"
              onClick={onResetOverview}
              className="p-2 rounded-xl bg-space-950 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-white transition-colors"
              title="Reset camera to global overview"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Tour Waypoint Indicator Banner */}
          {isTourActive && activeLandmark && (
            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/40 text-[11px] leading-relaxed flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0" />
                <div>
                  <span className="text-purple-300 font-bold">
                    Waypoint {currentWaypointIndex + 1}/{LUNAR_FLYOVER_LANDMARKS.length}:
                  </span>{' '}
                  <span className="text-white font-semibold">{activeLandmark.name}</span>
                </div>
              </div>
              <span className="text-[10px] text-purple-300 font-mono shrink-0">
                {activeLandmark.lat >= 0 ? '+' : ''}{activeLandmark.lat.toFixed(1)}°, {activeLandmark.lng >= 0 ? '+' : ''}{activeLandmark.lng.toFixed(1)}°
              </span>
            </div>
          )}

          {/* Quick Landmark Flights Grid */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
              <span>Direct 3D Flyover Landmarks:</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Pitched
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {LUNAR_FLYOVER_LANDMARKS.map((lm, idx) => {
                const isCurrent = isTourActive && currentWaypointIndex === idx;

                return (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => {
                      if (isTourActive) onStopTour();
                      onFlyToLandmark(lm);
                    }}
                    className={`p-2 rounded-xl border text-[11px] font-mono text-left transition-all flex flex-col gap-0.5 ${
                      isCurrent
                        ? 'bg-purple-500/25 border-purple-500/60 text-purple-200 font-bold shadow-md shadow-purple-950/40'
                        : 'bg-space-950/80 border-slate-800/80 hover:border-cyan-400/60 text-slate-300 hover:text-white hover:bg-cyan-950/30'
                    }`}
                    title={`${lm.name} (${lm.tag}): ${lm.description}`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span className="truncate font-semibold">{lm.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 truncate pl-3">{lm.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
