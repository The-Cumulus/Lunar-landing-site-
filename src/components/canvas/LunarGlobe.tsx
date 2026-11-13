import React, { useMemo, useEffect, useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BasemapType, LunarCoordinateHover, TerrainFilterConfig } from '../../types/lunar';
import { MapLayerId } from '../../utils/nasaWmtsLoader';
import { LunarTextureManager } from '../../utils/textureLoader';
import { vector3ToLatLng } from '../../utils/coordinates';
import { LunarAtmosphere } from './LunarAtmosphere';
import { LunarDEMService } from '../../utils/demAnalysis';
import { TerrainMaterialManager } from './TerrainShaderMaterial';

interface LunarGlobeProps {
  radius?: number;
  basemap: BasemapType;
  terrainConfig?: TerrainFilterConfig;
  sunAngle?: number;
  enableSunShade?: boolean;
  bumpScale?: number;
  customTexture?: THREE.Texture | null;
  customBumpTexture?: THREE.Texture | null;
  mapLayerId?: MapLayerId;
  onHoverCoordinate?: (coord: LunarCoordinateHover | null) => void;
  onClickCoordinate?: (coord: { lat: number; lng: number }) => void;
}

export const LunarGlobe: React.FC<LunarGlobeProps> = ({
  radius = 2.0,
  basemap,
  terrainConfig,
  sunAngle = 35,
  enableSunShade = true,
  bumpScale = 0.05,
  customTexture = null,
  customBumpTexture = null,
  mapLayerId = 'default',
  onHoverCoordinate,
  onClickCoordinate
}) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Initialize scientific LOLA DEM dataset for instant hover point queries
  useEffect(() => {
    LunarDEMService.getInstance().init();
  }, []);

  // Standard NASA photographic textures or custom stitched WMTS tile texture
  const activeTexture = useMemo(() => {
    if (customTexture) {
      return customTexture;
    }
    return LunarTextureManager.getTexture(basemap);
  }, [basemap, customTexture]);

  const defaultBumpTexture = useMemo(() => {
    return LunarTextureManager.getBumpTexture();
  }, []);

  const activeBumpTexture = useMemo(() => {
    if (customBumpTexture) {
      return customBumpTexture;
    }
    return defaultBumpTexture;
  }, [customBumpTexture, defaultBumpTexture]);

  // Ensure Moon sphere's material.map, material.bumpMap, and needsUpdate are updated
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.map = activeTexture;
      materialRef.current.bumpMap = activeBumpTexture || null;
      materialRef.current.bumpScale = bumpScale;
      materialRef.current.needsUpdate = true;
    }
  }, [activeTexture, activeBumpTexture, bumpScale]);

  // Sun position vector for terrain hillshade / lighting
  const sunPosition = useMemo(() => {
    const rad = (sunAngle * Math.PI) / 180;
    const distance = 25;
    return new THREE.Vector3(
      Math.cos(rad) * distance,
      Math.sin(rad * 0.5) * 1.5,
      Math.sin(rad) * distance
    );
  }, [sunAngle]);

  const isTerrainAnalysisActive = Boolean(terrainConfig && terrainConfig.mode !== 'none') && (!customTexture || mapLayerId === 'default');

  const terrainMaterial = useMemo(() => {
    if (!isTerrainAnalysisActive || !terrainConfig) return null;
    return TerrainMaterialManager.getMaterial(terrainConfig, sunPosition, enableSunShade);
  }, [isTerrainAnalysisActive, terrainConfig, sunPosition, enableSunShade]);

  // Raycast hover tracking with exact LOLA elevation in meters
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!e.point || !onHoverCoordinate) return;

    const { lat, lng } = vector3ToLatLng(e.point);
    const analysis = LunarDEMService.getInstance().getPointAnalysis(lat, lng);

    onHoverCoordinate({
      lat,
      lng,
      elevationMeters: analysis?.elevationMeters,
      elevationApprox: analysis?.elevationMeters,
      slopeDeg: analysis?.slopeDeg,
      roughnessM: analysis?.roughnessM,
      terrainClass: analysis?.elevationCategoryName
    });
  };

  const handlePointerOut = () => {
    if (onHoverCoordinate) {
      onHoverCoordinate(null);
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!e.point || !onClickCoordinate) return;
    const { lat, lng } = vector3ToLatLng(e.point);
    onClickCoordinate({ lat, lng });
  };

  return (
    <group>
      {/* 3D High-Res Moon Sphere with dynamic Terrain Analysis Shader or Photographic Basemap */}
      <mesh
        castShadow
        receiveShadow
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[radius, 128, 128]} />
        {isTerrainAnalysisActive && terrainMaterial ? (
          <primitive object={terrainMaterial} attach="material" />
        ) : (
          <meshStandardMaterial
            ref={materialRef}
            map={activeTexture}
            bumpMap={activeBumpTexture || undefined}
            bumpScale={bumpScale}
            roughness={basemap === 'natural' ? 0.92 : 0.82}
            metalness={0.02}
          />
        )}
      </mesh>

      {/* Atmospheric limb scatter glow */}
      <LunarAtmosphere radius={radius * 1.008} />
    </group>
  );
};
