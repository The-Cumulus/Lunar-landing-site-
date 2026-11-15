import React from 'react';
import { 
  X, 
  Navigation, 
  MapPin, 
  Compass, 
  Ruler, 
  Layers, 
  Info, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { USGSNomenclatureFeature } from '../../data/usgsLunarNomenclature';

interface USGSNomenclatureModalProps {
  feature: USGSNomenclatureFeature | null;
  onClose: () => void;
  onFlyToFeature: (lat: number, lng: number, altitudeMeters?: number) => void;
}

export const USGSNomenclatureModal: React.FC<USGSNomenclatureModalProps> = ({
  feature,
  onClose,
  onFlyToFeature
}) => {
  if (!feature) return null;

  const latFormatted = `${feature.lat >= 0 ? '+' : ''}${feature.lat.toFixed(5)}°`;
  const lngFormatted = `${feature.lng >= 0 ? '+' : ''}${feature.lng.toFixed(5)}°`;

  const getAltitudeForFeature = () => {
    if (feature.diameterKm) {
      // Scale camera altitude proportional to crater diameter
      return Math.max(18000, feature.diameterKm * 1500);
    }
    return 35000;
  };

  return (
    <div className="fixed bottom-14 sm:bottom-16 left-3 sm:left-4 z-40 w-[calc(100vw-1.5rem)] sm:w-[420px] rounded-2xl bg-space-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl p-4 text-slate-200 select-none animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-400 shadow-md">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-wide font-mono">
                {feature.cleanName}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {feature.category.replace('_', ' ')}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              LAT: {latFormatted} • LON: {lngFormatted}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-space-900 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Close Feature Details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row: Diameter, Depth, Geologic Era */}
      <div className="grid grid-cols-2 gap-2 mb-3 font-mono text-xs">
        {feature.diameterKm !== undefined && (
          <div className="p-2 rounded-xl bg-space-900/80 border border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">DIAMETER:</span>
            <span className="font-bold text-white flex items-center gap-1">
              <Ruler className="w-3 h-3 text-cyan-400" />
              <span>{feature.diameterKm} km</span>
            </span>
          </div>
        )}

        {feature.depthKm !== undefined && (
          <div className="p-2 rounded-xl bg-space-900/80 border border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">DEPTH:</span>
            <span className="font-bold text-purple-300">
              {feature.depthKm} km
            </span>
          </div>
        )}

        {feature.quadName && (
          <div className="col-span-2 p-2 rounded-xl bg-space-900/80 border border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">USGS QUADRANGLE:</span>
            <span className="font-bold text-cyan-300">{feature.quadName}</span>
          </div>
        )}

        {feature.geologicEra && (
          <div className="col-span-2 p-2 rounded-xl bg-space-900/80 border border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">STRATIGRAPHIC ERA:</span>
            <span className="font-bold text-amber-300">{feature.geologicEra}</span>
          </div>
        )}
      </div>

      {/* IAU Origin / Nomenclature Derivation */}
      <div className="p-2.5 rounded-xl bg-space-900/60 border border-slate-800/80 text-xs mb-3 space-y-1">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>IAU Nomenclature Origin:</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
          {feature.origin}
        </p>
      </div>

      {/* Scientific Notes */}
      <div className="p-2.5 rounded-xl bg-space-900/40 border border-slate-800/60 text-xs mb-3.5 space-y-1">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Scientific Geological Summary:</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
          {feature.scientificNotes}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onFlyToFeature(feature.lat, feature.lng, getAltitudeForFeature());
            onClose();
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Fly & Inspect 3D Terrain</span>
        </button>

        <a
          href={`https://planetarynames.wr.usgs.gov/SearchResults?target=MOON&name=${encodeURIComponent(feature.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-space-900 hover:bg-space-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Open Official USGS Gazetteer Entry"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
