import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { LunarGlobe } from './LunarGlobe';
import { SunLighting, SunLightingRef } from './SunLighting';
import { EarthReference } from './EarthReference';
import { POIMarkers } from './POIMarkers';
import { CoordinateGraticule } from './CoordinateGraticule';
import { LunarPOI, BasemapType, POICategory, LunarCoordinateHover, TerrainFilterConfig } from '../../types/lunar';
import { MapLayerId } from '../../utils/nasaWmtsLoader';
import { latLngToVector3 } from '../../utils/coordinates';

export interface LunarSceneRef {
  resetCamera: () => void;
  flyToLatLng: (lat: number, lng: number, distanceFactor?: number) => void;
  setSunAngle?: (angle: number) => void;
  zoomIn: (factor?: number) => void;
  zoomOut: (factor?: number) => void;
}

// ─── Camera Animator ────────────────────────────────────────────────────────
// Always mounted inside Canvas; owns the smooth lerp fly-to animation.
interface CameraAnimatorProps {
  orbitControlsRef: React.RefObject<OrbitControlsImpl>;
  targetRef: React.MutableRefObject<THREE.Vector3 | null>;
  isAnimatingRef: React.MutableRefObject<boolean>;
}
const CameraAnimator: React.FC<CameraAnimatorProps> = ({
  orbitControlsRef,
  targetRef,
  isAnimatingRef,
}) => {
  useFrame(({ camera }) => {
    if (!isAnimatingRef.current || !targetRef.current) return;

    camera.position.lerp(targetRef.current, 0.055);

    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.set(0, 0, 0);
      orbitControlsRef.current.update();
    }

    if (camera.position.distanceTo(targetRef.current) < 0.03) {
      camera.position.copy(targetRef.current);
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(0, 0, 0);
        orbitControlsRef.current.update();
      }
      isAnimatingRef.current = false;
    }
  });
  return null;
};

interface LunarSceneProps {
  basemap: BasemapType;
  terrainConfig?: TerrainFilterConfig;
  sunAngle: number;
  enableSunShade?: boolean;
  autoRotate: boolean;
  autoSunCycle: boolean;
  showGraticule: boolean;
  showMarkers: boolean;
  showPOILabels: boolean;
  activeCategory: POICategory | 'all';
  pois: LunarPOI[];
  selectedPOI: LunarPOI | null;
  onSelectPOI: (poi: LunarPOI) => void;
  onSunAngleChange: (angle: number) => void;
  onHoverCoordinate: (coord: LunarCoordinateHover | null) => void;
  onHoverSitePin?: (coord: LunarCoordinateHover | null) => void;
  onClickCoordinate?: (coord: { lat: number; lng: number }) => void;
  isModalOpen?: boolean;
  customTexture?: THREE.Texture | null;
  customBumpTexture?: THREE.Texture | null;
  bumpScale?: number;
  mapLayerId?: MapLayerId;
}

export const LunarScene = forwardRef<LunarSceneRef, LunarSceneProps>(({
  basemap,
  terrainConfig,
  sunAngle,
  enableSunShade = true,
  autoRotate,
  autoSunCycle,
  showGraticule,
  showMarkers,
  showPOILabels,
  activeCategory,
  pois,
  selectedPOI,
  onSelectPOI,
  onSunAngleChange,
  onHoverCoordinate,
  onHoverSitePin,
  onClickCoordinate,
  isModalOpen = false,
  customTexture = null,
  customBumpTexture = null,
  bumpScale = 0.05,
  mapLayerId = 'default'
}, ref) => {
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const sunLightingRef = useRef<SunLightingRef>(null);
  // Camera fly-to state — shared with CameraAnimator (always mounted inside Canvas)
  const flyTargetRef = useRef<THREE.Vector3 | null>(null);
  const isAnimatingRef = useRef<boolean>(false);

  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      isAnimatingRef.current = false;
      flyTargetRef.current = null;
      if (orbitControlsRef.current) {
        orbitControlsRef.current.reset();
        orbitControlsRef.current.target.set(0, 0, 0);
        orbitControlsRef.current.object.position.set(0, 0, 5.2);
        orbitControlsRef.current.update();
      }
    },
    flyToLatLng: (lat: number, lng: number, distanceFactor: number = 1.18) => {
      const GLOBE_RADIUS = 2.0;
      const FLY_DISTANCE = GLOBE_RADIUS * distanceFactor;
      const surfacePos = latLngToVector3(lat, lng, GLOBE_RADIUS);
      flyTargetRef.current = surfacePos.clone().normalize().multiplyScalar(FLY_DISTANCE);
      isAnimatingRef.current = true;
    },
    setSunAngle: (angle: number) => {
      sunLightingRef.current?.setAngle(angle);
    },
    zoomIn: (factor: number = 0.8) => {
      isAnimatingRef.current = false;
      flyTargetRef.current = null;
      if (orbitControlsRef.current) {
        const cam = orbitControlsRef.current.object;
        const currentDist = cam.position.length();
        const newDist = Math.max(2.08, currentDist * factor);
        cam.position.normalize().multiplyScalar(newDist);
        orbitControlsRef.current.update();
      }
    },
    zoomOut: (factor: number = 1.25) => {
      isAnimatingRef.current = false;
      flyTargetRef.current = null;
      if (orbitControlsRef.current) {
        const cam = orbitControlsRef.current.object;
        const currentDist = cam.position.length();
        const newDist = Math.min(18.0, currentDist * factor);
        cam.position.normalize().multiplyScalar(newDist);
        orbitControlsRef.current.update();
      }
    }
  }));

  return (
    <div
      className="absolute inset-0 w-full h-full z-0 isolate cursor-grab active:cursor-grabbing overflow-hidden"
      onPointerLeave={() => onHoverCoordinate?.(null)}
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 45, near: 0.05, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerMissed={() => onHoverCoordinate?.(null)}
      >
        <color attach="background" args={['#02040a']} />

        {/* Always-mounted camera animator — independent of POIMarkers visibility */}
        <CameraAnimator
          orbitControlsRef={orbitControlsRef}
          targetRef={flyTargetRef}
          isAnimatingRef={isAnimatingRef}
        />

        {/* Deep Space Background Stars */}
        <Stars
          radius={80}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={0.4}
        />

        {/* Dynamic Solar Lighting & Phase Simulation */}
        <SunLighting
          ref={sunLightingRef}
          sunAngle={sunAngle}
          enableShade={enableSunShade}
          autoCycle={autoSunCycle}
          onAngleChange={onSunAngleChange}
          hideBadge={isModalOpen}
        />

        {/* Celestial Earth Reference in the Lunar Sky */}
        <EarthReference hideBadge={isModalOpen} />

        {/* Centered 3D Lunar Globe with Dynamic Terrain Analysis & LOLA DEM */}
        <LunarGlobe
          radius={2.0}
          basemap={basemap}
          terrainConfig={terrainConfig}
          sunAngle={sunAngle}
          enableSunShade={enableSunShade}
          bumpScale={bumpScale}
          customTexture={customTexture}
          customBumpTexture={customBumpTexture}
          mapLayerId={mapLayerId}
          onHoverCoordinate={onHoverCoordinate}
          onClickCoordinate={onClickCoordinate}
        />

        {/* Lat/Lng Coordinate Graticule Grid */}
        <CoordinateGraticule
          radius={2.008}
          visible={showGraticule}
        />

        {/* Landing Sites & Interactive POI Markers: hidden while modals/search are open */}
        <POIMarkers
          radius={2.0}
          pois={pois}
          selectedPOI={selectedPOI}
          onSelectPOI={onSelectPOI}
          activeCategory={activeCategory}
          showMarkers={showMarkers && !isModalOpen}
          showLabels={showPOILabels}
          orbitControlsRef={orbitControlsRef}
          onHoverCoordinate={onHoverSitePin || onHoverCoordinate}
        />

        {/* Orbit Controls Centered on Origin (0, 0, 0) */}
        <OrbitControls
          ref={orbitControlsRef}
          target={[0, 0, 0]}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.75}
          zoomSpeed={0.9}
          minDistance={2.08}
          maxDistance={18.0}
          autoRotate={autoRotate}
          autoRotateSpeed={0.3}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
});
