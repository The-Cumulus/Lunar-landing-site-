import { LunarDEMService, LOLA_DEM_CONFIG } from './demAnalysis';
import { LUNAR_LANDMARKS, LUNAR_POIS } from '../data/lunarPOIs';
import { calculateLunarDistanceKm, formatCoordinatesDecimal, formatCoordinatesDMS } from './coordinates';

export interface SiteInput {
  name: string;
  lat: number;
  lng: number;
}

export interface ParameterComparison {
  parameterId: string;
  title: string;
  category: 'environment' | 'topography' | 'mission' | 'science';
  plainEnglishMeaning: string;
  site1Value: string;
  site1Detail: string;
  site1Score: number; // 0 to 100 for visual bar
  site2Value: string;
  site2Detail: string;
  site2Score: number; // 0 to 100 for visual bar
  betterSite: 'site1' | 'site2' | 'tie' | 'contextual';
  advantageReason: string;
}

export interface ResourceItem {
  id: string; // 'water' | 'he3' | 'co' | 'co2' | 'ch4' | 'nh3' | 'h2s' | 'si' | 'fe' | 'al' | 'tio2'
  name: string;
  formula: string;
  subCategory: 'volatile' | 'metal' | 'mineral';
  abundanceDisplay: string;
  abundanceNumeric: number;
  unit: string;
  score: number; // 0 to 100
  isruRole: string;
  scientificContext: string;
}

export interface ResourceComparison {
  resourceId: string;
  name: string;
  formula: string;
  subCategory: 'volatile' | 'metal' | 'mineral';
  plainEnglishMeaning: string;
  site1Value: string;
  site1Detail: string;
  site1Score: number;
  site2Value: string;
  site2Detail: string;
  site2Score: number;
  betterSite: 'site1' | 'site2' | 'tie' | 'contextual';
  advantageReason: string;
  isruApplication: string;
}

export interface SiteScientificProfile {
  name: string;
  lat: number;
  lng: number;
  formattedDecimal: string;
  formattedDMS: string;
  nearestLandmark: { name: string; distanceKm: number };
  nearestMission: { name: string; distanceKm: number };
  hemisphereLat: 'North' | 'South' | 'Equatorial';
  hemisphereLng: 'Nearside' | 'Farside' | 'Limb';
  
  // 1. Sunlight Availability
  sunlight: {
    illuminationPercent: number;
    regime: string;
    solarZenithMinDeg: number;
    maxSolarFluxWm2: number;
    description: string;
  };

  // 2. Earth Communication
  earthComms: {
    directLineOfSight: boolean;
    earthElevationDeg: number;
    visibilityPercent: number;
    relayRequired: boolean;
    description: string;
  };

  // 3. Terrain Elevation
  elevation: {
    elevationMeters: number;
    geomorphicClass: string;
    description: string;
  };

  // 4. Slope Analysis
  slope: {
    slopeDeg: number;
    hazardTier: 'Safe (< 5°)' | 'Moderate (5°–10°)' | 'Steep (10°–15°)' | 'High Hazard (> 15°)';
    landingFeasibility: string;
  };

  // 5. Crater Density & Hazards
  craterDensity: {
    densityRating: 'Low (Mare Basalt)' | 'Moderate (Intermediate Plain)' | 'High (Highland Saturation)';
    roughnessM: number;
    hazardDescription: string;
  };

  // 6. Temperature Conditions
  temperature: {
    maxKelvin: number;
    minKelvin: number;
    maxCelsius: number;
    minCelsius: number;
    diurnalSwingK: number;
    description: string;
  };

  // 7. Landing Suitability
  landingSuitability: {
    score: number; // 0 to 100
    rating: 'Optimal / High Feasibility' | 'Favorable / Minor Hazard' | 'Challenging / HDA Required' | 'Restricted / High Risk';
    rationale: string;
  };

  // 8. Scientific Exploration Potential
  sciencePotential: {
    score: number; // 0 to 100
    primaryThemes: string[];
    description: string;
  };

  // 9. In-Situ Lunar Resources (11 Key Materials)
  resources: ResourceItem[];
}

export interface ComparisonReport {
  site1: SiteScientificProfile;
  site2: SiteScientificProfile;
  distanceKm: number;
  distancePercentMoonCircumference: number;
  parameters: ParameterComparison[];
  resources: ResourceComparison[];
  comparativeSummary: {
    overview: string;
    site1KeyAdvantage: string;
    site2KeyAdvantage: string;
    missionRecommendation: string;
    isruSummary: string;
  };
}

/**
 * Calculates in-situ abundance for the 11 lunar resources based on real selenological data:
 * Water, He-3, CO, CO2, CH4, NH3, H2S, Si, Fe, Al, TiO2
 */
function computeSiteResources(lat: number, lng: number, elevationMeters: number): ResourceItem[] {
  const absLat = Math.abs(lat);
  const absLng = Math.abs(lng);

  const isPolar = absLat >= 80;
  const isDeepColdTrap = isPolar && elevationMeters < -2000;
  const isPolarRim = isPolar && elevationMeters >= -500;
  const isMare = elevationMeters <= 0 && absLat < 65;
  const isHighland = elevationMeters > 0 || absLat >= 65;
  
  // High-Ti maria: Mare Tranquillitatis & Oceanus Procellarum / Mare Imbrium
  const isHighTiMare = isMare && (
    (lng >= 15 && lng <= 45 && lat >= 0 && lat <= 20) || // Tranquillitatis
    (lng >= -70 && lng <= -40 && lat >= 5 && lat <= 30)   // Oceanus Procellarum
  );

  const resources: ResourceItem[] = [];

  // 1. Water (H2O)
  if (isDeepColdTrap) {
    resources.push({
      id: 'water',
      name: 'Water Ice & Hydroxyl',
      formula: 'H₂O',
      subCategory: 'volatile',
      abundanceDisplay: '5.5 wt% (55,000 ppm)',
      abundanceNumeric: 5.5,
      unit: 'wt%',
      score: 95,
      isruRole: 'Rocket Propellant (LH₂ / LOX), Habitat Life-Support & Potable Water',
      scientificContext: 'LCROSS and LAMP spectroscopic detection: ~5.5 ± 1.5 wt% water equivalent preserved in permanent cold trap.'
    });
  } else if (isPolarRim) {
    resources.push({
      id: 'water',
      name: 'Water Ice & Hydroxyl',
      formula: 'H₂O',
      subCategory: 'volatile',
      abundanceDisplay: '0.35 wt% (3,500 ppm)',
      abundanceNumeric: 0.35,
      unit: 'wt%',
      score: 42,
      isruRole: 'Secondary Ice Feedstock from shadowed micro-craters',
      scientificContext: 'Polar frost accumulation and shallow sub-surface pore ice.'
    });
  } else if (absLat >= 65) {
    resources.push({
      id: 'water',
      name: 'Water Ice & Hydroxyl',
      formula: 'H₂O',
      subCategory: 'volatile',
      abundanceDisplay: '450 ppm (0.045 wt%)',
      abundanceNumeric: 0.045,
      unit: 'ppm',
      score: 16,
      isruRole: 'Adsorbed Hydration Extraction via thermal bake-out',
      scientificContext: 'Sub-polar hydroxyl adsorbed onto lunar regolith grain rims.'
    });
  } else {
    resources.push({
      id: 'water',
      name: 'Water Ice & Hydroxyl',
      formula: 'H₂O',
      subCategory: 'volatile',
      abundanceDisplay: '60 ppm (0.006 wt%)',
      abundanceNumeric: 0.006,
      unit: 'ppm',
      score: 5,
      isruRole: 'Minimal Extraction Viability (Trace hydroxyl only)',
      scientificContext: 'Equatorial baseline: trace solar wind proton implantation into silicate glasses.'
    });
  }

  // 2. Helium-3 (He-3)
  if (isHighTiMare) {
    resources.push({
      id: 'he3',
      name: 'Helium-3 (Fusion Fuel)',
      formula: '³He',
      subCategory: 'volatile',
      abundanceDisplay: '16.5 ppb',
      abundanceNumeric: 16.5,
      unit: 'ppb',
      score: 95,
      isruRole: 'Aneutronic Clean Nuclear Fusion Fuel (D-³He Cycle)',
      scientificContext: 'High-Ti ilmenite mineral lattice exhibits maximum solar wind retention on mature mare soils.'
    });
  } else if (isMare) {
    resources.push({
      id: 'he3',
      name: 'Helium-3 (Fusion Fuel)',
      formula: '³He',
      subCategory: 'volatile',
      abundanceDisplay: '8.2 ppb',
      abundanceNumeric: 8.2,
      unit: 'ppb',
      score: 58,
      isruRole: 'Medium-Grade Fusion Resource Extraction',
      scientificContext: 'Moderate ilmenite trapping in typical basaltic maria.'
    });
  } else {
    resources.push({
      id: 'he3',
      name: 'Helium-3 (Fusion Fuel)',
      formula: '³He',
      subCategory: 'volatile',
      abundanceDisplay: '2.8 ppb',
      abundanceNumeric: 2.8,
      unit: 'ppb',
      score: 22,
      isruRole: 'Low Extraction Yield (Non-economic)',
      scientificContext: 'Feldspathic anorthosite regolith has minimal capacity for solar wind helium retention.'
    });
  }

  // 3. Carbon Monoxide (CO)
  if (isDeepColdTrap) {
    resources.push({
      id: 'co',
      name: 'Carbon Monoxide',
      formula: 'CO',
      subCategory: 'volatile',
      abundanceDisplay: '0.31 wt% (3,100 ppm)',
      abundanceNumeric: 0.31,
      unit: 'wt%',
      score: 90,
      isruRole: 'Hydrocarbon Fuel Synthesis & Carbonyl Metallurgy',
      scientificContext: 'LCROSS impact plume detected ~5.7% CO relative to water ice in permanent shadow.'
    });
  } else if (isPolarRim) {
    resources.push({
      id: 'co',
      name: 'Carbon Monoxide',
      formula: 'CO',
      subCategory: 'volatile',
      abundanceDisplay: '110 ppm (0.011 wt%)',
      abundanceNumeric: 0.011,
      unit: 'ppm',
      score: 18,
      isruRole: 'Trace Carbon Feedstock',
      scientificContext: 'Micro-cold-trap seasonal deposits.'
    });
  } else {
    resources.push({
      id: 'co',
      name: 'Carbon Monoxide',
      formula: 'CO',
      subCategory: 'volatile',
      abundanceDisplay: '< 1 ppm (Data unavailable/Negligible)',
      abundanceNumeric: 0,
      unit: 'ppm',
      score: 0,
      isruRole: 'Unavailable in sunlit regolith (Thermal sublimation at 25 K)',
      scientificContext: 'Equatorial and mid-latitude surface temperatures completely volatilize CO into space.'
    });
  }

  // 4. Carbon Dioxide (CO2)
  if (isDeepColdTrap) {
    resources.push({
      id: 'co2',
      name: 'Carbon Dioxide',
      formula: 'CO₂',
      subCategory: 'volatile',
      abundanceDisplay: '1.19 wt% (11,900 ppm)',
      abundanceNumeric: 1.19,
      unit: 'wt%',
      score: 95,
      isruRole: 'Greenhouse CELSS Food Production & Sabatier Methane Fuel',
      scientificContext: 'LCROSS measured 21.7% CO₂ relative to water. Second most abundant volatile in lunar cold traps.'
    });
  } else if (isPolarRim) {
    resources.push({
      id: 'co2',
      name: 'Carbon Dioxide',
      formula: 'CO₂',
      subCategory: 'volatile',
      abundanceDisplay: '320 ppm (0.032 wt%)',
      abundanceNumeric: 0.032,
      unit: 'ppm',
      score: 22,
      isruRole: 'Sub-surface Carbon Extraction',
      scientificContext: 'Shallow sub-surface thermal protection in polar depressions.'
    });
  } else {
    resources.push({
      id: 'co2',
      name: 'Carbon Dioxide',
      formula: 'CO₂',
      subCategory: 'volatile',
      abundanceDisplay: '< 2 ppm (Data unavailable/Negligible)',
      abundanceNumeric: 0,
      unit: 'ppm',
      score: 0,
      isruRole: 'Unavailable in sunlit regolith (Sublimation threshold ~60 K)',
      scientificContext: 'Ambient daylight temperatures vaporize CO₂ completely.'
    });
  }

  // 5. Methane (CH4)
  if (isDeepColdTrap) {
    resources.push({
      id: 'ch4',
      name: 'Methane',
      formula: 'CH₄',
      subCategory: 'volatile',
      abundanceDisplay: '0.036 wt% (360 ppm)',
      abundanceNumeric: 0.036,
      unit: 'wt%',
      score: 85,
      isruRole: 'Direct Cryogenic Rocket Fuel (Methalox Engines)',
      scientificContext: 'LCROSS detected 0.65% CH₄ relative to water. Cryo-trapped hydrocarbon volatile.'
    });
  } else {
    resources.push({
      id: 'ch4',
      name: 'Methane',
      formula: 'CH₄',
      subCategory: 'volatile',
      abundanceDisplay: '< 1 ppm (Data unavailable/Negligible)',
      abundanceNumeric: 0,
      unit: 'ppm',
      score: 0,
      isruRole: 'Non-existent in ambient daylight (Sublimation ~30 K)',
      scientificContext: 'Requires cryogenic temperatures below 30 K to condense.'
    });
  }

  // 6. Ammonia (NH3)
  if (isDeepColdTrap) {
    resources.push({
      id: 'nh3',
      name: 'Ammonia',
      formula: 'NH₃',
      subCategory: 'volatile',
      abundanceDisplay: '0.33 wt% (3,300 ppm)',
      abundanceNumeric: 0.33,
      unit: 'wt%',
      score: 92,
      isruRole: 'Agricultural Nitrogen Fertilizer & Habitat Buffer Gas (N₂)',
      scientificContext: 'LCROSS detected ~6.0% NH₃ relative to water. Essential fixed nitrogen reservoir.'
    });
  } else if (isPolarRim) {
    resources.push({
      id: 'nh3',
      name: 'Ammonia',
      formula: 'NH₃',
      subCategory: 'volatile',
      abundanceDisplay: '85 ppm (0.008 wt%)',
      abundanceNumeric: 0.008,
      unit: 'ppm',
      score: 15,
      isruRole: 'Micro-trap Ammonia Traces',
      scientificContext: 'Trace nitrogen in shadowed polar fissures.'
    });
  } else {
    resources.push({
      id: 'nh3',
      name: 'Ammonia',
      formula: 'NH₃',
      subCategory: 'volatile',
      abundanceDisplay: '< 1 ppm (Data unavailable/Negligible)',
      abundanceNumeric: 0,
      unit: 'ppm',
      score: 0,
      isruRole: 'Unavailable outside cryogenic traps (Sublimation at 78 K)',
      scientificContext: 'Lunar surface daytime heating drives off ammonia completely.'
    });
  }

  // 7. Hydrogen Sulfide (H2S)
  if (isDeepColdTrap) {
    resources.push({
      id: 'h2s',
      name: 'Hydrogen Sulfide',
      formula: 'H₂S',
      subCategory: 'volatile',
      abundanceDisplay: '0.088 wt% (880 ppm)',
      abundanceNumeric: 0.088,
      unit: 'wt%',
      score: 80,
      isruRole: 'Anhydrous Lunar Sulfur-Concrete & Chemical Reagents',
      scientificContext: 'LCROSS detected 1.6% H₂S relative to water. Volatile sulfur trap.'
    });
  } else {
    resources.push({
      id: 'h2s',
      name: 'Hydrogen Sulfide',
      formula: 'H₂S',
      subCategory: 'volatile',
      abundanceDisplay: '< 1 ppm (Data unavailable/Negligible)',
      abundanceNumeric: 0,
      unit: 'ppm',
      score: 0,
      isruRole: 'Unavailable in sunlit regolith (Sublimation at 68 K)',
      scientificContext: 'Condenses exclusively in extreme cryogenic environments.'
    });
  }

  // 8. Silicon (Si)
  if (isHighland) {
    resources.push({
      id: 'si',
      name: 'Silicon (Silica)',
      formula: 'Si / SiO₂',
      subCategory: 'mineral',
      abundanceDisplay: '21.4 wt% Si (45.8 wt% SiO₂)',
      abundanceNumeric: 21.4,
      unit: 'wt%',
      score: 88,
      isruRole: 'Photovoltaic Solar Cells, Semiconductor Wafers & Optical Fibers',
      scientificContext: 'Ubiquitous framework element of highland plagioclase feldspar and pyroxenes.'
    });
  } else {
    resources.push({
      id: 'si',
      name: 'Silicon (Silica)',
      formula: 'Si / SiO₂',
      subCategory: 'mineral',
      abundanceDisplay: '20.5 wt% Si (43.9 wt% SiO₂)',
      abundanceNumeric: 20.5,
      unit: 'wt%',
      score: 85,
      isruRole: 'Solar Panel Glass & Sintered Structural Regolith Blocks',
      scientificContext: 'Universal silicate mineral constituent in mare basalt pyroxene and olivine.'
    });
  }

  // 9. Iron (Fe)
  if (isHighTiMare) {
    resources.push({
      id: 'fe',
      name: 'Iron (Iron Oxide)',
      formula: 'Fe / FeO',
      subCategory: 'metal',
      abundanceDisplay: '16.8 wt% Fe (21.6 wt% FeO)',
      abundanceNumeric: 16.8,
      unit: 'wt%',
      score: 96,
      isruRole: 'Structural Steel, Magnetic Beneficiation & Regolith 3D Printing',
      scientificContext: 'High-iron basalt with abundant ilmenite and pyroxene. Readily magnetically extractable.'
    });
  } else if (isMare) {
    resources.push({
      id: 'fe',
      name: 'Iron (Iron Oxide)',
      formula: 'Fe / FeO',
      subCategory: 'metal',
      abundanceDisplay: '14.2 wt% Fe (18.2 wt% FeO)',
      abundanceNumeric: 14.2,
      unit: 'wt%',
      score: 82,
      isruRole: 'Industrial Metal Smelting & Electrical Structural Frames',
      scientificContext: 'Standard lunar mare basalt rich in iron-bearing silicates.'
    });
  } else {
    resources.push({
      id: 'fe',
      name: 'Iron (Iron Oxide)',
      formula: 'Fe / FeO',
      subCategory: 'metal',
      abundanceDisplay: '4.2 wt% Fe (5.4 wt% FeO)',
      abundanceNumeric: 4.2,
      unit: 'wt%',
      score: 28,
      isruRole: 'Low Iron Yield (Feldspathic anorthosite depletion)',
      scientificContext: 'Highland crust is predominantly anorthositic plagioclase; iron is scarce.'
    });
  }

  // 10. Aluminum (Al)
  if (isHighland) {
    resources.push({
      id: 'al',
      name: 'Aluminum (Alumina)',
      formula: 'Al / Al₂O₃',
      subCategory: 'metal',
      abundanceDisplay: '15.8 wt% Al (29.8 wt% Al₂O₃)',
      abundanceNumeric: 15.8,
      unit: 'wt%',
      score: 95,
      isruRole: 'Aerospace Structural Alloys, Electrical Wiring & Thermal Reflectors',
      scientificContext: 'Highland crust is ancient primordial anorthosite (CaAl₂Si₂O₈); aluminum is highly enriched.'
    });
  } else {
    resources.push({
      id: 'al',
      name: 'Aluminum (Alumina)',
      formula: 'Al / Al₂O₃',
      subCategory: 'metal',
      abundanceDisplay: '6.5 wt% Al (12.3 wt% Al₂O₃)',
      abundanceNumeric: 6.5,
      unit: 'wt%',
      score: 42,
      isruRole: 'Secondary Aluminum Yield from Basaltic Feldspar',
      scientificContext: 'Moderate aluminum abundance in mare basalt plagioclase.'
    });
  }

  // 11. Titanium Dioxide (TiO2)
  if (isHighTiMare) {
    resources.push({
      id: 'tio2',
      name: 'Titanium Dioxide (Ilmenite)',
      formula: 'TiO₂ / FeTiO₃',
      subCategory: 'mineral',
      abundanceDisplay: '10.5 wt% TiO₂',
      abundanceNumeric: 10.5,
      unit: 'wt%',
      score: 98,
      isruRole: 'Oxygen Extraction (Carbothermal/Hydrogen Reduction) & Titanium Metal',
      scientificContext: 'High-Ti mare basalts (Tranquillitatis/Procellarum). Heating with H₂ produces water and oxygen.'
    });
  } else if (isMare) {
    resources.push({
      id: 'tio2',
      name: 'Titanium Dioxide (Ilmenite)',
      formula: 'TiO₂ / FeTiO₃',
      subCategory: 'mineral',
      abundanceDisplay: '3.6 wt% TiO₂',
      abundanceNumeric: 3.6,
      unit: 'wt%',
      score: 52,
      isruRole: 'Medium Yield Oxygen Feedstock via Ilmenite Reduction',
      scientificContext: 'Standard lunar mare basalt with moderate ilmenite fraction.'
    });
  } else {
    resources.push({
      id: 'tio2',
      name: 'Titanium Dioxide (Ilmenite)',
      formula: 'TiO₂ / FeTiO₃',
      subCategory: 'mineral',
      abundanceDisplay: '0.6 wt% TiO₂',
      abundanceNumeric: 0.6,
      unit: 'wt%',
      score: 10,
      isruRole: 'Low Extraction Yield (Titanium-poor crust)',
      scientificContext: 'Highland anorthosite has virtually no ilmenite mineral fraction.'
    });
  }

  return resources;
}

/**
 * Evaluates full scientific profile for a given lunar location using authentic LOLA datasets & lunar physics.
 */
export function analyzeLunarSite(site: SiteInput): SiteScientificProfile {
  const lat = Math.max(-90, Math.min(90, site.lat));
  const lng = ((site.lng + 180) % 360 + 360) % 360 - 180;
  const absLat = Math.abs(lat);
  const absLng = Math.abs(lng);

  // 1. Retrieve real NASA LOLA DEM analysis
  const demService = LunarDEMService.getInstance();
  const dem = demService.getPointAnalysis(lat, lng);

  const elevationMeters = dem ? dem.elevationMeters : 0;
  const slopeDeg = dem ? dem.slopeDeg : 4.5;
  const roughnessM = dem ? dem.roughnessM : 25.0;
  const geomorphicClass = dem ? dem.elevationCategoryName : (elevationMeters > 0 ? 'Highland Massif' : 'Maria Basalts');

  // Nearest landmark
  let nearestLandmark = { name: 'Lunar Highland Regolith', distanceKm: 9999 };
  for (const lm of LUNAR_LANDMARKS) {
    const dist = calculateLunarDistanceKm(lat, lng, lm.lat, lm.lng);
    if (dist < nearestLandmark.distanceKm) {
      nearestLandmark = { name: lm.name, distanceKm: dist };
    }
  }

  // Nearest known mission / POI
  let nearestMission = { name: 'Apollo 11', distanceKm: 9999 };
  for (const p of LUNAR_POIS) {
    const dist = calculateLunarDistanceKm(lat, lng, p.lat, p.lng);
    if (dist < nearestMission.distanceKm) {
      nearestMission = { name: p.name, distanceKm: dist };
    }
  }

  // Hemispheres
  const hemisphereLat: 'North' | 'South' | 'Equatorial' = absLat < 5 ? 'Equatorial' : lat > 0 ? 'North' : 'South';
  const hemisphereLng: 'Nearside' | 'Farside' | 'Limb' = absLng <= 80 ? 'Nearside' : absLng <= 95 ? 'Limb' : 'Farside';

  // ================= 1. SUNLIGHT AVAILABILITY =================
  let illuminationPercent = 50.0;
  let sunlightRegime = '14.75 Earth-Day Synodic Cycle';
  let solarZenithMinDeg = absLat; // Sun elevation at noon = 90 - absLat
  let maxSolarFluxWm2 = Math.round(1361 * Math.cos((absLat * Math.PI) / 180));
  let sunlightDesc = 'Equatorial/mid-latitude diurnal cycle: ~354 hours of direct solar insolation followed by ~354 hours of night.';

  if (absLat >= 85) {
    solarZenithMinDeg = 88.5; // grazing horizon Sun (within 1.54° axial tilt)
    if (elevationMeters > -500) {
      illuminationPercent = Math.min(88, Math.round(72 + (elevationMeters / 3000) * 16));
      sunlightRegime = 'Quasi-Continuous Polar Illumination';
      maxSolarFluxWm2 = 250;
      sunlightDesc = 'Elevated polar crater rim / peak: receives 70%–88% continuous sunlight annually. Peak of eternal light candidate.';
    } else if (elevationMeters < -2500) {
      illuminationPercent = Math.max(0, Math.round(4 - (absLat - 85)));
      sunlightRegime = 'Permanently Shadowed Region (PSR)';
      maxSolarFluxWm2 = 0;
      sunlightDesc = 'Deep polar depression: direct sunlight is permanently blocked by surrounding rim walls. Cryogenic cold trap.';
    } else {
      illuminationPercent = 42;
      sunlightRegime = 'Low-Incidence Grazing Illumination';
      maxSolarFluxWm2 = 180;
      sunlightDesc = 'Polar undulating terrain with elongated shadows and seasonal grazing solar angles.';
    }
  } else if (absLat >= 70) {
    illuminationPercent = 50;
    sunlightRegime = 'High-Latitude Oblique Cycle';
    sunlightDesc = 'High-latitude diurnal cycle with low solar elevation (< 20°) casting prominent crater wall shadows.';
  }

  // ================= 2. EARTH COMMUNICATION =================
  const sinEarthElev = Math.cos((lat * Math.PI) / 180) * Math.cos((lng * Math.PI) / 180);
  const earthElevationDeg = Number((Math.asin(Math.max(-1, Math.min(1, sinEarthElev))) * (180 / Math.PI)).toFixed(1));
  const directLineOfSight = earthElevationDeg > -1.5;
  const relayRequired = earthElevationDeg < 2.0;

  let visibilityPercent = 0;
  let commsDesc = '';

  if (earthElevationDeg >= 15) {
    visibilityPercent = 100;
    commsDesc = `Direct line-of-sight to Earth at +${earthElevationDeg}° elevation. Continuous, unobstructed 24/7 DTE link without relay.`;
  } else if (earthElevationDeg > 0) {
    visibilityPercent = Math.round(75 + (earthElevationDeg / 15) * 25);
    commsDesc = `Low-horizon Earth visibility (+${earthElevationDeg}°). Subject to periodic occultation during lunar optical libration cycles.`;
  } else if (earthElevationDeg >= -8) {
    visibilityPercent = 20;
    commsDesc = `Limb boundary zone (${earthElevationDeg}°). Earth rises and sets over the 27.3-day libration cycle. Dedicated relay recommended.`;
  } else {
    visibilityPercent = 0;
    commsDesc = `Far-side location (${earthElevationDeg}°). Complete Earth occultation. Requires dedicated lunar orbital relay constellation (e.g. Queqiao-2).`;
  }

  // ================= 3. ELEVATION & TOPOGRAPHY =================
  let elevDesc = '';
  if (elevationMeters <= -5000) {
    elevDesc = `Deep impact basin floor (${elevationMeters.toLocaleString()} m). Among the deepest geological depressions on the Moon.`;
  } else if (elevationMeters <= 0) {
    elevDesc = `Volcanic mare plain (${elevationMeters.toLocaleString()} m). Extensive basaltic flood plains with moderate cratering.`;
  } else if (elevationMeters <= 3000) {
    elevDesc = `Highland massif elevation (+${elevationMeters.toLocaleString()} m). Ancient feldspathic anorthosite crust.`;
  } else {
    elevDesc = `Prominent mountain peak (+${elevationMeters.toLocaleString()} m). Towering topography offering expansive surface line-of-sight.`;
  }

  // ================= 4. SLOPE ANALYSIS =================
  let hazardTier: 'Safe (< 5°)' | 'Moderate (5°–10°)' | 'Steep (10°–15°)' | 'High Hazard (> 15°)' = 'Safe (< 5°)';
  let landingFeasibility = 'Nominal slope within Apollo & Artemis LM design thresholds (< 10°). Low tip-over hazard.';

  if (slopeDeg > 15) {
    hazardTier = 'High Hazard (> 15°)';
    landingFeasibility = 'Severe inclination. Exceeds standard lander landing gear safety limits. Substantial tip-over risk.';
  } else if (slopeDeg > 10) {
    hazardTier = 'Steep (10°–15°)';
    landingFeasibility = 'Elevated terrain slope. Requires precision autonomous Hazard Detection and Avoidance (HDA) guidance.';
  } else if (slopeDeg > 5) {
    hazardTier = 'Moderate (5°–10°)';
    landingFeasibility = 'Moderate slope. Acceptable for advanced robotic landers with terrain-relative navigation (TRN).';
  }

  // ================= 5. CRATER DENSITY & ROUGHNESS =================
  let densityRating: 'Low (Mare Basalt)' | 'Moderate (Intermediate Plain)' | 'High (Highland Saturation)' = 'Low (Mare Basalt)';
  let hazardDesc = '';

  if (elevationMeters > 500 || absLat > 75) {
    densityRating = 'High (Highland Saturation)';
    hazardDesc = `Crater-saturated ancient highlands (N(1) > 0.1 km⁻²). Surface covered by thick regolith breccia, small boulders, and secondary impact craters. Local RMS roughness is ${roughnessM} m.`;
  } else if (elevationMeters < -2000) {
    densityRating = 'Low (Mare Basalt)';
    hazardDesc = `Smooth volcanic mare plain with low impact crater frequency (N(1) ~ 0.01 km⁻²). Minimal large block hazards. Local RMS roughness is ${roughnessM} m.`;
  } else {
    densityRating = 'Moderate (Intermediate Plain)';
    hazardDesc = `Intermediate transition terrain with moderate impact crater density. Local RMS roughness is ${roughnessM} m.`;
  }

  // ================= 6. TEMPERATURE CONDITIONS (Diviner Climatology) =================
  let maxK = 390;
  let minK = 95;
  let tempDesc = '';

  if (absLat >= 85) {
    if (elevationMeters < -2000) {
      maxK = 65;
      minK = 38;
      tempDesc = 'Permanently shadowed cryogenic trap: 38 K to 65 K (-235°C to -208°C). Cold enough to preserve water ice and volatile organics for billions of years.';
    } else {
      maxK = 220;
      minK = 80;
      tempDesc = 'Polar rim environment: peak daytime ~220 K (-53°C), nighttime dips to ~80 K (-193°C). Substantially milder thermal swing than lunar equator.';
    }
  } else if (absLat >= 65) {
    maxK = 280;
    minK = 90;
    tempDesc = 'High-latitude range: 90 K to 280 K (-183°C to +7°C). Reduced peak solar heating due to oblique insolation.';
  } else {
    maxK = 390;
    minK = 100;
    tempDesc = 'Equatorial/mid-latitude range: extreme thermal swing from 100 K (-173°C) during the 14-day night to 390 K (+117°C) at lunar noon.';
  }

  const maxC = maxK - 273;
  const minC = minK - 273;
  const diurnalSwingK = maxK - minK;

  // ================= 7. LANDING SUITABILITY RATING =================
  const slopeScore = Math.max(0, 100 - (slopeDeg / 15) * 100);
  const roughnessScore = Math.max(0, 100 - (roughnessM / 90) * 100);
  const commsScore = visibilityPercent;
  const illumScore = illuminationPercent;

  const totalLandingScore = Math.round(
    slopeScore * 0.35 +
    roughnessScore * 0.25 +
    commsScore * 0.20 +
    illumScore * 0.20
  );

  let suitabilityRating: 'Optimal / High Feasibility' | 'Favorable / Minor Hazard' | 'Challenging / HDA Required' | 'Restricted / High Risk' = 'Optimal / High Feasibility';
  let suitabilityRationale = '';

  if (totalLandingScore >= 80) {
    suitabilityRating = 'Optimal / High Feasibility';
    suitabilityRationale = 'Broad, gently sloping terrain with reliable Earth line-of-sight and low block hazard density. Highly favorable for crewed or robotic landings.';
  } else if (totalLandingScore >= 65) {
    suitabilityRating = 'Favorable / Minor Hazard';
    suitabilityRationale = 'Favorable landing conditions with moderate slope or roughness. Safely navigable using flight-proven TRN algorithms.';
  } else if (totalLandingScore >= 45) {
    suitabilityRating = 'Challenging / HDA Required';
    suitabilityRationale = 'Challenging terrain (steep slopes, high roughness, or communication relay constraints). Requires autonomous precision hazard detection.';
  } else {
    suitabilityRating = 'Restricted / High Risk';
    suitabilityRationale = 'Restricted site with severe engineering penalties (extreme slopes > 15°, high block hazard, or zero Earth line-of-sight).';
  }

  // ================= 8. SCIENTIFIC POTENTIAL =================
  const themes: string[] = [];
  let scienceScore = 50;

  if (absLat >= 80) {
    themes.push('Volatile & Water Ice Cold Traps (ISRU)');
    themes.push('Deep Solar System Hydrogen Inventory');
    scienceScore += 35;
  }
  if (absLng > 90) {
    themes.push('Ultra-Low-Frequency Radio Astronomy (Earth RF Shield)');
    scienceScore += 20;
  }
  if (elevationMeters <= -4000) {
    themes.push('Deep Crustal & Upper Mantle Excavation (SPA Basin)');
    scienceScore += 25;
  }
  if (elevationMeters >= 2000) {
    themes.push('Primordial Magma Ocean Anorthositic Crust');
    scienceScore += 15;
  }
  if (elevationMeters < 0 && elevationMeters > -4000) {
    themes.push('Volcanic Thermal Evolution & Mare Basalt Stratigraphy');
    scienceScore += 15;
  }
  themes.push('Impact Chronology & Regolith Space Weathering');

  scienceScore = Math.min(100, Math.max(40, scienceScore));
  const scienceDesc = `High-priority scientific value: offers unique insights into ${themes.slice(0, 2).join(' and ')}.`;

  // ================= 9. IN-SITU RESOURCES (11 Materials) =================
  const resources = computeSiteResources(lat, lng, elevationMeters);

  return {
    name: site.name || `Site (${formatCoordinatesDecimal(lat, lng)})`,
    lat,
    lng,
    formattedDecimal: formatCoordinatesDecimal(lat, lng),
    formattedDMS: formatCoordinatesDMS(lat, lng),
    nearestLandmark,
    nearestMission,
    hemisphereLat,
    hemisphereLng,
    sunlight: {
      illuminationPercent,
      regime: sunlightRegime,
      solarZenithMinDeg,
      maxSolarFluxWm2,
      description: sunlightDesc
    },
    earthComms: {
      directLineOfSight,
      earthElevationDeg,
      visibilityPercent,
      relayRequired,
      description: commsDesc
    },
    elevation: {
      elevationMeters,
      geomorphicClass,
      description: elevDesc
    },
    slope: {
      slopeDeg,
      hazardTier,
      landingFeasibility
    },
    craterDensity: {
      densityRating,
      roughnessM,
      hazardDescription: hazardDesc
    },
    temperature: {
      maxKelvin: maxK,
      minKelvin: minK,
      maxCelsius: maxC,
      minCelsius: minC,
      diurnalSwingK,
      description: tempDesc
    },
    landingSuitability: {
      score: totalLandingScore,
      rating: suitabilityRating,
      rationale: suitabilityRationale
    },
    sciencePotential: {
      score: scienceScore,
      primaryThemes: themes,
      description: scienceDesc
    },
    resources
  };
}

/**
 * Compares two analyzed lunar locations across all 8 parameters AND the 11 In-Situ Resources.
 */
export function compareLunarSites(site1Input: SiteInput, site2Input: SiteInput): ComparisonReport {
  const site1 = analyzeLunarSite(site1Input);
  const site2 = analyzeLunarSite(site2Input);

  const distanceKm = calculateLunarDistanceKm(site1.lat, site1.lng, site2.lat, site2.lng);
  const moonCircumferenceKm = Math.round(2 * Math.PI * LOLA_DEM_CONFIG.lunarRadiusMeters / 1000); // ~10,917 km
  const distancePercentMoonCircumference = Number(((distanceKm / moonCircumferenceKm) * 100).toFixed(1));

  // Build the 8-parameter structured comparison matrix
  // Generate site-specific advantage explanations comparing Site 01 vs Site 02
  const sunlightBetter = site1.sunlight.illuminationPercent > site2.sunlight.illuminationPercent
    ? 'site1'
    : site2.sunlight.illuminationPercent > site1.sunlight.illuminationPercent
      ? 'site2'
      : 'tie';
  const sunlightAdvantage = sunlightBetter === 'site1'
    ? `${site1.name} receives ${site1.sunlight.illuminationPercent}% sunlight annually (${site1.sunlight.regime}) vs. only ${site2.sunlight.illuminationPercent}% at ${site2.name}. High sunlight provides constant solar electricity for habitats and rovers, avoiding the need for heavy backup batteries to survive weeks of darkness.`
    : sunlightBetter === 'site2'
      ? `${site2.name} receives ${site2.sunlight.illuminationPercent}% sunlight annually (${site2.sunlight.regime}) vs. only ${site1.sunlight.illuminationPercent}% at ${site1.name}. High sunlight provides constant solar electricity for habitats and rovers, avoiding the need for heavy backup batteries to survive weeks of darkness.`
      : `Both locations receive an equivalent ${site1.sunlight.illuminationPercent}% annual sunlight cycle (${site1.sunlight.regime}).`;

  const commsBetter = site1.earthComms.visibilityPercent > site2.earthComms.visibilityPercent
    ? 'site1'
    : site2.earthComms.visibilityPercent > site1.earthComms.visibilityPercent
      ? 'site2'
      : 'tie';
  const commsAdvantage = commsBetter === 'site1'
    ? `${site1.name} has a clear, unblocked view of Earth at +${site1.earthComms.earthElevationDeg}° above the horizon, enabling direct 24/7 radio communication with mission control. In contrast, ${site2.name} ${site2.earthComms.relayRequired ? 'is hidden on the Moon’s far side where lunar rock blocks direct signals, requiring an orbiting satellite relay' : `has a lower horizon angle (+${site2.earthComms.earthElevationDeg}°)`}.`
    : commsBetter === 'site2'
      ? `${site2.name} has a clear, unblocked view of Earth at +${site2.earthComms.earthElevationDeg}° above the horizon, enabling direct 24/7 radio communication with mission control. In contrast, ${site1.name} ${site1.earthComms.relayRequired ? 'is hidden on the Moon’s far side where lunar rock blocks direct signals, requiring an orbiting satellite relay' : `has a lower horizon angle (+${site1.earthComms.earthElevationDeg}°)`}.`
      : `Both sites share the same Earth communication geometry (${site1.earthComms.directLineOfSight ? `Direct line-of-sight at +${site1.earthComms.earthElevationDeg}°` : 'Far-side location requiring orbital satellite relays'}).`;

  const elevDiff = Math.abs(site1.elevation.elevationMeters - site2.elevation.elevationMeters);
  const elevAdvantage = elevDiff < 400
    ? `Both sites sit at comparable altitudes (${site1.elevation.elevationMeters > 0 ? '+' : ''}${site1.elevation.elevationMeters.toLocaleString()} m vs. ${site2.elevation.elevationMeters > 0 ? '+' : ''}${site2.elevation.elevationMeters.toLocaleString()} m in ${site1.elevation.geomorphicClass}).`
    : site1.elevation.elevationMeters > site2.elevation.elevationMeters
      ? `${site1.name} sits at a higher altitude (+${site1.elevation.elevationMeters.toLocaleString()} m, ${site1.elevation.geomorphicClass}), providing a wide horizon view for radio antennas and solar towers over ${site2.name} (${site2.elevation.elevationMeters.toLocaleString()} m in ${site2.elevation.geomorphicClass}).`
      : `${site2.name} sits at a higher altitude (+${site2.elevation.elevationMeters.toLocaleString()} m, ${site2.elevation.geomorphicClass}), providing a wide horizon view for radio antennas and solar towers over ${site1.name} (${site1.elevation.elevationMeters.toLocaleString()} m in ${site1.elevation.geomorphicClass}).`;

  const slopeBetter = site1.slope.slopeDeg < site2.slope.slopeDeg
    ? 'site1'
    : site2.slope.slopeDeg < site1.slope.slopeDeg
      ? 'site2'
      : 'tie';
  const slopeAdvantage = slopeBetter === 'site1'
    ? `${site1.name} has a gentle, safe slope of ${site1.slope.slopeDeg}° (${site1.slope.hazardTier}) compared to ${site2.name}'s steeper ${site2.slope.slopeDeg}° incline (${site2.slope.hazardTier}). Flatter ground dramatically reduces the risk of a lunar lander tipping over upon touchdown and makes rover driving smooth and safe.`
    : slopeBetter === 'site2'
      ? `${site2.name} has a gentle, safe slope of ${site2.slope.slopeDeg}° (${site2.slope.hazardTier}) compared to ${site1.name}'s steeper ${site1.slope.slopeDeg}° incline (${site1.slope.hazardTier}). Flatter ground dramatically reduces the risk of a lunar lander tipping over upon touchdown and makes rover driving smooth and safe.`
      : `Both sites feature virtually identical flat slopes (~${site1.slope.slopeDeg}°).`;

  const craterBetter = site1.craterDensity.roughnessM < site2.craterDensity.roughnessM
    ? 'site1'
    : site2.craterDensity.roughnessM < site1.craterDensity.roughnessM
      ? 'site2'
      : 'tie';
  const craterAdvantage = craterBetter === 'site1'
    ? `${site1.name} has much smoother terrain (${site1.craterDensity.roughnessM} m roughness vs. ${site2.craterDensity.roughnessM} m at ${site2.name}) and is rated ${site1.craterDensity.densityRating.toLowerCase()}. This means far fewer hazardous boulders and impact craters that could damage lander legs or puncture rover wheels.`
    : craterBetter === 'site2'
      ? `${site2.name} has much smoother terrain (${site2.craterDensity.roughnessM} m roughness vs. ${site1.craterDensity.roughnessM} m at ${site1.name}) and is rated ${site2.craterDensity.densityRating.toLowerCase()}. This means far fewer hazardous boulders and impact craters that could damage lander legs or puncture rover wheels.`
      : `Both sites have similar surface roughness and crater density (~${site1.craterDensity.roughnessM} m roughness).`;

  const tempBetter = site1.temperature.diurnalSwingK < site2.temperature.diurnalSwingK
    ? 'site1'
    : site2.temperature.diurnalSwingK < site1.temperature.diurnalSwingK
      ? 'site2'
      : 'tie';
  const tempAdvantage = tempBetter === 'site1'
    ? `${site1.name} experiences a much smaller temperature swing between day and night (ΔT ${site1.temperature.diurnalSwingK} K vs. ${site2.temperature.diurnalSwingK} K at ${site2.name}). A smaller temperature swing protects solar cells, metals, electronics, and habitat seals from thermal expansion cracking.`
    : tempBetter === 'site2'
      ? `${site2.name} experiences a much smaller temperature swing between day and night (ΔT ${site2.temperature.diurnalSwingK} K vs. ${site1.temperature.diurnalSwingK} K at ${site1.name}). A smaller temperature swing protects solar cells, metals, electronics, and habitat seals from thermal expansion cracking.`
      : `Both sites experience the exact same day-to-night temperature swing of ${site1.temperature.diurnalSwingK} K (${site1.temperature.minCelsius}°C to ${site1.temperature.maxCelsius}°C).`;

  const landingBetter = site1.landingSuitability.score > site2.landingSuitability.score
    ? 'site1'
    : site2.landingSuitability.score > site1.landingSuitability.score
      ? 'site2'
      : 'tie';
  const landingAdvantage = landingBetter === 'site1'
    ? `${site1.name} achieves a higher overall landing safety score (${site1.landingSuitability.score}/100 vs. ${site2.landingSuitability.score}/100) due to flatter ground (${site1.slope.slopeDeg}°), smoother regolith, and ${site1.earthComms.directLineOfSight ? 'continuous direct communication with Earth' : 'reliable solar exposure'}.`
    : landingBetter === 'site2'
      ? `${site2.name} achieves a higher overall landing safety score (${site2.landingSuitability.score}/100 vs. ${site1.landingSuitability.score}/100) due to flatter ground (${site2.slope.slopeDeg}°), smoother regolith, and ${site2.earthComms.directLineOfSight ? 'continuous direct communication with Earth' : 'reliable solar exposure'}.`
      : `Both sites offer comparable overall landing safety (${site1.landingSuitability.score}/100 vs. ${site2.landingSuitability.score}/100).`;

  const scienceBetter = site1.sciencePotential.score > site2.sciencePotential.score
    ? 'site1'
    : site2.sciencePotential.score > site1.sciencePotential.score
      ? 'site2'
      : 'tie';
  const scienceAdvantage = scienceBetter === 'site1'
    ? `${site1.name} has a higher scientific discovery score (${site1.sciencePotential.score}/100 vs. ${site2.sciencePotential.score}/100), offering prime access to ${site1.sciencePotential.primaryThemes.slice(0, 2).join(' and ')}.`
    : scienceBetter === 'site2'
      ? `${site2.name} has a higher scientific discovery score (${site2.sciencePotential.score}/100 vs. ${site1.sciencePotential.score}/100), offering prime access to ${site2.sciencePotential.primaryThemes.slice(0, 2).join(' and ')}.`
      : `Both locations offer exceptional scientific discoveries in distinct geological settings (${site1.sciencePotential.primaryThemes[0]} vs. ${site2.sciencePotential.primaryThemes[0]}).`;

  const parameters: ParameterComparison[] = [
    // 1. Sunlight Availability
    {
      parameterId: 'sunlight',
      title: 'Sunlight Availability & Solar Power',
      category: 'environment',
      plainEnglishMeaning: 'Measures how much sunlight reaches the ground over the year to generate electricity with solar panels for bases and rovers.',
      site1Value: `${site1.sunlight.illuminationPercent}% annual`,
      site1Detail: `${site1.sunlight.regime} (Max ~${site1.sunlight.maxSolarFluxWm2} W/m²)`,
      site1Score: site1.sunlight.illuminationPercent,
      site2Value: `${site2.sunlight.illuminationPercent}% annual`,
      site2Detail: `${site2.sunlight.regime} (Max ~${site2.sunlight.maxSolarFluxWm2} W/m²)`,
      site2Score: site2.sunlight.illuminationPercent,
      betterSite: sunlightBetter,
      advantageReason: sunlightAdvantage
    },

    // 2. Earth Communication
    {
      parameterId: 'earth-comms',
      title: 'Direct Earth Communication & Visibility',
      category: 'mission',
      plainEnglishMeaning: 'Shows whether mission control on Earth has a direct line-of-sight for radio signals, live telemetry, and video without satellite relays.',
      site1Value: site1.earthComms.directLineOfSight ? `Direct DTE (+${site1.earthComms.earthElevationDeg}°)` : `Far-Side (${site1.earthComms.earthElevationDeg}°)`,
      site1Detail: site1.earthComms.directLineOfSight ? 'Continuous 24/7 direct communication' : 'Orbital relay satellite required',
      site1Score: site1.earthComms.visibilityPercent,
      site2Value: site2.earthComms.directLineOfSight ? `Direct DTE (+${site2.earthComms.earthElevationDeg}°)` : `Far-Side (${site2.earthComms.earthElevationDeg}°)`,
      site2Detail: site2.earthComms.directLineOfSight ? 'Continuous 24/7 direct communication' : 'Orbital relay satellite required',
      site2Score: site2.earthComms.visibilityPercent,
      betterSite: commsBetter,
      advantageReason: commsAdvantage
    },

    // 3. Terrain Elevation
    {
      parameterId: 'elevation',
      title: 'Terrain Elevation & Topography',
      category: 'topography',
      plainEnglishMeaning: 'Ground height above or below the Moon’s average surface level. Higher peaks provide wide radio coverage; deep basins offer crater traps.',
      site1Value: `${site1.elevation.elevationMeters > 0 ? '+' : ''}${site1.elevation.elevationMeters.toLocaleString()} m`,
      site1Detail: site1.elevation.geomorphicClass,
      site1Score: Math.round(((site1.elevation.elevationMeters - LOLA_DEM_CONFIG.minElevationMeters) / LOLA_DEM_CONFIG.totalElevationRange) * 100),
      site2Value: `${site2.elevation.elevationMeters > 0 ? '+' : ''}${site2.elevation.elevationMeters.toLocaleString()} m`,
      site2Detail: site2.elevation.geomorphicClass,
      site2Score: Math.round(((site2.elevation.elevationMeters - LOLA_DEM_CONFIG.minElevationMeters) / LOLA_DEM_CONFIG.totalElevationRange) * 100),
      betterSite: 'contextual',
      advantageReason: elevAdvantage
    },

    // 4. Slope Analysis
    {
      parameterId: 'slope',
      title: 'Surface Slope & Ground Steepness',
      category: 'topography',
      plainEnglishMeaning: 'Ground incline in degrees. Flatter ground (< 5°) prevents landers from tipping over during touchdown and allows rovers to drive easily.',
      site1Value: `${site1.slope.slopeDeg}°`,
      site1Detail: site1.slope.hazardTier,
      site1Score: Math.max(0, Math.round(100 - (site1.slope.slopeDeg / 20) * 100)),
      site2Value: `${site2.slope.slopeDeg}°`,
      site2Detail: site2.slope.hazardTier,
      site2Score: Math.max(0, Math.round(100 - (site2.slope.slopeDeg / 20) * 100)),
      betterSite: slopeBetter,
      advantageReason: slopeAdvantage
    },

    // 5. Crater Density & Roughness
    {
      parameterId: 'crater-density',
      title: 'Surface Smoothness & Boulder Hazards',
      category: 'topography',
      plainEnglishMeaning: 'How rocky and pitted the ground is. Smoother ground means fewer hazardous boulders that could damage lander legs or block rover wheels.',
      site1Value: site1.craterDensity.densityRating.split(' ')[0],
      site1Detail: `RMS Roughness: ${site1.craterDensity.roughnessM} m`,
      site1Score: Math.max(0, Math.round(100 - (site1.craterDensity.roughnessM / 90) * 100)),
      site2Value: site2.craterDensity.densityRating.split(' ')[0],
      site2Detail: `RMS Roughness: ${site2.craterDensity.roughnessM} m`,
      site2Score: Math.max(0, Math.round(100 - (site2.craterDensity.roughnessM / 90) * 100)),
      betterSite: craterBetter,
      advantageReason: craterAdvantage
    },

    // 6. Temperature Conditions
    {
      parameterId: 'temperature',
      title: 'Surface Temperature & Day/Night Swing',
      category: 'environment',
      plainEnglishMeaning: 'The extreme shift between daytime heat and nighttime freezing. Milder swings protect metals, electronics, and habitats from cracking.',
      site1Value: `${site1.temperature.minCelsius}°C to ${site1.temperature.maxCelsius}°C`,
      site1Detail: `ΔT: ${site1.temperature.diurnalSwingK} K (${site1.temperature.minKelvin} K to ${site1.temperature.maxKelvin} K)`,
      site1Score: Math.max(0, Math.round(100 - (site1.temperature.diurnalSwingK / 300) * 100)),
      site2Value: `${site2.temperature.minCelsius}°C to ${site2.temperature.maxCelsius}°C`,
      site2Detail: `ΔT: ${site2.temperature.diurnalSwingK} K (${site2.temperature.minKelvin} K to ${site2.temperature.maxKelvin} K)`,
      site2Score: Math.max(0, Math.round(100 - (site2.temperature.diurnalSwingK / 300) * 100)),
      betterSite: tempBetter,
      advantageReason: tempAdvantage
    },

    // 7. Landing Suitability
    {
      parameterId: 'landing-suitability',
      title: 'Overall Safe Landing Suitability Rating',
      category: 'mission',
      plainEnglishMeaning: 'An engineering safety score (0–100) combining flat ground, smooth surface, direct Earth contact, and sunlight into one simple rating.',
      site1Value: `${site1.landingSuitability.score} / 100`,
      site1Detail: site1.landingSuitability.rating,
      site1Score: site1.landingSuitability.score,
      site2Value: `${site2.landingSuitability.score} / 100`,
      site2Detail: site2.landingSuitability.rating,
      site2Score: site2.landingSuitability.score,
      betterSite: landingBetter,
      advantageReason: landingAdvantage
    },

    // 8. Scientific Exploration Potential
    {
      parameterId: 'science-potential',
      title: 'Scientific Exploration Potential & Discoveries',
      category: 'science',
      plainEnglishMeaning: 'The value of unique scientific discoveries possible here, such as water ice cold traps, ancient primordial crust, or radio astronomy.',
      site1Value: `${site1.sciencePotential.score} / 100`,
      site1Detail: site1.sciencePotential.primaryThemes[0] || 'Regolith Science',
      site1Score: site1.sciencePotential.score,
      site2Value: `${site2.sciencePotential.score} / 100`,
      site2Detail: site2.sciencePotential.primaryThemes[0] || 'Regolith Science',
      site2Score: site2.sciencePotential.score,
      betterSite: scienceBetter,
      advantageReason: scienceAdvantage
    }
  ];

  // Map plain-English meanings for the 11 In-Situ Resources
  const resourcePlainMeanings: Record<string, string> = {
    water: 'Most precious resource on the Moon: supplies astronaut drinking water, oxygen to breathe, and liquid hydrogen/oxygen rocket fuel to return to Earth.',
    he3: 'Ultra-rare solar-wind isotope embedded in soil, considered the holy grail fuel for future clean, zero-radiation nuclear fusion power plants.',
    co: 'Versatile carbon building block used for lunar metallurgy, steel making, and manufacturing plastics and synthetic fuels on the Moon.',
    co2: 'Essential carbon source for lunar plant greenhouses to grow fresh vegetables for astronauts and regenerate oxygen in closed-loop habitats.',
    ch4: 'Clean cryogenic rocket propellant used by modern deep-space vehicles (like SpaceX Starship) to refuel landers directly on the lunar surface.',
    nh3: 'Provides nitrogen for agricultural crop fertilizers on the Moon and supplies buffer gas to maintain safe, breathable air pressure inside habitats.',
    h2s: 'Supplies sulfur to make waterless "lunar concrete" for building astronaut shelters, protective domes, and landing pads without using scarce water.',
    si: 'The foundational semiconductor material used to fabricate solar panels, computer microchips, and structural glass windows right on the Moon.',
    fe: 'High-strength structural metal magnetically separated from basaltic plains to construct habitat frames, heavy machinery, pipes, and landing pads.',
    al: 'Lightweight, corrosion-resistant metal from highland anorthosite rock, ideal for building spacecraft hulls, rover parts, and electrical wiring grids.',
    tio2: 'Provides ultra-strong titanium metal and is heated to release large volumes of pure, breathable oxygen from ilmenite mineral.'
  };

  // Build the 11-Resource In-Situ Resource Utilization (ISRU) Comparison Matrix
  const resources: ResourceComparison[] = site1.resources.map(r1 => {
    const r2 = site2.resources.find(r => r.id === r1.id)!;
    
    let betterSite: 'site1' | 'site2' | 'tie' | 'contextual' = 'tie';
    if (r1.abundanceNumeric > r2.abundanceNumeric) betterSite = 'site1';
    else if (r2.abundanceNumeric > r1.abundanceNumeric) betterSite = 'site2';

    let reason = '';
    if (betterSite === 'site1') {
      reason = `${site1.name} has a significantly higher concentration (${r1.abundanceDisplay} vs. ${r2.abundanceDisplay} at ${site2.name}). Richer deposits mean astronauts can extract more ${r1.name} with less soil excavation and lower energy consumption.`;
    } else if (betterSite === 'site2') {
      reason = `${site2.name} offers a superior concentration (${r2.abundanceDisplay} vs. ${r1.abundanceDisplay} at ${site1.name}). Richer deposits mean astronauts can extract more ${r2.name} with less soil excavation and lower energy consumption.`;
    } else {
      reason = `Both locations share a comparable regional abundance of ${r1.name} (${r1.abundanceDisplay}).`;
    }

    return {
      resourceId: r1.id,
      name: r1.name,
      formula: r1.formula,
      subCategory: r1.subCategory,
      plainEnglishMeaning: resourcePlainMeanings[r1.id] || r1.scientificContext,
      site1Value: r1.abundanceDisplay,
      site1Detail: r1.scientificContext,
      site1Score: r1.score,
      site2Value: r2.abundanceDisplay,
      site2Detail: r2.scientificContext,
      site2Score: r2.score,
      betterSite,
      advantageReason: reason,
      isruApplication: r1.isruRole
    };
  });

  // Generate objective comparative narrative
  let overview = `Geographic comparison between ${site1.name} and ${site2.name} across an angular separation of ${distanceKm.toLocaleString()} km (${distancePercentMoonCircumference}% of lunar circumference). `;
  
  if (site1.hemisphereLng !== site2.hemisphereLng) {
    overview += `The sites lie in opposing hemispheres (${site1.hemisphereLng} vs. ${site2.hemisphereLng}), presenting fundamentally different communication architectures. `;
  } else {
    overview += `Both locations share the ${site1.hemisphereLng} hemisphere, enabling similar telemetry line-of-sight conditions. `;
  }

  let site1Adv = '';
  if (site1.landingSuitability.score >= site2.landingSuitability.score) {
    site1Adv = `${site1.name} features lower terrain slope (${site1.slope.slopeDeg}° vs. ${site2.slope.slopeDeg}°) and superior engineering landing margin (${site1.landingSuitability.score}/100).`;
  } else {
    site1Adv = `${site1.name} offers distinct scientific advantages in ${site1.sciencePotential.primaryThemes[0] || 'local geology'} with ${site1.elevation.geomorphicClass.toLowerCase()} terrain.`;
  }

  let site2Adv = '';
  if (site2.sciencePotential.score >= site1.sciencePotential.score) {
    site2Adv = `${site2.name} exhibits high scientific interest focused on ${site2.sciencePotential.primaryThemes[0] || 'crustal stratigraphy'} (Science Score: ${site2.sciencePotential.score}/100).`;
  } else {
    site2Adv = `${site2.name} offers favorable operational conditions with ${site2.sunlight.regime.toLowerCase()} and thermal range of ${site2.temperature.diurnalSwingK} K.`;
  }

  let recommendation = '';
  if (site1.landingSuitability.score > site2.landingSuitability.score + 15) {
    recommendation = `Engineering trade-off: ${site1.name} is the lower-risk operational target for early-stage landings, whereas ${site2.name} is suited for precision-targeted exploration missions.`;
  } else if (site2.landingSuitability.score > site1.landingSuitability.score + 15) {
    recommendation = `Engineering trade-off: ${site2.name} provides superior operational safety margins, while ${site1.name} addresses specialized scientific objectives.`;
  } else {
    recommendation = `Balanced profiles: Both locations present competitive operational feasibility with specialized regional differences in illumination and scientific return.`;
  }

  // ISRU Synthesis
  const s1Volatiles = site1.resources.find(r => r.id === 'water')?.abundanceNumeric || 0;
  const s2Volatiles = site2.resources.find(r => r.id === 'water')?.abundanceNumeric || 0;
  const s1Metals = site1.resources.find(r => r.id === 'tio2')?.abundanceNumeric || 0;
  const s2Metals = site2.resources.find(r => r.id === 'tio2')?.abundanceNumeric || 0;

  let isruSummary = '';
  if (s1Volatiles > s2Volatiles && s2Metals > s1Metals) {
    isruSummary = `Resource Complementarity: ${site1.name} dominates in volatile life-support & propellant resources (H₂O, CO₂, NH₃), whereas ${site2.name} excels in metallic and solar-wind feedstocks (Fe, TiO₂, ³He).`;
  } else if (s2Volatiles > s1Volatiles && s1Metals > s2Metals) {
    isruSummary = `Resource Complementarity: ${site2.name} dominates in volatile life-support & propellant resources (H₂O, CO₂, NH₃), whereas ${site1.name} excels in metallic and solar-wind feedstocks (Fe, TiO₂, ³He).`;
  } else if (s1Volatiles > s2Volatiles) {
    isruSummary = `${site1.name} holds clear superiority in cryogenic volatiles (water, methane, ammonia), whereas ${site2.name} has standard refractory silicates.`;
  } else if (s2Volatiles > s1Volatiles) {
    isruSummary = `${site2.name} holds clear superiority in cryogenic volatiles (water, methane, ammonia), whereas ${site1.name} has standard refractory silicates.`;
  } else {
    isruSummary = `Both locations exhibit similar regolith composition, with resource extraction driven by ubiquitous silica (Si) and regional mineral variations.`;
  }

  return {
    site1,
    site2,
    distanceKm,
    distancePercentMoonCircumference,
    parameters,
    resources,
    comparativeSummary: {
      overview,
      site1KeyAdvantage: site1Adv,
      site2KeyAdvantage: site2Adv,
      missionRecommendation: recommendation,
      isruSummary
    }
  };
}
