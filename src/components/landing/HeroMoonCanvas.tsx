import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { LunarTextureManager } from '../../utils/textureLoader';

interface HeroMoonMeshProps {
  radius?: number;
}

// Soft, continuous Fresnel limb glow shader: smoothly feathers into space with ZERO sharp edges or rings
const SoftLimbGlow: React.FC<{ radius: number }> = ({ radius }) => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          // Grazing limb calculation in view space (z-axis is view direction)
          float viewDot = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          // Soft exponential curve: peaks gently at the limb and smoothly feathers to absolute zero
          float glow = pow(1.0 - viewDot, 2.8);
          float alpha = smoothstep(0.02, 0.82, glow) * 0.28;
          gl_FragColor = vec4(vec3(0.24, 0.72, 0.98), alpha);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[radius * 1.025, 96, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const HeroMoonMesh: React.FC<HeroMoonMeshProps> = ({ radius = 1.58 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Photographic high-resolution NASA lunar texture
  const texture = useMemo(() => {
    return LunarTextureManager.getNaturalTexture();
  }, []);

  const bumpMap = useMemo(() => {
    return LunarTextureManager.getBumpTexture();
  }, []);

  // Smooth, majestic slow axial rotation + gentle cosmic floating breathing motion
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.045;
    }
    if (groupRef.current) {
      // Subtle zero-g floating oscillation that makes the Moon feel suspended in deep space
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Lunar Sphere with softened limb bump to eliminate jagged edges */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={texture}
          bumpMap={bumpMap}
          bumpScale={0.02}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>

      {/* Atmospheric feathered limb scatter glow (zero sharp rings) */}
      <SoftLimbGlow radius={radius} />
    </group>
  );
};

export const HeroMoonCanvas: React.FC = () => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
      <Canvas
        camera={{ position: [0, 0, 6.6], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Deep space ambient fill */}
        <ambientLight intensity={0.22} />

        {/* Sunlight directional source creating dramatic lunar terminator shadows */}
        <directionalLight
          position={[7, 2, 5]}
          intensity={2.8}
          color="#fffaf0"
          castShadow
        />

        {/* Subtle earthshine reflection on unlit limb */}
        <directionalLight
          position={[-7, -2, -3]}
          intensity={0.25}
          color="#38bdf8"
        />

        {/* Background stars */}
        <Stars
          radius={70}
          depth={40}
          count={2500}
          factor={3.5}
          saturation={0}
          fade
          speed={0.4}
        />

        {/* The 3D Moon - zoomed out neatly to sit comfortably in frame with zero harsh borders */}
        <HeroMoonMesh radius={1.58} />

        {/* Smooth Orbit Controls with damping */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          rotateSpeed={0.65}
          dampingFactor={0.05}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={(3 * Math.PI) / 4}
        />
      </Canvas>
    </div>
  );
};

export default HeroMoonCanvas;

