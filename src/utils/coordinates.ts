import * as THREE from 'three';

/**
 * Converts Lunar Latitude and Longitude to 3D Cartesian coordinates (X, Y, Z).
 * Matches Three.js standard SphereGeometry UV projection:
 * - Latitude: -90° (South Pole) to +90° (North Pole)
 * - Longitude: -180° to +180° (0° = Prime Meridian at center of equirectangular texture)
 * - Radius: Radius of the sphere (default: 2)
 */
export function latLngToVector3(lat: number, lng: number, radius: number = 2): THREE.Vector3 {
  // Normalize longitude to [-180, 180]
  let normalizedLng = ((lng + 180) % 360 + 360) % 360 - 180;
  // Clamp latitude to [-90, 90]
  const clampedLat = Math.max(-90, Math.min(90, lat));

  // Equirectangular mapping parameters
  const u = (normalizedLng + 180) / 360;
  const v = (90 - clampedLat) / 180;

  const phi = v * Math.PI; // Polar angle from +Y [0 to PI]
  const theta = u * Math.PI * 2; // Azimuthal angle [0 to 2PI]

  // Three.js SphereGeometry parametric equation
  const x = -radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(theta) * Math.sin(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts a 3D Cartesian coordinate on the sphere back to Lunar (Latitude, Longitude).
 */
export function vector3ToLatLng(point: THREE.Vector3 | [number, number, number]): { lat: number; lng: number } {
  const x = Array.isArray(point) ? point[0] : point.x;
  const y = Array.isArray(point) ? point[1] : point.y;
  const z = Array.isArray(point) ? point[2] : point.z;

  const r = Math.sqrt(x * x + y * y + z * z);
  if (r === 0) return { lat: 0, lng: 0 };

  // Polar angle phi from +Y
  const cosPhi = Math.max(-1, Math.min(1, y / r));
  const phi = Math.acos(cosPhi);
  const v = phi / Math.PI;
  const lat = 90 - v * 180;

  // Azimuthal angle theta around Y
  let theta = Math.atan2(z, -x);
  if (theta < 0) {
    theta += 2 * Math.PI;
  }
  const u = theta / (2 * Math.PI);
  let lng = u * 360 - 180;

  // Handle precision edge cases
  if (lat > 89.999) return { lat: 90, lng: 0 };
  if (lat < -89.999) return { lat: -90, lng: 0 };

  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4))
  };
}

/**
 * Format decimal degrees to standard degrees, minutes, seconds string (e.g. 0°40'26" N, 23°28'22" E)
 */
export function formatCoordinatesDMS(lat: number, lng: number): string {
  const formatComponent = (val: number, posLabel: string, negLabel: string) => {
    const dir = val >= 0 ? posLabel : negLabel;
    const absVal = Math.abs(val);
    const degrees = Math.floor(absVal);
    const minutesFloat = (absVal - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = Math.round((minutesFloat - minutes) * 60);
    return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}" ${dir}`;
  };

  return `${formatComponent(lat, 'N', 'S')}, ${formatComponent(lng, 'E', 'W')}`;
}

/**
 * Format decimal degrees cleanly (e.g. +0.6740°, +23.4729°)
 */
export function formatCoordinatesDecimal(lat: number, lng: number): string {
  const latStr = (lat >= 0 ? '+' : '') + lat.toFixed(4) + '°';
  const lngStr = (lng >= 0 ? '+' : '') + lng.toFixed(4) + '°';
  return `${latStr}, ${lngStr}`;
}

/**
 * Great-circle angular distance on the Moon in kilometers (Moon radius = 1737.4 km)
 */
export function calculateLunarDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 1737.4; // Lunar mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Robustly parses various user coordinate inputs into { lat, lng } numbers:
 * Supports:
 * - Decimal: "0.6740, 23.4730" or "-89.5, 120.3" or "+10.5 -45.2"
 * - Directional Decimal: "89.5 S, 120.3 E" or "89.5°S, 120.3°E"
 * - Standard DMS: "0°40'26" N, 23°28'22" E"
 * - Keywords: "lat: -85.3, lng: 45.2"
 */
export function parseCoordinatesString(input: string): { lat: number; lng: number } | null {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim();
  if (!cleaned) return null;

  // 1. Try standard DMS format: e.g. 0°40'26" N, 23°28'22" E
  const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*([NSns])\s*[,/;\s]+\s*(\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*([EWew])/;
  const dmsMatch = cleaned.match(dmsRegex);
  if (dmsMatch) {
    const d1 = parseFloat(dmsMatch[1]), m1 = parseFloat(dmsMatch[2]), s1 = parseFloat(dmsMatch[3]), dir1 = dmsMatch[4].toUpperCase();
    const d2 = parseFloat(dmsMatch[5]), m2 = parseFloat(dmsMatch[6]), s2 = parseFloat(dmsMatch[7]), dir2 = dmsMatch[8].toUpperCase();
    let lat = d1 + m1 / 60 + s1 / 3600;
    if (dir1 === 'S') lat = -lat;
    let lng = d2 + m2 / 60 + s2 / 3600;
    if (dir2 === 'W') lng = -lng;
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) };
    }
  }

  // 2. Try decimal with directional letters: e.g. "89.5 S, 120.3 E" or "89.5S 120.3E" or "89.5°S, 120.3°E"
  const dirDecimalRegex = /([-+]?\d+(?:\.\d+)?)\s*°?\s*([NSns])\s*[,/;\s]+\s*([-+]?\d+(?:\.\d+)?)\s*°?\s*([EWew])/;
  const dirMatch = cleaned.match(dirDecimalRegex);
  if (dirMatch) {
    let lat = parseFloat(dirMatch[1]);
    const dirLat = dirMatch[2].toUpperCase();
    if (dirLat === 'S') lat = -Math.abs(lat);
    if (dirLat === 'N') lat = Math.abs(lat);

    let lng = parseFloat(dirMatch[3]);
    const dirLng = dirMatch[4].toUpperCase();
    if (dirLng === 'W') lng = -Math.abs(lng);
    if (dirLng === 'E') lng = Math.abs(lng);

    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) };
    }
  }

  // 3. Try lat/lng keywords: e.g. "lat: -85.3, lng: 45.2" or "lat -85.3 lon 45.2"
  const keywordRegex = /lat(?:itude)?[:\s]+([-+]?\d+(?:\.\d+)?)[°\s]*[,/;\s]+l(?:o?ng|ongitude)?[:\s]+([-+]?\d+(?:\.\d+)?)/i;
  const kwMatch = cleaned.match(keywordRegex);
  if (kwMatch) {
    const lat = parseFloat(kwMatch[1]);
    const lng = parseFloat(kwMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) };
    }
  }

  // 4. Try two plain numbers separated by comma, semicolon, slash, or whitespace:
  // e.g. "-85.33, 45.9" or "0.674 23.473" or "+0.6740°, +23.4729°"
  const cleanedNumbers = cleaned.replace(/[°]/g, '').trim();
  const twoNumbersMatch = cleanedNumbers.match(/^([-+]?\d+(?:\.\d+)?)[,\s/;\t]+([-+]?\d+(?:\.\d+)?)$/);
  if (twoNumbersMatch) {
    const lat = parseFloat(twoNumbersMatch[1]);
    const lng = parseFloat(twoNumbersMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) };
    }
  }

  return null;
}

