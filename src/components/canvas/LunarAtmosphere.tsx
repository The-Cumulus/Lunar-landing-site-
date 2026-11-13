import React from 'react';
import * as THREE from 'three';

/**
 * Creates a subtle celestial limb glow around the Moon using custom Fresnel-like backface shading.
 */
export const LunarAtmosphere: React.FC<{ radius?: number }> = ({ radius = 2.025 }) => {
  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshBasicMaterial
        color="#93c5fd"
        transparent
        opacity={0.07}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

