import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface EarthReferenceProps {
  distance?: number;
  radius?: number;
  hideBadge?: boolean;
}

export const EarthReference: React.FC<EarthReferenceProps> = ({
  distance = 34,
  radius = 1.35,
  hideBadge = false,
}) => {
  const earthMeshRef = useRef<THREE.Mesh>(null);

  // Position Earth along the Moon's sub-Earth axis (+X direction from Moon center)
  // Incorporating the ~5.14° lunar orbital inclination relative to the ecliptic
  const position = useMemo<[number, number, number]>(() => {
    const incl = (5.14 * Math.PI) / 180;
    return [
      distance * Math.cos(incl),
      distance * Math.sin(incl),
      -1.2
    ];
  }, [distance]);

  // Load authentic NASA Blue Marble Earth texture
  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(
      '/textures/earth_atmos_2048.jpg',
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping;
        t.needsUpdate = true;
      },
      undefined,
      () => {
        console.warn('Could not load earth_atmos_2048.jpg');
      }
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Smooth realistic axial rotation
  useFrame((_, delta) => {
    if (earthMeshRef.current) {
      earthMeshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Earth axial tilt (~23.44°) */}
      <group rotation={[0, 0, THREE.MathUtils.degToRad(-23.44)]}>
        {/* Main Earth Sphere (lit realistically by directional sunlight) */}
        <mesh ref={earthMeshRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial
            map={earthTexture}
            roughness={0.65}
            metalness={0.05}
            emissive="#061224"
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* Atmospheric Blue Limb Glow */}
        <mesh scale={1.03}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Outer Atmospheric Scatter Haze */}
        <mesh scale={1.08}>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.09}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* Earth Reference HUD Pill Badge: hidden when modals/search are open */}
      {!hideBadge && (
        <Html position={[0, radius + 0.45, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-space-950/85 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 shadow-xl backdrop-blur-md whitespace-nowrap select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Earth • ~384,400 km</span>
          </div>
        </Html>
      )}
    </group>
  );
};

