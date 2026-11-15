export type POICategory = 'apollo' | 'artemis' | 'chandrayaan' | 'change' | 'historic' | 'geological';

export interface LunarPOI {
  id: string;
  name: string;
  subTitle?: string;
  category: POICategory;
  lat: number;          // Latitude in degrees (-90 to +90)
  lng: number;          // Longitude in degrees (-180 to +180)
  elevationMeters: number;
  landingDate?: string;
  agency: string;
  country: string;
  crew?: string[];
  duration?: string;
  samplesReturnedKg?: number;
  description: string;
  historicalSignificance: string;
  keyScientificGoals: string[];
  surfaceFeatures: string;
  badgeUrl?: string;
  accentColor: string;
}

export type BasemapType = 'natural' | 'nasa-lola' | 'shaded-relief';

export interface BasemapLayerInfo {
  id: BasemapType;
  name: string;
  shortName: string;
  description: string;
  instrument: string;
  mission: string;
  colorScale?: string[];
}

export interface CameraState {
  target: [number, number, number];
  position: [number, number, number];
  zoom: number;
}

export interface LunarCoordinateHover {
  lat: number;
  lng: number;
  elevationApprox?: number;
  elevationMeters?: number;
  slopeDeg?: number;
  roughnessM?: number;
  terrainClass?: string;
  nearestFeature?: string;
  siteName?: string;
}

export type TerrainAnalysisMode = 'none' | 'elevation' | 'slope' | 'roughness' | 'hillshade';

export type ElevationCategory = 'all' | 'basins' | 'lowlands' | 'intermediate' | 'highlands';

export type PaletteId = 'lola' | 'turbo' | 'magma' | 'monochrome' | 'coolwarm';

export type SlopeCategory = 'all' | '0-5' | '5-10' | '10-15' | '15+';

export type RoughnessCategory = 'all' | 'smooth' | 'moderate' | 'rough';

export interface TerrainPaletteInfo {
  id: PaletteId;
  name: string;
  description: string;
  colors: string[];
}

export interface TerrainFilterConfig {
  mode: TerrainAnalysisMode;
  minElevation: number;          // -9000 to +10760 m
  maxElevation: number;          // -9000 to +10760 m
  elevationCategory: ElevationCategory;
  highlightOutOfRange: boolean;  // true: dim out of range; false: hard mask out
  paletteId: PaletteId;
  slopeCategory: SlopeCategory;
  roughnessCategory: RoughnessCategory;
  hillshadeAzimuth: number;      // 0 to 360 degrees
  hillshadeAltitude: number;     // 10 to 80 degrees
  blendOpacity: number;          // 0.2 to 1.0
  overlayOnNatural: boolean;     // blend on top of 8K natural basemap
  continuousTargetElev?: number | null; // target elevation in meters when continuous cursor filter is active
  continuousWindowM?: number;    // half-width of the highlight window in meters (default 1800m)
}

export interface QuickMapTelemetry {
  lat: number;
  lng: number;
  latFormatted: string; // 5 decimal places: e.g. "+00.67408°" or "00.67408° N"
  lngFormatted: string; // 5 decimal places: e.g. "+023.47297°" or "023.47297° E"
  resolutionMetersPerPixel: number; // e.g. 100.2
  resolutionFormatted: string; // e.g. "100.2 m/px" or "1.25 km/px"
  elevationMeters?: number;
  slopeDeg?: number;
  roughnessM?: number;
  terrainClass?: string;
  nearestFeature?: string;
}

export interface LROCLayerConfig {
  showWacBase: boolean;
  showLolaOverlay: boolean;
  lolaOpacity: number; // 0.0 to 1.0
  showNacOverlays: boolean;
  showUSGSNomenclature: boolean;
  showGraticule: boolean;
  nomenclatureFilter?: 'all' | 'crater' | 'landing_site' | 'mare';
}


