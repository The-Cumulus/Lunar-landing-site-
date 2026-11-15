/**
 * Selenographic Coordinates & Clipboard Utilities
 * Supports decimal, DMS, and GeoJSON formats with robust clipboard copy fallback.
 */

export function formatCoordinatesDecimal(lat: number, lng: number, precision: number = 5): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

export function formatCoordinatesDecorated(lat: number, lng: number, precision: number = 5): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(precision)}° ${latDir}, ${Math.abs(lng).toFixed(precision)}° ${lngDir}`;
}

export function degToDms(deg: number, isLat: boolean): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = ((minFloat - m) * 60).toFixed(1);
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
  return `${d}° ${m}' ${s}" ${dir}`;
}

export function formatCoordinatesDMS(lat: number, lng: number): string {
  return `${degToDms(lat, true)}, ${degToDms(lng, false)}`;
}

export function formatCoordinatesGeoJSON(lat: number, lng: number, precision: number = 5): string {
  // GeoJSON uses [longitude, latitude]
  return `[${lng.toFixed(precision)}, ${lat.toFixed(precision)}]`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Try modern navigator.clipboard
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard write failed, using fallback:', err);
    }
  }

  // 2. Fallback: DOM textarea copy
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('[Clipboard] execCommand fallback failed:', err);
    return false;
  }
}

/**
 * Reads text from system clipboard with graceful failure handling.
 */
export async function readFromClipboard(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (navigator?.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard.readText failed or permission denied:', err);
    }
  }
  return null;
}

/**
 * Robustly parses Selenographic Coordinates from various clipboard formats:
 * - Decimal: "0.6740, 23.4730" or "+0.67408, -23.47297"
 * - GeoJSON: "[23.47297, 0.67408]" (longitude first)
 * - Directional: "0.67408° N, 23.47297° E" or "23.47297° E, 0.67408° N"
 * - DMS: "0° 40' 26.7\" N, 23° 28' 22.7\" E"
 * - Labeled: "LAT: 0.6740, LON: 23.4730" or "Lon: 23.4730, Lat: 0.6740"
 * - JSON: {"lat": 0.6740, "lng": 23.4730}
 */
export function parseCoordinatesFromClipboard(input: string): { lat: number; lng: number } | null {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();

  // 1. JSON object format: { lat, lng } or { latitude, longitude }
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const obj = JSON.parse(raw);
      const lat = obj.lat ?? obj.latitude;
      const lng = obj.lng ?? obj.lon ?? obj.longitude;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        return {
          lat: Math.max(-90, Math.min(90, lat)),
          lng: Math.max(-180, Math.min(180, lng))
        };
      }
    } catch {}
  }

  // 2. GeoJSON format: [longitude, latitude]
  const geojsonMatch = raw.match(/^\[\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\]$/);
  if (geojsonMatch) {
    const lng = parseFloat(geojsonMatch[1]);
    const lat = parseFloat(geojsonMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat: Math.max(-90, Math.min(90, lat)),
        lng: Math.max(-180, Math.min(180, lng))
      };
    }
  }

  // 3. DMS format: e.g. 0° 40' 26.7" N, 23° 28' 22.7" E
  const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)"?\s*([NSEW])/gi;
  const dmsMatches = [...raw.matchAll(dmsRegex)];
  if (dmsMatches.length === 2) {
    let lat: number | null = null;
    let lng: number | null = null;
    for (const m of dmsMatches) {
      const deg = parseFloat(m[1]) + parseFloat(m[2]) / 60 + parseFloat(m[3]) / 3600;
      const dir = m[4].toUpperCase();
      const val = (dir === 'S' || dir === 'W') ? -deg : deg;
      if (dir === 'N' || dir === 'S') lat = val;
      if (dir === 'E' || dir === 'W') lng = val;
    }
    if (lat !== null && lng !== null) {
      return {
        lat: Math.max(-90, Math.min(90, lat)),
        lng: Math.max(-180, Math.min(180, lng))
      };
    }
  }

  // 4. Explicitly labeled string with 'lat' and 'lon'/'lng'
  const latLabelMatch = raw.match(/lat(?:itude)?[:=\s]+([-+]?\d*\.?\d+)\s*([NS])?/i);
  const lonLabelMatch = raw.match(/l(?:on|ng)(?:gitude)?[:=\s]+([-+]?\d*\.?\d+)\s*([EW])?/i);
  if (latLabelMatch && lonLabelMatch) {
    let lat = parseFloat(latLabelMatch[1]);
    if (latLabelMatch[2]?.toUpperCase() === 'S') lat = -Math.abs(lat);
    let lng = parseFloat(lonLabelMatch[1]);
    if (lonLabelMatch[2]?.toUpperCase() === 'W') lng = -Math.abs(lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat: Math.max(-90, Math.min(90, lat)),
        lng: Math.max(-180, Math.min(180, lng))
      };
    }
  }

  // 5. Directional decimal: e.g. 0.67408° N, 23.47297° E or 23.47297° E, 0.67408° N
  const dirMatches = [...raw.matchAll(/([-+]?\d*\.?\d+)\s*°?\s*([NSEW])/gi)];
  if (dirMatches.length === 2) {
    let lat: number | null = null;
    let lng: number | null = null;
    for (const m of dirMatches) {
      const num = parseFloat(m[1]);
      const dir = m[2].toUpperCase();
      const val = (dir === 'S' || dir === 'W') ? -Math.abs(num) : Math.abs(num);
      if (dir === 'N' || dir === 'S') lat = val;
      if (dir === 'E' || dir === 'W') lng = val;
    }
    if (lat !== null && lng !== null) {
      return {
        lat: Math.max(-90, Math.min(90, lat)),
        lng: Math.max(-180, Math.min(180, lng))
      };
    }
  }

  // 6. Generic two numbers separated by comma, slash, space, etc.
  const nums = raw.match(/[-+]?\d*\.?\d+/g);
  if (nums && nums.length >= 2) {
    const n1 = parseFloat(nums[0]);
    const n2 = parseFloat(nums[1]);
    if (!isNaN(n1) && !isNaN(n2)) {
      // If one number is out of [-90, 90], it MUST be longitude
      if (Math.abs(n1) > 90 && Math.abs(n2) <= 90) {
        return {
          lat: Math.max(-90, Math.min(90, n2)),
          lng: Math.max(-180, Math.min(180, n1))
        };
      }
      if (Math.abs(n2) > 90 && Math.abs(n1) <= 90) {
        return {
          lat: Math.max(-90, Math.min(90, n1)),
          lng: Math.max(-180, Math.min(180, n2))
        };
      }
      // If both <= 90: default to [lat, lng]
      return {
        lat: Math.max(-90, Math.min(90, n1)),
        lng: Math.max(-180, Math.min(180, n2))
      };
    }
  }

  return null;
}
