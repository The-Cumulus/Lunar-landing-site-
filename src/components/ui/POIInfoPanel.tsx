import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Scale, 
  Mountain, 
  Compass, 
  Award, 
  CheckCircle2, 
  Target,
  Copy,
  Check
} from 'lucide-react';
import { LunarPOI } from '../../types/lunar';
import { copyToClipboard } from '../../utils/clipboard';

interface POIInfoPanelProps {
  poi: LunarPOI | null;
  onClose: () => void;
  onFocusSite?: (poi: LunarPOI) => void;
  onCopyCoordinates?: (coordString: string, siteName: string) => void;
  className?: string;
}

export const POIInfoPanel: React.FC<POIInfoPanelProps> = ({
  poi,
  onClose,
  onFocusSite,
  onCopyCoordinates,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  if (!poi) return null;

  const handleCopyCoords = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = `${poi.lat.toFixed(5)}, ${poi.lng.toFixed(5)}`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      onCopyCoordinates?.(text, poi.name);
    }
  };

  return (
    <div className={`pointer-events-auto min-h-0 flex-1 flex flex-col rounded-2xl bg-space-900/95 border border-slate-800/90 backdrop-blur-2xl shadow-2xl overflow-hidden animate-slideLeft w-full ${className}`}>
      {/* Banner / Header */}
        <div 
          className="p-4 sm:p-5 border-b border-slate-800/80 relative"
          style={{
            background: `linear-gradient(135deg, ${poi.accentColor}18 0%, rgba(11, 15, 25, 0.95) 100%)`
          }}
        >
          {/* Top category & agency badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm"
                style={{ 
                  color: poi.accentColor, 
                  borderColor: `${poi.accentColor}50`,
                  backgroundColor: `${poi.accentColor}15`
                }}
              >
                {poi.agency} · {poi.country}
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400">
                {poi.category} Program
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {poi.name}
          </h2>
          {poi.subTitle && (
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              {poi.subTitle}
            </p>
          )}

          {/* Quick Action Button: Center Camera */}
          {onFocusSite && (
            <button
              onClick={() => onFocusSite(poi)}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border shadow-lg"
              style={{
                backgroundColor: `${poi.accentColor}25`,
                borderColor: `${poi.accentColor}60`,
                color: '#ffffff'
              }}
            >
              <Target className="w-3.5 h-3.5" style={{ color: poi.accentColor }} />
              Re-center Camera Above Site
            </button>
          )}
        </div>

        {/* Scrollable Content Body - fully interactive scrollbar */}
        <div className="flex-1 overflow-y-auto pointer-events-auto p-4 sm:p-5 space-y-4 text-xs font-mono">
          {/* Coordinates & Elevation Matrix */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 uppercase tracking-wider">
              <span>Selenographic Position</span>
              <button
                type="button"
                onClick={handleCopyCoords}
                onContextMenu={handleCopyCoords}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                title="Right click or click to copy coordinates"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Lat, Lon</span>
                  </>
                )}
              </button>
            </div>

            <div 
              onClick={handleCopyCoords}
              onContextMenu={handleCopyCoords}
              title="Click or right-click to copy coordinates"
              className="grid grid-cols-2 gap-2 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/80 group-hover:border-cyan-500/50 transition-colors">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  Lunar Latitude
                </div>
                <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                  <span>{poi.lat >= 0 ? `+${poi.lat.toFixed(5)}° N` : `${poi.lat.toFixed(5)}° S`}</span>
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/80 group-hover:border-cyan-500/50 transition-colors">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  Lunar Longitude
                </div>
                <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                  <span>{poi.lng >= 0 ? `+${poi.lng.toFixed(5)}° E` : `${poi.lng.toFixed(5)}° W`}</span>
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
                </div>
              </div>
            </div>
          </div>

          {/* Elevation & Touchdown Date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/80">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                <Mountain className="w-3 h-3 text-emerald-400" />
                LOLA Elevation
              </div>
              <div className="text-xs font-bold text-slate-100">
                {poi.elevationMeters.toLocaleString()} m
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-space-950/70 border border-slate-800/80">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                Touchdown Date
              </div>
              <div className="text-xs font-bold text-slate-100 truncate" title={poi.landingDate || 'Ongoing'}>
                {poi.landingDate || 'Planned'}
              </div>
            </div>
          </div>

          {/* Mission Specifications (Crew, Duration, Samples) */}
          {(poi.crew || poi.duration || poi.samplesReturnedKg !== undefined) && (
            <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Mission Specifications
              </div>

              {poi.crew && poi.crew.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-400 text-[10px] block">Astronaut Crew:</span>
                    <ul className="text-slate-200 text-[11px] list-disc list-inside space-y-0.5 mt-0.5">
                      {poi.crew.map((member, idx) => (
                        <li key={idx}>{member}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {poi.duration && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400 text-[10px]">Surface Duration:</span>
                  <span className="font-semibold">{poi.duration}</span>
                </div>
              )}

              {poi.samplesReturnedKg !== undefined && poi.samplesReturnedKg > 0 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Scale className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-slate-400 text-[10px]">Samples Returned:</span>
                  <span className="font-semibold text-purple-300">{poi.samplesReturnedKg} kg</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Mission Overview
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {poi.description}
            </p>
          </div>

          {/* Historical Significance */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30">
            <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5" />
              Historical Milestone
            </div>
            <p className="text-slate-300 italic font-sans text-xs leading-relaxed">
              {poi.historicalSignificance}
            </p>
          </div>

          {/* Key Scientific Goals */}
          {poi.keyScientificGoals && poi.keyScientificGoals.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Key Science Payloads & Discoveries
              </div>
              <div className="space-y-1.5">
                {poi.keyScientificGoals.map((goal, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-space-950/60 border border-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-[11px] font-sans leading-tight">
                      {goal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Surface Geology */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Geomorphology & Surface Setting
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed p-2.5 rounded-xl bg-space-950/60 border border-slate-800/60">
              {poi.surfaceFeatures}
            </p>
          </div>
        </div>
      </div>
  );
};
