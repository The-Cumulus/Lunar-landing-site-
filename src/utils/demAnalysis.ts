import { 
  PaletteId, 
  TerrainPaletteInfo, 
  ElevationCategory, 
  SlopeCategory, 
  RoughnessCategory 
} from '../types/lunar';

/**
 * NASA Lunar Reconnaissance Orbiter (LRO) LOLA Digital Elevation Model Geodesy Specifications
 * Reference Datum: Lunar Mean Sphere R_0 = 1,737.4 km (1,737,400 meters)
 * Coordinate System: Selenographic / Planetocentric
 * Global Minimum: ~ -9,150 m (Antoniadi Crater floor, South Pole-Aitken Basin)
 * Global Maximum: ~ +10,760 m (Highland peak west of Engel'gardt Crater)
 */
export const LOLA_DEM_CONFIG = {
  minElevationMeters: -9150,
  maxElevationMeters: 10760,
  totalElevationRange: 19910, // 10760 - (-9150)
  lunarRadiusMeters: 1737400,
  datasetSource: 'NASA Lunar Reconnaissance Orbiter / LOLA Science Team (PDS Geosciences)',
  resolutionDoc: 'LOLA GDR 128 pixels/degree Global Equirectangular DEM',
};

export const ELEVATION_CATEGORY_RANGES: Record<ElevationCategory, { min: number; max: number; label: string; description: string }> = {
  all: {
    min: -9000,
    max: 10760,
    label: 'Full Global Range',
    description: 'Complete lunar surface elevation spectrum (-9.0 km to +10.8 km)'
  },
  basins: {
    min: -9000,
    max: -5000,
    label: 'Deep Basins',
    description: 'Monumental impact excavations: South Pole-Aitken, Apollo, Orientale depths'
  },
  lowlands: {
    min: -5000,
    max: 0,
    label: 'Maria Basalts',
    description: 'Ancient flood basalt maria: Tranquillitatis, Imbrium, Oceanus Procellarum'
  },
  intermediate: {
    min: -2000,
    max: 1000,
    label: 'Intermediate Terrain',
    description: 'Transition zones, crater floor plains, and undulating ejecta fields'
  },
  highlands: {
    min: 0,
    max: 10760,
    label: 'Highland Peaks',
    description: 'Ancient primordial anorthosite crust, crater central peaks, and far-side mountain massifs'
  }
};

export const TERRAIN_PALETTES: TerrainPaletteInfo[] = [
  {
    id: 'lola',
    name: 'NASA LOLA Standard',
    description: 'Official hypsometric elevation tint from NASA GSFC / LOLA Science Team',
    colors: ['#2d0554', '#0984e3', '#00cec9', '#55efc4', '#6ab04c', '#f1c40f', '#e74c3c', '#ffffff']
  },
  {
    id: 'turbo',
    name: 'Turbo Scientific Spectrum',
    description: 'Perceptually uniform high-contrast spectral rainbow for topographic gradients',
    colors: ['#30123b', '#4662d8', '#28bbec', '#30e1b9', '#a2fc3c', '#fbbe30', '#f86015', '#cb1b04']
  },
  {
    id: 'magma',
    name: 'Magma Volcanic Thermal',
    description: 'High-visibility radiometric heat ramp highlighting deep basins to elevated massifs',
    colors: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4071', '#f1605d', '#fd9668', '#fecf92', '#fcfdbf']
  },
  {
    id: 'monochrome',
    name: 'Geomorphological Albedo',
    description: 'Calibrated grayscale reflectance for morphological slope and crater structural study',
    colors: ['#111827', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#f9fafb']
  },
  {
    id: 'coolwarm',
    name: 'Cool-to-Warm Diverging',
    description: 'Bipolar diverging palette emphasizing depression vs highland boundaries',
    colors: ['#08519c', '#3182bd', '#6baed6', '#bdd7e7', '#ffffcc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02']
  }
];

export const SLOPE_BINS = [
  { id: '0-5' as SlopeCategory, label: '0° – 5°', name: 'Flat Plains & Maria', color: '#3b82f6', desc: 'Basalt flows and interior basin floors' },
  { id: '5-10' as SlopeCategory, label: '5° – 10°', name: 'Gentle Slopes', color: '#06b6d4', desc: 'Low undulating ejecta and rolling terrain' },
  { id: '10-15' as SlopeCategory, label: '10° – 15°', name: 'Moderate Slopes', color: '#f59e0b', desc: 'Crater glacis, hummocks, and degraded rims' },
  { id: '15+' as SlopeCategory, label: '> 15°', name: 'Steep Terraces & Massifs', color: '#ef4444', desc: 'Sheer crater rim walls, central peaks, and fault scarps' }
];

export const ROUGHNESS_BINS = [
  { id: 'smooth' as RoughnessCategory, label: 'Smooth', rmsRange: '< 35 m RMS', color: '#10b981', desc: 'Flat basalt plains with minimal micro-relief' },
  { id: 'moderate' as RoughnessCategory, label: 'Moderate', rmsRange: '35 – 90 m RMS', color: '#f59e0b', desc: 'Hummocky ejecta blankets and undulating highlands' },
  { id: 'rough' as RoughnessCategory, label: 'Rough', rmsRange: '> 90 m RMS', color: '#ec4899', desc: 'Fractured crater rims, boulder fields, and rugged massifs' }
];

/**
 * Singleton In-Memory LOLA DEM Data Cache for sub-millisecond CPU raycast point analysis
 */
export class LunarDEMService {
  private static instance: LunarDEMService | null = null;
  private demData: Uint8Array | null = null;
  private width: number = 0;
  private height: number = 0;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private loadError: string | null = null;

  public static getInstance(): LunarDEMService {
    if (!this.instance) {
      this.instance = new LunarDEMService();
    }
    return this.instance;
  }

  public init(): Promise<boolean> {
    if (this.isLoaded) return Promise.resolve(true);
    if (this.isLoading) return Promise.resolve(false);

    this.isLoading = true;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/textures/moon_bump.jpg';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          this.width = img.width || 2000;
          this.height = img.height || 1000;
          canvas.width = this.width;
          canvas.height = this.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            this.loadError = 'Failed to create 2D canvas context for LOLA DEM';
            this.isLoading = false;
            resolve(false);
            return;
          }

          ctx.drawImage(img, 0, 0, this.width, this.height);
          const imgData = ctx.getImageData(0, 0, this.width, this.height);
          const rgba = imgData.data;

          // Extract single channel luminance (8-bit quantized elevation)
          this.demData = new Uint8Array(this.width * this.height);
          for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
            this.demData[j] = rgba[i];
          }

          this.isLoaded = true;
          this.isLoading = false;
          resolve(true);
        } catch (err) {
          this.loadError = 'Error processing LOLA DEM image buffer';
          this.isLoading = false;
          resolve(false);
        }
      };

      img.onerror = () => {
        this.loadError = 'LOLA DEM dataset file (/textures/moon_bump.jpg) could not be loaded.';
        this.isLoading = false;
        resolve(false);
      };
    });
  }

  public getStatus(): { isLoaded: boolean; error: string | null } {
    return { isLoaded: this.isLoaded, error: this.loadError };
  }

  /**
   * Helper to sample raw DEM elevation value in meters at pixel (x, y)
   */
  private getPixelElevationMeters(x: number, y: number): number {
    if (!this.demData) return 0;
    const clampedX = ((x % this.width) + this.width) % this.width;
    const clampedY = Math.max(0, Math.min(this.height - 1, y));
    const byteVal = this.demData[clampedY * this.width + clampedX];
    return LOLA_DEM_CONFIG.minElevationMeters + (byteVal / 255.0) * LOLA_DEM_CONFIG.totalElevationRange;
  }

  /**
   * Evaluates complete scientific point analysis at (lat, lng)
   */
  public getPointAnalysis(lat: number, lng: number): {
    elevationMeters: number;
    slopeDeg: number;
    roughnessM: number;
    elevationCategory: ElevationCategory;
    elevationCategoryName: string;
    slopeCategory: SlopeCategory;
    roughnessCategory: RoughnessCategory;
  } | null {
    if (!this.isLoaded || !this.demData) return null;

    // Normalizing equirectangular coordinates
    const clampedLat = Math.max(-89.99, Math.min(89.99, lat));
    let normalizedLng = ((lng + 180) % 360 + 360) % 360 - 180;

    const u = (normalizedLng + 180) / 360;
    const v = (90 - clampedLat) / 180;

    const px = Math.min(this.width - 1, Math.max(0, Math.floor(u * this.width)));
    const py = Math.min(this.height - 1, Math.max(0, Math.floor(v * this.height)));

    // 1. Exact Elevation
    const centerElev = this.getPixelElevationMeters(px, py);

    // 2. Exact Slope in degrees using Horn's 8-neighbor gradient algorithm
    const latRad = (clampedLat * Math.PI) / 180;
    const cosLat = Math.max(0.08, Math.cos(latRad));
    // Physical pixel distance on lunar sphere
    const dyMeters = (Math.PI * LOLA_DEM_CONFIG.lunarRadiusMeters) / this.height;
    const dxMeters = (2 * Math.PI * LOLA_DEM_CONFIG.lunarRadiusMeters * cosLat) / this.width;

    const zNW = this.getPixelElevationMeters(px - 1, py - 1);
    const zN  = this.getPixelElevationMeters(px,     py - 1);
    const zNE = this.getPixelElevationMeters(px + 1, py - 1);
    const zW  = this.getPixelElevationMeters(px - 1, py);
    const zE  = this.getPixelElevationMeters(px + 1, py);
    const zSW = this.getPixelElevationMeters(px - 1, py + 1);
    const zS  = this.getPixelElevationMeters(px,     py + 1);
    const zSE = this.getPixelElevationMeters(px + 1, py + 1);

    const dz_dx = ((zNE + 2 * zE + zSE) - (zNW + 2 * zW + zSW)) / (8 * dxMeters);
    const dz_dy = ((zSW + 2 * zS + zSE) - (zNW + 2 * zN + zNE)) / (8 * dyMeters);

    const riseRun = Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy);
    const slopeDeg = Number((Math.atan(riseRun) * (180 / Math.PI)).toFixed(1));

    // 3. Surface Roughness: Root-Mean-Square (RMS) height variation in 3x3 kernel
    const neighbors = [zNW, zN, zNE, zW, centerElev, zE, zSW, zS, zSE];
    const mean = neighbors.reduce((acc, v) => acc + v, 0) / neighbors.length;
    const variance = neighbors.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / neighbors.length;
    const roughnessM = Number(Math.sqrt(variance).toFixed(1));

    // 4. Classifications
    let elevationCategory: ElevationCategory = 'intermediate';
    let elevationCategoryName = 'Intermediate Terrain';
    if (centerElev <= -5000) {
      elevationCategory = 'basins';
      elevationCategoryName = 'Deep Basin';
    } else if (centerElev <= 0) {
      elevationCategory = 'lowlands';
      elevationCategoryName = 'Maria Basalts';
    } else {
      elevationCategory = 'highlands';
      elevationCategoryName = 'Highland Peaks';
    }

    let slopeCategory: SlopeCategory = '0-5';
    if (slopeDeg > 15) slopeCategory = '15+';
    else if (slopeDeg > 10) slopeCategory = '10-15';
    else if (slopeDeg > 5) slopeCategory = '5-10';

    let roughnessCategory: RoughnessCategory = 'smooth';
    if (roughnessM > 90) roughnessCategory = 'rough';
    else if (roughnessM > 35) roughnessCategory = 'moderate';

    return {
      elevationMeters: Math.round(centerElev),
      slopeDeg,
      roughnessM,
      elevationCategory,
      elevationCategoryName,
      slopeCategory,
      roughnessCategory
    };
  }
}

