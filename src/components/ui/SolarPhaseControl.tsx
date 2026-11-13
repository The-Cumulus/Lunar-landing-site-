import React, { useState } from 'react';
import { 
  Sun, 
  SunMedium,
  Moon,
  Play, 
  Pause, 
  Compass, 
  ChevronDown, 
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface SolarPhaseControlProps {
  className?: string;
  sunAngle: number;
  onSunAngleChange: (angle: number, isUserAction?: boolean) => void;
  autoCycle: boolean;
  onToggleAutoCycle: () => void;
  enableSunShade: boolean;
  onToggleSunShade: () => void;
}

export const SolarPhaseControl: React.FC<SolarPhaseControlProps> = ({
  className,
  sunAngle,
  onSunAngleChange,
  autoCycle,
  onToggleAutoCycle,
  enableSunShade,
  onToggleSunShade
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate near-side illumination percentage from Earth's viewpoint (assuming Earth at +Z)
  // When sunAngle is 0° (or 360°), Sun is in +Z direction -> 100% full moon
  // When sunAngle is 180°, Sun is in -Z direction -> 0% new moon
  const rad = (sunAngle * Math.PI) / 180;
  // Nearside facing +Z
  const illuminationFraction = Math.max(0, Math.min(1, (1 + Math.cos(rad)) / 2));
  const illuminationPercent = Math.round(illuminationFraction * 100);

  // Determine standard lunar phase name
  const getPhaseName = (angle: number): string => {
    const a = (angle % 360 + 360) % 360;
    if (a >= 355 || a < 5) return 'Full Moon (Nearside Lit)';
    if (a >= 5 && a < 85) return 'Waning Gibbous';
    if (a >= 85 && a < 95) return 'Last / Third Quarter';
    if (a >= 95 && a < 175) return 'Waning Crescent';
    if (a >= 175 && a < 185) return 'New Moon (Farside Lit)';
    if (a >= 185 && a < 265) return 'Waxing Crescent';
    if (a >= 265 && a < 275) return 'First Quarter';
    return 'Waxing Gibbous';
  };

  const presets = [
    { label: 'Full Moon', angle: 0 },
    { label: 'Last Quarter', angle: 90 },
    { label: 'New Moon', angle: 180 },
    { label: 'First Quarter', angle: 270 },
  ];

  return (
    <div className={className || "absolute top-16 sm:top-20 right-3 sm:right-4 z-20 w-72 sm:w-80"}>
      <div className="rounded-2xl bg-space-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* Header Bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3.5 flex items-center justify-between cursor-pointer border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-600/50 text-amber-400">
              <Sun className={`w-4 h-4 ${autoCycle ? 'animate-spin-slow text-amber-300' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                  Solar Phase & Lighting
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {getPhaseName(sunAngle)} ({illuminationPercent}%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Quick Solar Shade Toggle Key */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSunShade();
              }}
              title={
                enableSunShade
                  ? "Turn Solar Shade OFF (Full Surface Illumination - Press S)"
                  : "Turn Solar Shade ON (Realistic Terminator Shadows - Press S)"
              }
              className={`px-2 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                enableSunShade
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20 hover:bg-amber-500/30'
                  : 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-sm shadow-cyan-500/30 hover:bg-cyan-500/35'
              }`}
            >
              {enableSunShade ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px]">Shade ON</span>
                </>
              ) : (
                <>
                  <SunMedium className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="text-[10px]">Shade OFF</span>
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleAutoCycle();
              }}
              title={autoCycle ? "Pause Solar Cycle" : "Simulate Real-time Solar Cycle"}
              className={`p-1.5 rounded-lg border transition-all ${
                autoCycle 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/30 animate-pulse' 
                  : 'bg-space-950/50 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {autoCycle ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button className="text-slate-400 hover:text-white p-1">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Controls */}
        {isExpanded && (
          <div className="p-3.5 space-y-3.5">
            {/* Interactive Toggle Switch Card for Solar Shade */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-950/70 border border-slate-800/90 shadow-inner">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg border ${
                    enableSunShade
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                      : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                  }`}
                >
                  {enableSunShade ? <Moon className="w-4 h-4" /> : <SunMedium className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>Solar Shadow Shade</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Key S
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {enableSunShade ? 'Directional terminator shadows' : 'Uniform 360° full illumination'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleSunShade}
                title="Toggle Solar Shade (Press S)"
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enableSunShade ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    enableSunShade ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Real-time Solar Cycle Simulator Status Row */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-950/70 border border-slate-800/80 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${autoCycle ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
                <span className="text-slate-300">
                  Simulation:{' '}
                  <strong className={autoCycle ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                    {autoCycle ? 'RUNNING (~8°/s)' : 'PAUSED'}
                  </strong>
                </span>
              </div>
              <button
                onClick={onToggleAutoCycle}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  autoCycle
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 shadow-sm shadow-amber-500/20'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30'
                }`}
              >
                {autoCycle ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{autoCycle ? 'Pause' : 'Play Cycle'}</span>
              </button>
            </div>

            {/* Slider with Angle and Illumination */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  Sun Azimuth
                </span>
                <span className="text-amber-300 font-bold">
                  {Math.round(sunAngle)}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={Math.round(sunAngle)}
                onChange={(e) => onSunAngleChange(Number(e.target.value), true)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>0° (Nearside)</span>
                <span>90°</span>
                <span>180° (Farside)</span>
                <span>270°</span>
                <span>360°</span>
              </div>
            </div>

            {/* Quick Phase Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Lunar Phase Presets
                </label>
                {autoCycle && (
                  <span className="text-[9px] font-mono text-amber-400/90 animate-pulse">
                    Instant Jump Active
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {presets.map(p => {
                  const diff = Math.abs((sunAngle - p.angle + 180) % 360 - 180);
                  const isActive = diff < 8;
                  return (
                    <button
                      key={p.label}
                      onClick={() => onSunAngleChange(p.angle, true)}
                      title={`Jump to ${p.label} (${p.angle}°)`}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-all text-left flex items-center justify-between relative group ${
                        isActive
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-semibold shadow-md shadow-amber-950/60'
                          : 'bg-space-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-space-950/90'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isActive ? 'bg-amber-400 shadow-sm shadow-amber-300 animate-pulse' : 'bg-slate-600'
                          }`}
                        />
                        <span className="truncate">{p.label}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0 ml-1">{p.angle}°</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Science note on Terminator */}
            <div className="p-2 rounded-xl bg-space-950/60 border border-slate-800/80 text-[10px] text-slate-400 leading-tight">
              <span className="text-amber-400 font-semibold font-mono">Terminator Effect:</span>{' '}
              Craters near the day/night boundary cast elongated shadows, revealing sheer mountain walls and central peaks with maximum geological relief.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
