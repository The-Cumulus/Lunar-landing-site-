import React, { useState, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { LunarPOI, POICategory, LunarCoordinateHover } from '../../types/lunar';
import { latLngToVector3 } from '../../utils/coordinates';
import { LunarDEMService } from '../../utils/demAnalysis';

interface POIMarkersProps {
  pois: LunarPOI[];
  selectedPOI: LunarPOI | null;
  onSelectPOI: (poi: LunarPOI) => void;
  radius?: number;
  activeCategory?: POICategory | 'all';
  showMarkers?: boolean;
  showLabels?: boolean;
  orbitControlsRef?: React.RefObject<any>;
  onHoverCoordinate?: (coord: LunarCoordinateHover | null) => void;
}

interface SinglePOIMarkerProps {
  poi: LunarPOI;
  radius: number;
  isSelected: boolean;
  isHovered: boolean;
  showLabels: boolean;
  onSelect: (poi: LunarPOI) => void;
  onHover: (id: string | null) => void;
  onHoverCoordinate?: (coord: LunarCoordinateHover | null) => void;
}

const SinglePOIMarker: React.FC<SinglePOIMarkerProps> = ({
  poi,
  radius,
  isSelected,
  isHovered,
  showLabels,
  onSelect,
  onHover,
  onHoverCoordinate
}) => {
  const { camera } = useThree();
  const pinRef = useRef<HTMLDivElement>(null);

  // Hover telemetry dispatcher: immediately sends site's exact latitude & longitude to the bottom right box
  const handleMouseEnter = () => {
    onHover(poi.id);
    if (onHoverCoordinate) {
      const analysis = LunarDEMService.getInstance().getPointAnalysis(poi.lat, poi.lng);
      onHoverCoordinate({
        lat: poi.lat,
        lng: poi.lng,
        elevationMeters: poi.elevationMeters ?? analysis?.elevationMeters,
        elevationApprox: poi.elevationMeters ?? analysis?.elevationMeters,
        slopeDeg: analysis?.slopeDeg ?? 0,
        roughnessM: analysis?.roughnessM ?? 0,
        terrainClass: analysis?.elevationCategoryName || 'Lunar Surface',
        siteName: poi.name
      });
    }
  };

  const handleMouseLeave = () => {
    onHover(null);
    if (onHoverCoordinate) {
      onHoverCoordinate(null);
    }
  };

  // 3D Cartesian position on lunar sphere
  const pos = useMemo(() => {
    return latLngToVector3(poi.lat, poi.lng, radius * 1.01);
  }, [poi.lat, poi.lng, radius]);

  // Normalized surface normal vector pointing outward from Moon center
  const posNorm = useMemo(() => {
    return pos.clone().normalize();
  }, [pos]);

  // Synchronous geometric horizon culling check against camera position
  const checkVisibility = (camPos: THREE.Vector3): boolean => {
    const camDist = camPos.length();
    if (camDist === 0) return false;

    // Cosine of angle between pin position vector and camera direction
    const cosTheta = posNorm.dot(camPos) / camDist;

    // Tangent horizon limit for sphere of radius R: cos(alpha) = R / |C|
    // Add small buffer (+0.035 ≈ 2°) so pins smoothly hide before protruding past the Moon's silhouette
    const horizonLimit = (radius / camDist) + 0.035;

    return cosTheta > horizonLimit;
  };

  // Synchronously evaluate initial visibility on mount using current camera position:
  // When pins are turned ON, non-visible pins (e.g. South Pole pins when viewing from North Pole)
  // start immediately with style display: 'none' and NEVER show on screen.
  const isInitiallyVisible = useMemo(() => {
    return checkVisibility(camera.position);
  }, [camera.position, posNorm, radius]);

  // High-performance 60fps frame update: Mutates DOM display style directly
  // without triggering React state updates or unmounting Drei roots
  useFrame(({ camera: currentCam }) => {
    if (!pinRef.current) return;
    const visible = checkVisibility(currentCam.position);
    const targetDisplay = visible ? 'flex' : 'none';
    if (pinRef.current.style.display !== targetDisplay) {
      pinRef.current.style.display = targetDisplay;
    }
    if (!visible && isHovered) {
      onHover(null);
      if (onHoverCoordinate) {
        onHoverCoordinate(null);
      }
    }
  });

  return (
    <group position={pos}>
      <Html
        center
        zIndexRange={[10, 0]}
        style={{
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
      >
        <div
          ref={pinRef}
          className="relative flex flex-col items-center select-none"
          style={{ display: isInitiallyVisible ? 'flex' : 'none' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(poi);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {isSelected ? (
            /* Iconic Teardrop Location Pin Symbol for Selected / Searched Coordinates */
            <div className="relative flex flex-col items-center -translate-y-full -mt-0.5 cursor-pointer group">
              {/* Floating Name & Coordinate Tag above Pin */}
              <div className="mb-1 px-2.5 py-1 rounded-xl bg-space-950/95 border border-cyan-400/80 shadow-[0_4px_16px_rgba(6,182,212,0.4)] backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap z-50">
                <div 
                  className="w-2 h-2 rounded-full shrink-0 border border-black" 
                  style={{ backgroundColor: poi.accentColor }} 
                />
                <span className="font-mono text-xs font-bold text-white tracking-tight">
                  {poi.name}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 ml-0.5">
                  ({poi.lat >= 0 ? `+${poi.lat.toFixed(2)}°` : `${poi.lat.toFixed(2)}°`},{' '}
                  {poi.lng >= 0 ? `+${poi.lng.toFixed(2)}°` : `${poi.lng.toFixed(2)}°`})
                </span>
              </div>

              {/* Classic Map Location Pin Symbol SVG with needle pointing to ground */}
              <div className="relative filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] transition-transform duration-200 group-hover:scale-110">
                <svg 
                  viewBox="0 0 24 32" 
                  width="26" 
                  height="35" 
                  className="block"
                >
                  <defs>
                    <linearGradient id={`pinGrad-${poi.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor={poi.accentColor || '#0284c7'} />
                    </linearGradient>
                  </defs>
                  {/* Classic Teardrop Pin Silhouette with refined black outline */}
                  <path
                    d="M12 1C6.477 1 2 5.477 2 11c0 7.5 10 19 10 19s10-11.5 10-19c0-5.523-4.477-10-10-10z"
                    fill={`url(#pinGrad-${poi.id})`}
                    stroke="#000000"
                    strokeWidth="1.2"
                  />
                  {/* Center Target Disc */}
                  <circle cx="12" cy="11" r="4.5" fill="#ffffff" stroke="#000000" strokeWidth="0.8" />
                  <circle cx="12" cy="11" r="2" fill="#030712" />
                </svg>
              </div>

              {/* Ground Touchdown Anchor Point on Lunar Surface */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div 
                  className="absolute -inset-2 rounded-full border border-cyan-400 animate-ping opacity-75" 
                  style={{ borderColor: poi.accentColor }}
                />
                <div 
                  className="w-2.5 h-2.5 rounded-full border border-black shadow-md"
                  style={{ backgroundColor: poi.accentColor }} 
                />
              </div>
            </div>
          ) : (
            /* Minimalist Professional Radar Pin for unselected sites with generous hit area */
            <div className="relative flex items-center justify-center p-2.5 -m-2.5 cursor-pointer group">
              {isHovered && (
                <div
                  className="absolute w-6 h-6 rounded-full border border-cyan-400 animate-ping opacity-60 pointer-events-none"
                  style={{ borderColor: poi.accentColor }}
                />
              )}

              {/* Core Pin Dot with slim, refined black outline */}
              <div
                className={`w-2.5 h-2.5 rounded-full border border-black transition-all duration-150 shadow-md ${
                  isHovered
                    ? 'scale-125 ring-1 ring-black/70'
                    : 'opacity-95 group-hover:opacity-100 group-hover:scale-110'
                }`}
                style={{
                  backgroundColor: poi.accentColor,
                  boxShadow: `0 0 5px ${poi.accentColor}aa`
                }}
              />
            </div>
          )}

          {/* Neat Micro-Tooltip: ONLY on Hover for unselected pins */}
          {!isSelected && (isHovered || showLabels) && (
            <div className="absolute bottom-full mb-1.5 flex flex-col items-center pointer-events-none whitespace-nowrap z-50">
              <div className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium tracking-tight bg-space-950/95 text-slate-100 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 border border-black"
                  style={{ backgroundColor: poi.accentColor }}
                />
                <span>{poi.name}</span>
              </div>
              {/* Tooltip arrow pointer */}
              <div className="w-1.5 h-1.5 bg-space-950 border-r border-b border-slate-700/80 transform rotate-45 -mt-1" />
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

export const POIMarkers: React.FC<POIMarkersProps> = ({
  pois,
  selectedPOI,
  onSelectPOI,
  radius = 2.0,
  activeCategory = 'all',
  showMarkers = false,
  showLabels = false,
  onHoverCoordinate
}) => {
  const [hoveredPOI, setHoveredPOI] = useState<string | null>(null);

  // If user has markers turned off, render nothing
  if (!showMarkers) return null;

  const filteredPOIs = pois.filter(poi => {
    if (activeCategory === 'all') return true;
    return poi.category === activeCategory;
  });

  // Ensure selectedPOI is always rendered with the location pin symbol even if filtered or if it's a custom searched coordinate
  const isSelectedInList = selectedPOI && filteredPOIs.some(p => p.id === selectedPOI.id);

  return (
    <group>
      {filteredPOIs.map(poi => (
        <SinglePOIMarker
          key={poi.id}
          poi={poi}
          radius={radius}
          isSelected={selectedPOI?.id === poi.id}
          isHovered={hoveredPOI === poi.id}
          showLabels={showLabels}
          onSelect={onSelectPOI}
          onHover={setHoveredPOI}
          onHoverCoordinate={onHoverCoordinate}
        />
      ))}

      {/* Standalone selected / searched location pin */}
      {selectedPOI && !isSelectedInList && (
        <SinglePOIMarker
          key={selectedPOI.id}
          poi={selectedPOI}
          radius={radius}
          isSelected={true}
          isHovered={hoveredPOI === selectedPOI.id}
          showLabels={true}
          onSelect={onSelectPOI}
          onHover={setHoveredPOI}
          onHoverCoordinate={onHoverCoordinate}
        />
      )}
    </group>
  );
};
