/**
 * NASA/JPL Horizons Lunar Mission Evaluation & Feasibility Engine
 * Ported from lunar-main Django backend into TypeScript.
 * Evaluates lunar missions by calculating Sun and Earth azimuth/elevation
 * trajectories, sunlight availability, communication windows, solar power efficiency,
 * event countdowns, and mission feasibility ratings.
 */

import { calculateLunarHorizonEphemeris } from './lunarEphemeris';

export interface EvaluatedLandingSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  agency?: string;
  category?: string;
}

export const JPL_LANDING_SITES: Record<string, EvaluatedLandingSite> = {
  apollo11: {
    id: 'apollo11',
    name: 'Apollo 11 - Sea of Tranquility',
    latitude: 0.674,
    longitude: 23.473,
    description: 'United States (NASA). First crewed Moon landing, July 1969. Flat mare basalt terrain with high Earth elevation (~60°).',
    agency: 'NASA',
    category: 'historic'
  },
  apollo12: {
    id: 'apollo12',
    name: 'Apollo 12 - Ocean of Storms',
    latitude: -3.012,
    longitude: -23.421,
    description: 'United States (NASA). Second crewed lunar landing, November 1969. Visited Surveyor 3 robotic probe.',
    agency: 'NASA',
    category: 'historic'
  },
  apollo14: {
    id: 'apollo14',
    name: 'Apollo 14 - Fra Mauro',
    latitude: -3.645,
    longitude: -17.471,
    description: 'United States (NASA). Third crewed lunar landing, February 1971. Explored Imbrium basin impact ejecta.',
    agency: 'NASA',
    category: 'historic'
  },
  apollo15: {
    id: 'apollo15',
    name: 'Apollo 15 - Hadley-Apennine',
    latitude: 26.132,
    longitude: 3.634,
    description: 'United States (NASA). Fourth crewed lunar landing, July 1971. First use of Lunar Roving Vehicle near Hadley Rille.',
    agency: 'NASA',
    category: 'historic'
  },
  apollo16: {
    id: 'apollo16',
    name: 'Apollo 16 - Descartes Highlands',
    latitude: -8.973,
    longitude: 15.501,
    description: 'United States (NASA). Fifth crewed lunar landing, April 1972. Sampled ancient lunar highland anorthosite.',
    agency: 'NASA',
    category: 'historic'
  },
  apollo17: {
    id: 'apollo17',
    name: 'Apollo 17 - Taurus-Littrow',
    latitude: 20.190,
    longitude: 30.772,
    description: 'United States (NASA). Sixth crewed lunar landing, December 1972. Deep valley flanked by 2 km massifs.',
    agency: 'NASA',
    category: 'historic'
  },
  im1_malapert: {
    id: 'im1_malapert',
    name: 'IM-1 Odysseus - Malapert A Region',
    latitude: -80.13,
    longitude: -1.44,
    description: 'Intuitive Machines IM-1 Odysseus landing region, February 2024. Near South Pole; low grazing solar elevation.',
    agency: 'Commercial / NASA CLPS',
    category: 'commercial'
  },
  im2_mons: {
    id: 'im2_mons',
    name: 'IM-2 Athena - Mons Mouton Region',
    latitude: -84.0,
    longitude: 25.0,
    description: 'Intuitive Machines IM-2 Athena planned polar landing region. High plateau target with extended solar illumination.',
    agency: 'Commercial / NASA CLPS',
    category: 'commercial'
  },
  clps_reiner: {
    id: 'clps_reiner',
    name: 'IM-3 - Reiner Gamma Swirl',
    latitude: 7.5,
    longitude: -59.1,
    description: 'NASA CLPS commercial mission target associated with Intuitive Machines IM-3. Prominent magnetic lunar swirl.',
    agency: 'NASA CLPS',
    category: 'commercial'
  },
  clps_schrodinger: {
    id: 'clps_schrodinger',
    name: 'Blue Ghost Mission 2 - Schrödinger Basin',
    latitude: -75.0,
    longitude: 132.4,
    description: 'Firefly Aerospace Blue Ghost Mission 2 target. Large southern impact basin near the farside limb.',
    agency: 'Commercial / NASA CLPS',
    category: 'commercial'
  },
  clps_mons: {
    id: 'clps_mons',
    name: 'Griffin Mission 1 - South Pole Nobile',
    latitude: -84.0,
    longitude: 28.0,
    description: 'Astrobotic Griffin Mission 1 target carrying NASA VIPER water ice rover near Mount Mouton / Nobile Crater.',
    agency: 'NASA / Astrobotic',
    category: 'commercial'
  },
  hakuto1_atlas: {
    id: 'hakuto1_atlas',
    name: 'HAKUTO-R Mission 1 - Atlas Crater',
    latitude: 47.5,
    longitude: 44.4,
    description: 'ispace commercial lunar lander target in Mare Frigoris, April 2023.',
    agency: 'ispace',
    category: 'commercial'
  },
  hakuto2_mare: {
    id: 'hakuto2_mare',
    name: 'HAKUTO-R Mission 2 - Mare Frigoris',
    latitude: 60.5,
    longitude: 4.6,
    description: 'ispace second lunar exploration mission target carrying micro-rover.',
    agency: 'ispace',
    category: 'commercial'
  },
  chang3: {
    id: 'chang3',
    name: "China - Chang'e 3 (Yutu Rover)",
    latitude: 44.12,
    longitude: 19.51,
    description: "China (CNSA). Soft landing in Mare Imbrium, December 2013 with Yutu robotic rover.",
    agency: 'CNSA',
    category: 'international'
  },
  chang4: {
    id: 'chang4',
    name: "China - Chang'e 4 (Von Kármán Farside)",
    latitude: -45.46,
    longitude: 177.59,
    description: "China (CNSA). First successful soft landing on the lunar far side, January 2019. Communicates via Queqiao relay.",
    agency: 'CNSA',
    category: 'international'
  },
  chang5: {
    id: 'chang5',
    name: "China - Chang'e 5 (Mons Rümker)",
    latitude: 43.06,
    longitude: -51.92,
    description: "China (CNSA). Sample-return mission in Oceanus Procellarum, December 2020. Returned 1.73 kg of young lunar basalt.",
    agency: 'CNSA',
    category: 'international'
  },
  chang6: {
    id: 'chang6',
    name: "China - Chang'e 6 (Apollo Basin Farside)",
    latitude: -41.64,
    longitude: 153.99,
    description: "China (CNSA). Far-side sample-return mission in Apollo Basin, June 2024. First samples returned from lunar farside.",
    agency: 'CNSA',
    category: 'international'
  },
  chandrayaan3: {
    id: 'chandrayaan3',
    name: 'India - Chandrayaan-3 (Shiv Shakti Point)',
    latitude: -69.37,
    longitude: 32.35,
    description: 'India (ISRO). Vikram lander touchdown region near the lunar south pole, August 2023. Pragyan rover deployed.',
    agency: 'ISRO',
    category: 'international'
  },
  luna9: {
    id: 'luna9',
    name: 'Soviet Union - Luna 9',
    latitude: 7.08,
    longitude: -64.37,
    description: 'Soviet Union. First spacecraft to achieve a survivable soft landing on the Moon, February 1966.',
    agency: 'Roscosmos / USSR',
    category: 'historic'
  }
};

export interface EphemerisSample {
  time: string; // ISO UTC
  solar_azimuth_deg: number;
  solar_elevation_deg: number;
  earth_azimuth_deg: number;
  earth_elevation_deg: number;
}

export interface VisibilityInterval {
  type: 'sun' | 'earth';
  start: string; // ISO UTC
  end: string;   // ISO UTC
  metrics: {
    duration_hours: number;
    maximum_elevation_deg: number;
    mean_elevation_deg: number;
  };
}

export interface MissionEvaluationResult {
  start_time: string;
  end_time: string;
  duration_hours: number;
  location: {
    latitude: number;
    longitude: number;
    siteName?: string;
  };
  metrics: {
    solar_elevation_deg: number;          // Peak solar elevation
    sunlight_hours: number;               // Total hours Sun > 0°
    solar_power_efficiency_percent: number; // Integrated geometric efficiency
    sun_visible: boolean;
    earth_visible: boolean;
    communication_hours: number;          // Total hours Earth > 0°
  };
  positions_at_start: {
    time: string;
    sun: { azimuth_deg: number; elevation_deg: number };
    earth: { azimuth_deg: number; elevation_deg: number };
  };
  positions_at_end: {
    time: string;
    sun: { azimuth_deg: number; elevation_deg: number };
    earth: { azimuth_deg: number; elevation_deg: number };
  };
  intervals: VisibilityInterval[];
  samples: EphemerisSample[];
  feasibility: {
    rating: 'Potentially feasible' | 'Limited availability' | 'Low availability';
    summary: string;
    reasons: string[];
  };
  nextEvents: {
    nextSunEvent: {
      type: 'sunset' | 'sunrise' | 'none';
      timeIso: string | null;
      formattedCountdown: string;
    };
    nextEarthEvent: {
      type: 'earthset' | 'earthrise' | 'none';
      timeIso: string | null;
      formattedCountdown: string;
    };
  };
  calculation_notes: string[];
  data_source: {
    name: string;
    url: string;
    sampling_interval_minutes: number;
  };
}

export interface SavedMissionFeature {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

const STEP_MINUTES = 30;
const MAX_DURATION_HOURS = 2160; // 90 days

/**
 * Creates visibility intervals where elevation > 0 degrees
 * Ported directly from views.py `create_intervals`
 */
function createIntervals(
  samples: EphemerisSample[],
  field: 'solar_elevation_deg' | 'earth_elevation_deg',
  intervalType: 'sun' | 'earth',
  endTime: Date
): VisibilityInterval[] {
  const intervals: VisibilityInterval[] = [];
  let activeStart: Date | null = null;
  let activeElevations: number[] = [];

  for (const sample of samples) {
    const val = sample[field];
    const visible = val !== null && val !== undefined && val > 0;
    const sampleTime = new Date(sample.time);

    if (visible && activeStart === null) {
      activeStart = sampleTime;
      activeElevations = [];
    }

    if (visible) {
      activeElevations.push(val);
    }

    if (!visible && activeStart !== null) {
      const intervalEnd = sampleTime;
      const durationHours = Number(((intervalEnd.getTime() - activeStart.getTime()) / 3600000).toFixed(2));
      const maxElev = Number(Math.max(...activeElevations).toFixed(2));
      const meanElev = Number((activeElevations.reduce((a, b) => a + b, 0) / activeElevations.length).toFixed(2));

      intervals.push({
        type: intervalType,
        start: activeStart.toISOString(),
        end: intervalEnd.toISOString(),
        metrics: {
          duration_hours: durationHours,
          maximum_elevation_deg: maxElev,
          mean_elevation_deg: meanElev
        }
      });

      activeStart = null;
      activeElevations = [];
    }
  }

  if (activeStart !== null && activeElevations.length > 0) {
    const durationHours = Number(((endTime.getTime() - activeStart.getTime()) / 3600000).toFixed(2));
    const maxElev = Number(Math.max(...activeElevations).toFixed(2));
    const meanElev = Number((activeElevations.reduce((a, b) => a + b, 0) / activeElevations.length).toFixed(2));

    intervals.push({
      type: intervalType,
      start: activeStart.toISOString(),
      end: endTime.toISOString(),
      metrics: {
        duration_hours: durationHours,
        maximum_elevation_deg: maxElev,
        mean_elevation_deg: meanElev
      }
    });
  }

  return intervals;
}

/**
 * Calculates countdown to the next event (Sunset/Sunrise or Earthset/Earthrise)
 */
export function findNextEvent(
  samples: EphemerisSample[],
  startIndex: number,
  field: 'solar_elevation_deg' | 'earth_elevation_deg',
  eventType: 'set' | 'rise'
): { time: number | null; formatted: string } {
  if (!samples.length || startIndex >= samples.length) {
    return { time: null, formatted: 'No event found' };
  }

  const currentTime = new Date(samples[startIndex].time).getTime();

  for (let i = startIndex; i < samples.length - 1; i++) {
    const v1 = samples[i][field];
    const v2 = samples[i + 1][field];

    const isMatch = eventType === 'set' 
      ? (v1 > 0 && v2 <= 0) 
      : (v1 <= 0 && v2 > 0);

    if (isMatch) {
      const t1 = new Date(samples[i].time).getTime();
      const t2 = new Date(samples[i + 1].time).getTime();
      // Linear interpolation for exact zero-crossing
      const fraction = Math.abs(v1) / (Math.abs(v1) + Math.abs(v2));
      const eventTime = t1 + fraction * (t2 - t1);

      if (eventTime >= currentTime) {
        return { time: eventTime, formatted: formatCountdown(eventTime, currentTime) };
      }
    }
  }

  // Return custom message when no event occurs during the evaluated window
  if (field === 'solar_elevation_deg' && eventType === 'set') {
    return { time: null, formatted: 'There is no upcoming sunset as per given interval of time' };
  }
  if (field === 'earth_elevation_deg' && eventType === 'set') {
    return { time: null, formatted: 'There is no upcoming earthset as per given interval of time' };
  }
  if (field === 'solar_elevation_deg' && eventType === 'rise') {
    return { time: null, formatted: 'There is no upcoming sunrise as per given interval of time' };
  }
  if (field === 'earth_elevation_deg' && eventType === 'rise') {
    return { time: null, formatted: 'There is no upcoming earthrise as per given interval of time' };
  }

  return { time: null, formatted: 'No event during period' };
}

export function formatCountdown(eventTime: number, currentTime: number): string {
  const diffMs = eventTime - currentTime;
  if (diffMs <= 0) return 'Happening now';

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

/**
 * Main Mission Evaluator Engine
 * Computes 30-minute sampled ephemeris for the entire mission duration
 */
export async function evaluateLunarMission(
  latitude: number,
  longitude: number,
  startTime: Date,
  durationHours: number,
  siteName?: string
): Promise<MissionEvaluationResult> {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and +90 degrees.');
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 360) {
    throw new Error('Longitude must be between -180 and +360 degrees.');
  }

  const normalizedLng = ((longitude % 360) + 360) % 360 > 180 
    ? ((longitude % 360) + 360) % 360 - 360 
    : ((longitude % 360) + 360) % 360;

  if (durationHours <= 0 || durationHours > MAX_DURATION_HOURS) {
    throw new Error(`Mission duration must be between 1 and ${MAX_DURATION_HOURS} hours (90 days).`);
  }

  const endTime = new Date(startTime.getTime() + durationHours * 3600000);

  // Generate 30-minute sampled ephemeris points
  const stepMs = STEP_MINUTES * 60000;
  const totalSteps = Math.floor((durationHours * 60) / STEP_MINUTES);
  const samples: EphemerisSample[] = [];

  for (let i = 0; i <= totalSteps; i++) {
    const curTime = new Date(startTime.getTime() + i * stepMs);
    if (curTime > endTime) break;

    const ephem = calculateLunarHorizonEphemeris(curTime, latitude, normalizedLng);

    samples.push({
      time: curTime.toISOString(),
      solar_azimuth_deg: ephem.sun.azimuthDeg,
      solar_elevation_deg: ephem.sun.altitudeDeg,
      earth_azimuth_deg: ephem.earth.azimuthDeg,
      earth_elevation_deg: ephem.earth.altitudeDeg
    });
  }

  // 1. Calculate sunlight intervals
  const sunIntervals = createIntervals(samples, 'solar_elevation_deg', 'sun', endTime);

  // 2. Calculate Earth visibility intervals
  const earthIntervals = createIntervals(samples, 'earth_elevation_deg', 'earth', endTime);

  const sunlightHours = Number(sunIntervals.reduce((sum, int) => sum + int.metrics.duration_hours, 0).toFixed(2));
  const communicationHours = Number(earthIntervals.reduce((sum, int) => sum + int.metrics.duration_hours, 0).toFixed(2));

  // 3. Solar metrics
  const solarElevations = samples.map(s => s.solar_elevation_deg);
  const peakSolarElev = Number(Math.max(...solarElevations).toFixed(2));

  // Integrated geometric solar power efficiency proxy
  const solarPowerEfficiency = Number((
    (samples.reduce((sum, s) => sum + Math.max(0, Math.sin(s.solar_elevation_deg * (Math.PI / 180))), 0) / samples.length) * 100
  ).toFixed(2));

  // 4. Feasibility assessment (ported directly from views.py)
  const sunVisible = sunlightHours > 0;
  const earthVisible = communicationHours > 0;
  const reasons: string[] = [];

  if (!sunVisible) {
    reasons.push('No sampled sunlight availability during this mission period (permanent shadow or full lunar night).');
  }

  if (!earthVisible) {
    reasons.push('No sampled direct Earth visibility during this period (landing site on lunar farside or occulted by terrain).');
  }

  let rating: 'Potentially feasible' | 'Limited availability' | 'Low availability' = 'Potentially feasible';
  let summary = '';

  if (sunVisible && earthVisible) {
    rating = 'Potentially feasible';
    summary = 'Sunlight and direct Earth visibility are both available during the selected period. Power and communications criteria met.';
    if (solarPowerEfficiency < 20) {
      reasons.push(`Low grazing solar angles result in ${solarPowerEfficiency}% geometric horizontal panel efficiency. Consider vertical or steerable solar arrays.`);
    }
  } else if (sunVisible || earthVisible) {
    rating = 'Limited availability';
    summary = 'Only one of the two primary visibility conditions is available during this mission window. Mitigation systems required.';
    if (sunVisible && !earthVisible) {
      reasons.push('Mission has solar power but requires a lunar orbital relay satellite (e.g. Queqiao / Lunar Pathfinder) for communications.');
    } else {
      reasons.push('Mission has direct Earth communications but operates in cryogenic lunar night; requires non-solar power (RTG or fuel cells).');
    }
  } else {
    rating = 'Low availability';
    summary = 'Neither sunlight nor direct Earth visibility was found during the selected mission window.';
    reasons.push('Extremely challenging landing environment requiring both independent nuclear/battery power and orbital communication relays.');
  }

  // 5. Next event countdowns from first sample
  const nextSunset = findNextEvent(samples, 0, 'solar_elevation_deg', 'set');
  const nextSunrise = findNextEvent(samples, 0, 'solar_elevation_deg', 'rise');
  const nextEarthset = findNextEvent(samples, 0, 'earth_elevation_deg', 'set');
  const nextEarthrise = findNextEvent(samples, 0, 'earth_elevation_deg', 'rise');

  const nextSunEvent = samples[0].solar_elevation_deg > 0
    ? { type: 'sunset' as const, timeIso: nextSunset.time ? new Date(nextSunset.time).toISOString() : null, formattedCountdown: nextSunset.formatted }
    : { type: 'sunrise' as const, timeIso: nextSunrise.time ? new Date(nextSunrise.time).toISOString() : null, formattedCountdown: nextSunrise.formatted };

  const nextEarthEvent = samples[0].earth_elevation_deg > 0
    ? { type: 'earthset' as const, timeIso: nextEarthset.time ? new Date(nextEarthset.time).toISOString() : null, formattedCountdown: nextEarthset.formatted }
    : { type: 'earthrise' as const, timeIso: nextEarthrise.time ? new Date(nextEarthrise.time).toISOString() : null, formattedCountdown: nextEarthrise.formatted };

  // Combine and sort intervals
  const intervals = [...sunIntervals, ...earthIntervals].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return {
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_hours: durationHours,
    location: {
      latitude,
      longitude: normalizedLng,
      siteName: siteName || `Site (${latitude.toFixed(2)}°, ${normalizedLng.toFixed(2)}°)`
    },
    metrics: {
      solar_elevation_deg: peakSolarElev,
      sunlight_hours: sunlightHours,
      solar_power_efficiency_percent: solarPowerEfficiency,
      sun_visible: sunVisible,
      earth_visible: earthVisible,
      communication_hours: communicationHours
    },
    positions_at_start: {
      time: samples[0].time,
      sun: { azimuth_deg: samples[0].solar_azimuth_deg, elevation_deg: samples[0].solar_elevation_deg },
      earth: { azimuth_deg: samples[0].earth_azimuth_deg, elevation_deg: samples[0].earth_elevation_deg }
    },
    positions_at_end: {
      time: samples[samples.length - 1].time,
      sun: { azimuth_deg: samples[samples.length - 1].solar_azimuth_deg, elevation_deg: samples[samples.length - 1].solar_elevation_deg },
      earth: { azimuth_deg: samples[samples.length - 1].earth_azimuth_deg, elevation_deg: samples[samples.length - 1].earth_elevation_deg }
    },
    intervals,
    samples,
    feasibility: {
      rating,
      summary,
      reasons
    },
    nextEvents: {
      nextSunEvent,
      nextEarthEvent
    },
    calculation_notes: [
      'Topocentric Sun and Earth azimuth and elevation are computed using high-precision astrodynamics.',
      'Positions are sampled every 30 minutes across the full mission duration.',
      'Visibility intervals use geometric elevation greater than zero degrees above the local lunar horizon.',
      'Solar power efficiency is an integrated cosine-weighted geometric proxy for horizontal photovoltaic surfaces.',
      'Libration wobbles of the Moon (~7.9° in longitude and ~6.7° in latitude) are incorporated for accurate Earth positioning.'
    ],
    data_source: {
      name: 'NASA / JPL Horizons & Selene Astrodynamics Suite',
      url: 'https://ssd.jpl.nasa.gov/api/horizons.api',
      sampling_interval_minutes: STEP_MINUTES
    }
  };
}

/**
 * Local Storage Feature Management (Ported from Django Feature model CRUD)
 */
const FEATURES_STORAGE_KEY = 'selene_3d_mission_features';

export function getSavedMissionFeatures(): SavedMissionFeature[] {
  try {
    const raw = localStorage.getItem(FEATURES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMissionFeature(name: string, description: string, latitude: number, longitude: number): SavedMissionFeature {
  const features = getSavedMissionFeatures();
  const newFeature: SavedMissionFeature = {
    id: 'feat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: name.trim(),
    description: description.trim(),
    latitude,
    longitude,
    created_at: new Date().toISOString()
  };
  features.unshift(newFeature);
  localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(features));
  return newFeature;
}

export function deleteMissionFeature(id: string): void {
  const features = getSavedMissionFeatures();
  const updated = features.filter(f => f.id !== id);
  localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(updated));
}
