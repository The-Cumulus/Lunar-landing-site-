/**
 * High-Precision Lunar Ephemeris & Horizon Position Engine
 * Based on Jean Meeus, Astronomical Algorithms 2nd ed. (Chapter 53: Physical Ephemeris of the Moon)
 * Computes exact topocentric altitude (elevation above local horizon) and azimuth for the Sun and Earth
 * from any selenographic coordinate on the Moon at any UTC date and time.
 */

export interface HorizonCoordinates {
  altitudeDeg: number;       // Elevation above local horizon: >0 is above horizon, <0 is below
  azimuthDeg: number;        // Compass bearing: 0° N, 90° E, 180° S, 270° W
  zenithDistanceDeg: number; // Angular distance from zenith (90° - altitude)
  isVisible: boolean;        // True if altitudeDeg >= 0 (or >= -0.26° for Sun upper limb)
}

export interface SolarTelemetry extends HorizonCoordinates {
  illuminationState: 'daylight' | 'grazing' | 'night';
  solarFluxWm2: number;       // Photovoltaic irradiance (W/m^2)
  shadowLengthFactor: number; // Shadow length per unit height (1 / tan(alt))
  subSolarPoint: { lat: number; lng: number };
}

export interface EarthTelemetry extends HorizonCoordinates {
  commStatus: 'direct-line-of-sight' | 'horizon-marginal' | 'occulted-farside';
  commStatusLabel: string;
  earthPhaseName: string;
  earthIlluminatedPct: number; // 0 to 100%
  angularDiameterDeg: number;  // ~1.9° as seen from the Moon
  subEarthPoint: { lat: number; lng: number }; // Lunar libration coordinates
}

export interface LunarEphemerisResult {
  date: Date;
  observerLat: number;
  observerLng: number;
  sun: SolarTelemetry;
  earth: EarthTelemetry;
  separationDeg: number; // Angular separation between Sun and Earth in the lunar sky
}

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/**
 * Normalizes an angle in degrees to [0, 360)
 */
function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Normalizes an angle in degrees to [-180, +180)
 */
function normalize180(deg: number): number {
  const norm = normalizeDeg(deg);
  return norm > 180 ? norm - 360 : norm;
}

/**
 * Computes the topocentric horizon altitude and azimuth of a celestial body
 * given the observer's lunar coordinates and the body's selenographic sub-point.
 */
function computeAltAz(
  obsLat: number,
  obsLng: number,
  targetLat: number,
  targetLng: number
): { altitudeDeg: number; azimuthDeg: number; zenithDistanceDeg: number } {
  const phi = obsLat * RAD;
  const lam = obsLng * RAD;
  const phi0 = targetLat * RAD;
  const lam0 = targetLng * RAD;

  const cosZ = Math.sin(phi) * Math.sin(phi0) + Math.cos(phi) * Math.cos(phi0) * Math.cos(lam0 - lam);
  const clampedCosZ = Math.max(-1, Math.min(1, cosZ));
  const zRad = Math.acos(clampedCosZ);
  const zDeg = zRad * DEG;
  const altitudeDeg = 90 - zDeg;

  const y = Math.sin(lam0 - lam) * Math.cos(phi0);
  const x = Math.cos(phi) * Math.sin(phi0) - Math.sin(phi) * Math.cos(phi0) * Math.cos(lam0 - lam);
  let azimuthDeg = Math.atan2(y, x) * DEG;
  azimuthDeg = normalizeDeg(azimuthDeg);

  return { altitudeDeg, azimuthDeg, zenithDistanceDeg: zDeg };
}

/**
 * Calculates complete Lunar Ephemeris for Sun and Earth relative to local horizon
 */
export function calculateLunarHorizonEphemeris(
  date: Date,
  observerLat: number,
  observerLng: number
): LunarEphemerisResult {
  // Julian Date and Julian Centuries from J2000.0
  const JD = date.getTime() / 86400000 + 2440587.5;
  const T = (JD - 2451545.0) / 36525;

  // Fundamental astronomical arguments (Meeus Ch 47 & 53)
  const Lp = (218.3164477 + 481267.88123421 * T - 0.0015786 * T * T) * RAD;
  const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) * RAD;
  const M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) * RAD;
  const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) * RAD;
  const F = (93.2720950 + 483202.0175233 * T - 0.0036539 * T * T) * RAD;

  // Sun ecliptic longitude
  const L = (280.46646 + 36000.76983 * T) * RAD;
  const sunEclipticLong = L + (1.9146 - 0.004817 * T) * RAD * Math.sin(M) + 0.019993 * RAD * Math.sin(2 * M);

  // Moon ecliptic longitude & latitude
  const moonEclipticLong = Lp + 6.289 * RAD * Math.sin(Mp) - 1.274 * RAD * Math.sin(Mp - 2 * D) + 0.658 * RAD * Math.sin(2 * D);
  const moonEclipticLat = 5.128 * RAD * Math.sin(F);

  // Inclination of lunar equator to ecliptic: I = 1.54242 degrees
  const I = 1.54242 * RAD;
  const node = (125.04452 - 1934.136261 * T) * RAD;

  // Optical libration in longitude l' and latitude b' (Sub-Earth point on lunar globe)
  const W = moonEclipticLong - node;
  const sinA = Math.sin(W) * Math.cos(moonEclipticLat) * Math.cos(I) - Math.sin(moonEclipticLat) * Math.sin(I);
  const cosA = Math.cos(W) * Math.cos(moonEclipticLat);
  const A = Math.atan2(sinA, cosA);
  const rawLibL = (A - F) * DEG;
  const subEarthLng = normalize180(rawLibL);
  const subEarthLat = Math.asin(Math.max(-1, Math.min(1, -Math.sin(W) * Math.cos(moonEclipticLat) * Math.sin(I) - Math.sin(moonEclipticLat) * Math.cos(I)))) * DEG;

  // Sub-solar point on lunar globe
  const W_sun = sunEclipticLong - node;
  const sinA_sun = Math.sin(W_sun) * Math.cos(I);
  const cosA_sun = Math.cos(W_sun);
  const A_sun = Math.atan2(sinA_sun, cosA_sun);
  const rawSubSunLng = (A_sun - F) * DEG + 180;
  const subSunLng = normalize180(rawSubSunLng);
  const subSunLat = Math.asin(Math.max(-1, Math.min(1, -Math.sin(W_sun) * Math.sin(I)))) * DEG;

  // 1. Sun Horizon Telemetry
  const sunAltAz = computeAltAz(observerLat, observerLng, subSunLat, subSunLng);
  const sunAlt = sunAltAz.altitudeDeg;
  const sunIsVisible = sunAlt >= -0.26; // Sun radius is ~0.26°

  let illuminationState: 'daylight' | 'grazing' | 'night' = 'daylight';
  if (sunAlt < -0.26) {
    illuminationState = 'night';
  } else if (sunAlt <= 3.0) {
    illuminationState = 'grazing';
  }

  // Solar flux in W/m^2 (solar constant at 1 AU is ~1361 W/m^2)
  const solarFluxWm2 = sunAlt > 0 ? Math.round(1361 * Math.sin(sunAlt * RAD)) : 0;
  const shadowLengthFactor = sunAlt > 0.1 ? Number((1 / Math.tan(sunAlt * RAD)).toFixed(1)) : 999.0;

  const sunTelemetry: SolarTelemetry = {
    altitudeDeg: Number(sunAlt.toFixed(2)),
    azimuthDeg: Number(sunAltAz.azimuthDeg.toFixed(2)),
    zenithDistanceDeg: Number(sunAltAz.zenithDistanceDeg.toFixed(2)),
    isVisible: sunIsVisible,
    illuminationState,
    solarFluxWm2,
    shadowLengthFactor,
    subSolarPoint: {
      lat: Number(subSunLat.toFixed(2)),
      lng: Number(subSunLng.toFixed(2))
    }
  };

  // 2. Earth Horizon Telemetry
  const earthAltAz = computeAltAz(observerLat, observerLng, subEarthLat, subEarthLng);
  const earthAlt = earthAltAz.altitudeDeg;
  const earthIsVisible = earthAlt >= 0;

  let commStatus: 'direct-line-of-sight' | 'horizon-marginal' | 'occulted-farside' = 'direct-line-of-sight';
  let commStatusLabel = 'Direct Line-of-Sight Active (High-bandwidth DTE)';

  if (earthAlt < 0) {
    commStatus = 'occulted-farside';
    commStatusLabel = 'Occulted by Lunar Body (Relay Satellite Required)';
  } else if (earthAlt < 5.0) {
    commStatus = 'horizon-marginal';
    commStatusLabel = 'Horizon Marginal (Terrain Multipath / Grazing Risk)';
  }

  // Angular separation between Sun and Earth from observer
  const cosSeparation = Math.sin(sunAlt * RAD) * Math.sin(earthAlt * RAD) +
    Math.cos(sunAlt * RAD) * Math.cos(earthAlt * RAD) * Math.cos((sunAltAz.azimuthDeg - earthAltAz.azimuthDeg) * RAD);
  const separationDeg = Math.acos(Math.max(-1, Math.min(1, cosSeparation))) * DEG;

  // Earth phase as seen from the Moon
  // Earth phase angle is supplementary to the Sun-Moon-Earth angle
  const earthPhaseAngle = 180 - separationDeg;
  const earthIlluminatedPct = Math.round(((1 + Math.cos(earthPhaseAngle * RAD)) / 2) * 100);

  let earthPhaseName = 'Gibbous Earth';
  if (earthIlluminatedPct >= 96) earthPhaseName = 'Full Earth (Brilliant Earthshine)';
  else if (earthIlluminatedPct <= 4) earthPhaseName = 'New Earth';
  else if (earthIlluminatedPct > 50) earthPhaseName = 'Waxing/Waning Gibbous Earth';
  else if (earthIlluminatedPct === 50) earthPhaseName = 'Quarter Earth';
  else earthPhaseName = 'Crescent Earth';

  const earthTelemetry: EarthTelemetry = {
    altitudeDeg: Number(earthAlt.toFixed(2)),
    azimuthDeg: Number(earthAltAz.azimuthDeg.toFixed(2)),
    zenithDistanceDeg: Number(earthAltAz.zenithDistanceDeg.toFixed(2)),
    isVisible: earthIsVisible,
    commStatus,
    commStatusLabel,
    earthPhaseName,
    earthIlluminatedPct,
    angularDiameterDeg: 1.9, // Earth is ~3.7x larger than the Moon appears from Earth
    subEarthPoint: {
      lat: Number(subEarthLat.toFixed(2)),
      lng: Number(subEarthLng.toFixed(2))
    }
  };

  return {
    date,
    observerLat,
    observerLng,
    sun: sunTelemetry,
    earth: earthTelemetry,
    separationDeg: Number(separationDeg.toFixed(2))
  };
}

/**
 * Curated Historical & Future Mission Presets
 */
export interface HorizonPreset {
  id: string;
  name: string;
  mission: string;
  dateIso: string;
  lat: number;
  lng: number;
  description: string;
}

export const LUNAR_HORIZON_PRESETS: HorizonPreset[] = [
  {
    id: 'apollo11',
    name: 'Apollo 11 Tranquility Base',
    mission: 'NASA Apollo Program',
    dateIso: '1969-07-20T20:17:40Z',
    lat: 0.674,
    lng: 23.473,
    description: 'First crewed lunar landing. Sun placed at a low 14° morning altitude for crater shadow contrast.'
  },
  {
    id: 'apollo17',
    name: 'Apollo 17 Taurus-Littrow',
    mission: 'NASA Apollo Program',
    dateIso: '1972-12-11T19:54:57Z',
    lat: 20.19,
    lng: 30.77,
    description: 'Final Apollo landing in deep valley surrounded by 2 km massifs with Earth hanging high overhead at 59°.'
  },
  {
    id: 'chandrayaan3',
    name: 'Chandrayaan-3 Shiv Shakti Point',
    mission: 'ISRO Chandrayaan Program',
    dateIso: '2023-08-23T12:34:00Z',
    lat: -69.37,
    lng: 32.32,
    description: 'Historic high-latitude southern landing. Sun hovering at low 7° altitude casting dramatic long shadows.'
  },
  {
    id: 'artemis3',
    name: 'Artemis III Shackleton Rim',
    mission: 'NASA Artemis Program',
    dateIso: '2026-09-15T00:00:00Z',
    lat: -89.54,
    lng: 0.0,
    description: 'Lunar South Pole target. Sun grazes rim continuously at ~1.5° while Earth skims the horizon at 1.8°.'
  },
  {
    id: 'change4',
    name: "Chang'e 4 Von Kármán (Farside)",
    mission: 'CNSA Lunar Exploration',
    dateIso: '2019-01-03T02:26:00Z',
    lat: -45.46,
    lng: 177.59,
    description: 'First landing on lunar farside. Earth is permanently occulted below horizon; Queqiao relay used.'
  }
];
