import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { LunarTextureManager } from '../../utils/textureLoader';
import { LunarAtmosphere } from '../canvas/LunarAtmosphere';
import { latLngToVector3, formatCoordinatesDecimal } from '../../utils/coordinates';
import { BasemapType } from '../../types/lunar';

interface HighlightSite {
  id: string;
  name: string;
  category: string;
  agency: string;
  lat: number;
  lng: number;
  elevation: number;
  description: string;
  color: string;
}

const PREVIEW_SITES: HighlightSite[] = [
  {
    id: 'apollo-11',
    name: 'Apollo 11 (Tranquility Base)',
    category: 'Apollo Program',
    agency: 'NASA',
    lat: 0.6741,
    lng: 23.4730,
    elevation: -2570,
    description: 'First crewed landing site in human history (Neil Armstrong & Buzz Aldrin, July 20, 1969).',
    color: '#38bdf8'
  },
  {
    id: 'chandrayaan-3',
    name: 'Chandrayaan-3 (Shiv Shakti)',
    category: 'Lunar South Pole',
    agency: 'ISRO',
    lat: -69.373,
    lng: 32.319,
    elevation: -1850,
    description: 'Historic first soft landing in the lunar high-latitude southern polar region (August 23, 2023).',
    color: '#fb923c'
  },
  {
    id: 'artemis-shackleton',
    name: 'Artemis III Candidate (Ridge)',
    category: 'Artemis Program',
    agency: 'NASA / Coalition',
    lat: -89.44,
    lng: 140.0,
    elevation: 4200,
    description: 'Target ridge receiving ~90% year-round sunlight with direct access to permanent shadow ice.',
    color: '#a855f7'
  },
  {
    id: 'change-4',
    name: 'Chang\'e 4 (Von Kármán)',
    category: 'Far Side Exploration',
    agency: 'CNSA',
    lat: -45.444,
    lng: 177.588,
    elevation: -5900,
    description: 'First robotic landing on the lunar Far Side within the giant South Pole-Aitken impact basin.',
    color: '#ef4444'
  },
  {
    id: 'shackleton-crater',
    name: 'Shackleton Crater Rim',
    category: 'South Polar Crater',
    agency: 'IAU Landmark',
    lat: -89.67,
    lng: 129.78,
    elevation: -3800,
    description: '21-km-wide polar cold trap harboring ancient volatile ice deposits at temperatures < 40 K.',
    color: '#10b981'
  }
];

interface PreviewMoonMeshProps {
  radius?: number;
  basemap: BasemapType;
  selectedSite: HighlightSite | null;
  onSelectSite: (site: HighlightSite) => void;
  hoveredSite: string | null;
  onHoverSite: (id: string | null) => void;
}

const PreviewMoonMesh: React.FC<PreviewMoonMeshProps> = ({
  radius = 2.2,
  basemap,
  selectedSite,
  onSelectSite,
  hoveredSite,
  onHoverSite
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const naturalTexture = useMemo(() => LunarTextureManager.getNaturalTexture(), []);
  const topoTexture = useMemo(() => LunarTextureManager.getTopographicTexture(), []);
  const bumpMap = useMemo(() => LunarTextureManager.getBumpTexture(), []);

  const activeTexture = basemap === 'topographic' ? topoTexture : naturalTexture;

  // Gentle auto-rotation that pauses when user hovers a site
  useFrame((_, delta) => {
    if (meshRef.current && !hoveredSite && !selectedSite) {
      meshRef.current.rotation.y += delta * 0.035;
    }
  });

  return (
    <group>
      {/* 3D Moon Globe */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={activeTexture}
          bumpMap={basemap === 'natural' ? bumpMap : undefined}
          bumpScale={0.045}
          roughness={basemap === 'natural' ? 0.92 : 0.8}
          metalness={0.02}
        />
      </mesh>

      {/* Atmospheric Scatter Glow */}
      <LunarAtmosphere radius={radius * 1.012} />

      {/* Preview Landing Site Markers */}
      {PREVIEW_SITES.map(site => {
        const pos = latLngToVector3(site.lat, site.lng, radius * 1.018);
        const isSelected = selectedSite?.id === site.id;
        const isHovered = hoveredSite === site.id;

        return (
          <group key={site.id} position={pos}>
            <Html
              center
              zIndexRange={[15, 0]}
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            >
              <div
                className="relative flex flex-col items-center select-none group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSite(site);
                }}
                onMouseEnter={() => onHoverSite(site.id)}
                onMouseLeave={() => onHoverSite(null)}
              >
                {/* Marker Dot / Radar Pulse */}
                <div className="relative flex items-center justify-center p-2 -m-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border border-black transition-all shadow-md ${
                      isSelected || isHovered
                        ? 'scale-125 ring-2 ring-white/90'
                        : 'opacity-90 group-hover:scale-110'
                    }`}
                    style={{
                      backgroundColor: site.color,
                      boxShadow: `0 0 10px ${site.color}`
                    }}
                  />
                  {(isSelected || isHovered) && (
                    <div
                      className="absolute -inset-1 rounded-full border animate-ping pointer-events-none opacity-70"
                      style={{ borderColor: site.color }}
                    />
                  )}
                </div>

                {/* Floating Site Label */}
                {(isHovered || isSelected) && (
                  <div className="absolute bottom-full mb-2 px-2.5 py-1 rounded-xl bg-space-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-md whitespace-nowrap text-xs font-mono z-50">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: site.color }} />
                      <span>{site.name}</span>
                    </div>
                    <div className="text-[10px] text-cyan-300">
                      {formatCoordinatesDecimal(site.lat, site.lng)} • {site.elevation > 0 ? `+${site.elevation}m` : `${site.elevation}m`}
                    </div>
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

interface PreviewMoonCanvasProps {
  basemap: BasemapType;
  selectedSite: HighlightSite | null;
  onSelectSite: (site: HighlightSite) => void;
}

export const PreviewMoonCanvas: React.FC<PreviewMoonCanvasProps> = ({
  basemap,
  selectedSite,
  onSelectSite
}) => {
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
      <Canvas
        camera={{ position: [0, 0.2, 5.2], fov: 45, near: 0.05, far: 1000 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[6, 3, 5]}
          intensity={2.7}
          color="#fffaf0"
        />
        <directionalLight
          position={[-6, -2, -3]}
          intensity={0.25}
          color="#38bdf8"
        />

        <Stars
          radius={60}
          depth={30}
          count={2000}
          factor={3}
          saturation={0}
          fade
          speed={0.3}
        />

        <PreviewMoonMesh
          radius={2.15}
          basemap={basemap}
          selectedSite={selectedSite}
          onSelectSite={onSelectSite}
          hoveredSite={hoveredSite}
          onHoverSite={setHoveredSite}
        />

        <OrbitControls
          enableZoom={true}
          minDistance={2.28}
          maxDistance={9.0}
          enablePan={false}
          dampingFactor={0.06}
          rotateSpeed={0.7}
        />
      </Canvas>
    </div>
  );
};

export { PREVIEW_SITES };
export type { HighlightSite };
export default PreviewMoonCanvas;

