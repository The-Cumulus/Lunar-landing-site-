import React, { useMemo } from 'react';
import * as THREE from 'three';
import { latLngToVector3 } from '../../utils/coordinates';

interface CoordinateGraticuleProps {
  radius?: number;
  visible?: boolean;
}

export const CoordinateGraticule: React.FC<CoordinateGraticuleProps> = ({
  radius = 2.008,
  visible = true
}) => {
  const { latitudeGeom, equatorGeom, longitudeGeom, primeMeridianGeom } = useMemo(() => {
    const latPoints: THREE.Vector3[] = [];
    const equatorPoints: THREE.Vector3[] = [];
    const lonPoints: THREE.Vector3[] = [];
    const primeMeridianPoints: THREE.Vector3[] = [];

    // 1. Latitude Parallels: Every 20 degrees from -80° to +80°
    // Latitude line color: Dark Red (#b91c1c / #dc2626)
    const lats = [-80, -60, -40, -20, 0, 20, 40, 60, 80];
    const lngStep = 2; // sample resolution in degrees

    lats.forEach(lat => {
      const isEquator = lat === 0;
      const target = isEquator ? equatorPoints : latPoints;

      for (let lng = -180; lng < 180; lng += lngStep) {
        const nextLng = lng + lngStep;
        const p1 = latLngToVector3(lat, lng, radius);
        const p2 = latLngToVector3(lat, nextLng, radius);
        target.push(p1, p2);
      }
    });

    // 2. Longitude Meridians: Every 30 degrees from -180° to 180°
    // Longitude line color: Green (#16a34a / #22c55e)
    const latStep = 2;
    for (let lng = -180; lng < 180; lng += 30) {
      const isPrime = lng === 0;
      const target = isPrime ? primeMeridianPoints : lonPoints;

      for (let lat = -90; lat < 90; lat += latStep) {
        const nextLat = lat + latStep;
        const p1 = latLngToVector3(lat, lng, radius);
        const p2 = latLngToVector3(nextLat, lng, radius);
        target.push(p1, p2);
      }
    }

    const latitudeGeom = new THREE.BufferGeometry().setFromPoints(latPoints);
    const equatorGeom = new THREE.BufferGeometry().setFromPoints(equatorPoints);
    const longitudeGeom = new THREE.BufferGeometry().setFromPoints(lonPoints);
    const primeMeridianGeom = new THREE.BufferGeometry().setFromPoints(primeMeridianPoints);

    return { latitudeGeom, equatorGeom, longitudeGeom, primeMeridianGeom };
  }, [radius]);

  if (!visible) return null;

  return (
    <group>
      {/* 1. Latitude Parallels: Dark Red (#dc2626 / #b91c1c) with high contrast */}
      <lineSegments geometry={latitudeGeom}>
        <lineBasicMaterial
          color="#b91c1c"
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </lineSegments>

      {/* 2. Lunar Equator (0° Latitude): Solid Accent Red (#ef4444) */}
      <lineSegments geometry={equatorGeom}>
        <lineBasicMaterial
          color="#ef4444"
          transparent
          opacity={1.0}
          depthWrite={false}
        />
      </lineSegments>

      {/* 3. Longitude Meridians: Bold, Deep Dark Green (#15803d / #16a34a) */}
      <lineSegments geometry={longitudeGeom}>
        <lineBasicMaterial
          color="#15803d"
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </lineSegments>

      {/* 4. Prime Meridian (0° Longitude): Solid Distinct Green (#22c55e) */}
      <lineSegments geometry={primeMeridianGeom}>
        <lineBasicMaterial
          color="#22c55e"
          transparent
          opacity={1.0}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
};
