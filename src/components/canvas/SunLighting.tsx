import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export interface SunLightingRef {
  setAngle: (angle: number) => void;
}

interface SunLightingProps {
  sunAngle: number;         // 0 to 360 degrees
  sunIntensity?: number;
  autoCycle?: boolean;
  onAngleChange?: (newAngle: number) => void;
  enableShade?: boolean;    // Toggle: Realistic solar shade vs Full 360° illumination
  hideBadge?: boolean;
}

// Convert sun angle in degrees to 3D Cartesian coordinates
// Moon ecliptic inclination is only ~1.54°, so Sun stays close to lunar equatorial plane
const getSunCoords = (angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  const distance = 25;
  const x = Math.cos(rad) * distance;
  const z = Math.sin(rad) * distance;
  const y = Math.sin(rad * 0.5) * 1.5; // slight seasonal tilt
  return { x, y, z };
};

export const SunLighting = forwardRef<SunLightingRef, SunLightingProps>(({
  sunAngle,
  sunIntensity = 2.8,
  autoCycle = false,
  onAngleChange,
  enableShade = true,
  hideBadge = false
}, ref) => {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const earthshineLightRef = useRef<THREE.DirectionalLight>(null);
  const fillLight1Ref = useRef<THREE.DirectionalLight>(null);
  const fillLight2Ref = useRef<THREE.DirectionalLight>(null);
  const sunGroupRef = useRef<THREE.Group>(null);
  const sunMarkerRef = useRef<THREE.Mesh>(null);

  // Maintain local mutable angle ref for smooth 60/120 FPS continuous rotation
  // without relying on or clashing with asynchronous React state
  const angleRef = useRef<number>(sunAngle);
  const lastReportTimeRef = useRef<number>(0);

  // Synchronously update Three.js lights and sun group directly in scene graph
  const updateVisuals = useCallback((angleDeg: number) => {
    const { x, y, z } = getSunCoords(angleDeg);
    if (dirLightRef.current) {
      dirLightRef.current.position.set(x, y, z);
    }
    if (earthshineLightRef.current) {
      earthshineLightRef.current.position.set(-x, -y, -z);
    }
    if (fillLight1Ref.current) {
      fillLight1Ref.current.position.set(x, y, z);
    }
    if (fillLight2Ref.current) {
      fillLight2Ref.current.position.set(-x, -y, -z);
    }
    if (sunGroupRef.current) {
      sunGroupRef.current.position.set(x * 1.5, y * 1.5, z * 1.5);
    }
  }, []);

  // Expose imperative setter for instantaneous, zero-latency preset changes
  useImperativeHandle(ref, () => ({
    setAngle: (angle: number) => {
      angleRef.current = angle;
      updateVisuals(angle);
    }
  }), [updateVisuals]);

  // Synchronize when sunAngle prop changes externally (e.g. preset clicked or slider dragged)
  useEffect(() => {
    const diff = Math.abs((sunAngle - angleRef.current + 180) % 360 - 180);
    // If difference is non-trivial, update internal angle and 3D positions immediately
    if (diff > 0.4) {
      angleRef.current = sunAngle;
      updateVisuals(sunAngle);
    }
  }, [sunAngle, updateVisuals]);

  // When shade mode toggles, position newly mounted lights
  useEffect(() => {
    updateVisuals(angleRef.current);
  }, [enableShade, updateVisuals]);

  // When autoCycle stops, ensure parent state reflects final decimal angle
  useEffect(() => {
    if (!autoCycle) {
      onAngleChange?.(angleRef.current);
    }
  }, [autoCycle, onAngleChange]);

  // 60/120 FPS smooth animation loop
  useFrame((_, delta) => {
    if (autoCycle) {
      // Advance angle smoothly (~8 degrees per second)
      angleRef.current = (angleRef.current + delta * 8) % 360;

      // Update Three.js lights directly on EVERY animation frame for buttery smooth movement
      updateVisuals(angleRef.current);

      // Throttle reporting to React state (~15 FPS) to eliminate CPU thrashing and prevent click drops
      const now = performance.now();
      if (now - lastReportTimeRef.current >= 65) {
        lastReportTimeRef.current = now;
        onAngleChange?.(angleRef.current);
      }
    }
  });

  const initialCoords = getSunCoords(sunAngle);
  const { x: initX, y: initY, z: initZ } = initialCoords;

  return (
    <group>
      {enableShade ? (
        <>
          {/* Realistic Solar Shading Mode: Directional Sunlight + Soft Nightside Terminator Shadows */}
          <directionalLight
            ref={dirLightRef}
            position={[initX, initY, initZ]}
            intensity={sunIntensity}
            color="#fffaf0"
            castShadow={false}
          />

          {/* Deep Space Cosmic Ambient Fill (lifted to 0.22 like homepage to illuminate dark region details) */}
          <ambientLight intensity={0.22} color="#e2e8f0" />

          {/* Earthshine secondary bounce light on unlit dark limb (matches homepage 0.25 #38bdf8) */}
          <directionalLight
            ref={earthshineLightRef}
            position={[-initX, -initY, -initZ]}
            intensity={0.25}
            color="#38bdf8"
          />
        </>
      ) : (
        <>
          {/* Full Illumination Mode (Shade OFF): Bright, uniform 360° lighting with NO dark shadows */}
          <ambientLight intensity={1.55} color="#ffffff" />

          {/* Soft multi-angle key & fill lights to maintain surface crater relief */}
          <directionalLight
            ref={fillLight1Ref}
            position={[initX, initY, initZ]}
            intensity={0.4}
            color="#ffffff"
          />
          <directionalLight
            ref={fillLight2Ref}
            position={[-initX, -initY, -initZ]}
            intensity={0.4}
            color="#ffffff"
          />
          <directionalLight
            position={[0, 20, 0]}
            intensity={0.25}
            color="#f8fafc"
          />
          <directionalLight
            position={[0, -20, 0]}
            intensity={0.25}
            color="#f8fafc"
          />
        </>
      )}

      {/* Distant Sun Visual Flare / Corona & Reference Marker */}
      <group ref={sunGroupRef} position={[initX * 1.5, initY * 1.5, initZ * 1.5]}>
        {/* Core incandescent Sun sphere */}
        <mesh ref={sunMarkerRef}>
          <sphereGeometry args={[0.85, 32, 32]} />
          <meshBasicMaterial color="#fffef0" />
        </mesh>

        {/* Inner golden corona glow */}
        <mesh scale={1.35}>
          <sphereGeometry args={[0.85, 16, 16]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.25} />
        </mesh>

        {/* Outer solar atmospheric haze */}
        <mesh scale={1.8}>
          <sphereGeometry args={[0.85, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.12} />
        </mesh>

        {/* Sun Reference HUD Pill Badge: hidden when modals/search are open */}
        {!hideBadge && (
          <Html position={[0, 1.4, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-space-950/85 border border-amber-500/50 text-[10px] font-mono text-amber-300 shadow-xl backdrop-blur-md whitespace-nowrap select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Sun • Solar Vector {!enableShade && <span className="text-cyan-400 font-bold ml-1">• Full Lit</span>}</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
});
