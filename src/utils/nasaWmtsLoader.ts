import * as THREE from 'three';
import { TerrainAnalysisMode } from '../types/lunar';

export type MapLayerId = 'default' | 'nasa-wac' | 'nasa-lola';

export interface MapLayerConfig {
  id: MapLayerId;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  urlTemplate?: string;
  fallbackTemplate?: string;
  format?: 'jpg' | 'png';
  attribution: string;
}

export const MAP_LAYERS: MapLayerConfig[] = [
  {
    id: 'default',
    label: 'My Current Default Texture',
    shortLabel: 'Default (NASA 8K)',
    badge: 'Standard 8K',
    description: 'Calibrated high-resolution monochrome lunar surface mosaic (8192 × 4096 px)',
    attribution: 'NASA LRO WAC & LOLA Composite'
  },
  {
    id: 'nasa-wac',
    label: 'NASA LRO WAC Global Mosaic',
    shortLabel: 'NASA LRO WAC',
    badge: 'Moon Trek WMTS',
    description: 'Wide Angle Camera 303 PPD Global Mosaic via NASA JPL Moon Trek',
    urlTemplate: 'https://moontrek.jpl.nasa.gov/trektiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    fallbackTemplate: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    format: 'jpg',
    attribution: 'NASA JPL / Moon Trek OGC WMTS (LROC WAC)'
  },
  {
    id: 'nasa-lola',
    label: 'NASA LOLA Color Elevation',
    shortLabel: 'NASA LOLA Color',
    badge: 'Moon Trek WMTS',
    description: 'LOLA 128 PPD Color Shaded Relief global altimetry via NASA JPL Moon Trek',
    urlTemplate: 'https://moontrek.jpl.nasa.gov/trektiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    fallbackTemplate: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    format: 'png',
    attribution: 'NASA JPL / Moon Trek OGC WMTS (LOLA Altimeter)'
  }
];

// In-memory cache for stitched textures to allow instant switching after initial stitch
const textureCache = new Map<MapLayerId, THREE.CanvasTexture>();

export type StitchProgressCallback = (loaded: number, total: number) => void;

/**
 * Fetches NASA WMTS tiles at zoom level 2 (8 columns × 4 rows = 32 tiles, 256x256 px each),
 * stitches them onto an offscreen HTML <canvas> (2048x1024), converts it to a THREE.CanvasTexture,
 * and updates the texture.
 */
export async function fetchAndStitchNasaWmtsTiles(
  layerId: 'nasa-wac' | 'nasa-lola',
  onProgress?: StitchProgressCallback
): Promise<THREE.CanvasTexture> {
  // Return cached texture if already stitched
  if (textureCache.has(layerId)) {
    const cached = textureCache.get(layerId)!;
    onProgress?.(32, 32);
    return cached;
  }

  const layer = MAP_LAYERS.find(l => l.id === layerId);
  if (!layer || !layer.urlTemplate) {
    throw new Error(`Invalid or non-WMTS layer: ${layerId}`);
  }

  const ZOOM = 2;
  const COLS = 8;  // x: 0 to 7
  const ROWS = 4;  // y: 0 to 3
  const TILE_SIZE = 256;
  const CANVAS_WIDTH = COLS * TILE_SIZE;  // 2048 px
  const CANVAS_HEIGHT = ROWS * TILE_SIZE; // 1024 px
  const TOTAL_TILES = COLS * ROWS;        // 32 tiles

  // Create offscreen canvas for stitching
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) {
    throw new Error('Failed to create 2D canvas context for WMTS stitching');
  }

  // Pre-fill with clean neutral lunar backdrop so any missing tiles don't break the render
  ctx.fillStyle = layerId === 'nasa-wac' ? '#5a626c' : '#1e1b4b';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let loadedCount = 0;

  // Helper to load a single tile with retry and fallback
  const loadSingleTile = (x: number, y: number): Promise<{ x: number; y: number; img: HTMLImageElement | null }> => {
    return new Promise((resolve) => {
      const primaryUrl = layer.urlTemplate!
        .replace('{z}', String(ZOOM))
        .replace('{y}', String(y))
        .replace('{x}', String(x));

      const fallbackUrl = layer.fallbackTemplate
        ? layer.fallbackTemplate
            .replace('{z}', String(ZOOM))
            .replace('{y}', String(y))
            .replace('{x}', String(x))
        : null;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      let triedFallback = false;

      img.onload = () => {
        loadedCount++;
        onProgress?.(loadedCount, TOTAL_TILES);
        resolve({ x, y, img });
      };

      img.onerror = () => {
        if (!triedFallback && fallbackUrl) {
          triedFallback = true;
          img.src = fallbackUrl;
        } else {
          // Gracefully handle missing tile without breaking the render
          console.warn(`[NASA WMTS] Handled missing tile at z=${ZOOM}, y=${y}, x=${x}`);
          loadedCount++;
          onProgress?.(loadedCount, TOTAL_TILES);
          resolve({ x, y, img: null });
        }
      };

      img.src = primaryUrl;
    });
  };

  // Launch all 32 tile requests in parallel
  const tilePromises: Promise<{ x: number; y: number; img: HTMLImageElement | null }>[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      tilePromises.push(loadSingleTile(x, y));
    }
  }

  // Wait for all tiles to finish (either loaded or handled missing)
  const results = await Promise.all(tilePromises);

  // Stitch tiles onto the offscreen canvas
  for (const { x, y, img } of results) {
    if (img) {
      ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // Convert canvas to a Three.js CanvasTexture
  const canvasTexture = new THREE.CanvasTexture(canvas);
  canvasTexture.colorSpace = THREE.SRGBColorSpace;
  canvasTexture.wrapS = THREE.RepeatWrapping;
  canvasTexture.wrapT = THREE.ClampToEdgeWrapping;
  canvasTexture.generateMipmaps = true;
  canvasTexture.minFilter = THREE.LinearMipmapLinearFilter;
  canvasTexture.magFilter = THREE.LinearFilter;
  canvasTexture.anisotropy = 8;
  canvasTexture.needsUpdate = true;

  // Cache stitched texture
  textureCache.set(layerId, canvasTexture);

  return canvasTexture;
}

// In-memory cache for NASA DEM grayscale bump texture
let cachedDemBumpTexture: THREE.CanvasTexture | null = null;

export const NASA_DEM_CONFIG = {
  id: 'nasa-dem-bump',
  label: "NASA LOLA Grayscale DEM Relief",
  primaryUrl: 'https://moontrek.jpl.nasa.gov/trektiles/Moon/EQ/LRO_LOLA_DEM_Global_128ppd_v04/1.0.0/default/default028mm/{z}/{y}/{x}.png',
  fallbackUrls: [
    'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_DEM_Global_128ppd_v04/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_DEM_Global_128ppd_v06/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_GLD100_Global_303ppd_v01/1.0.0/default/default028mm/{z}/{y}/{x}.png'
  ],
  zoom: 2,
  cols: 8,
  rows: 4,
  tileSize: 256,
  bumpScale: 0.05
};

/**
 * Fetches NASA's grayscale elevation mosaic (LRO_LOLA_DEM_Global_128ppd_v06/v04 or LRO_WAC_GLD100_Global_303ppd_v01)
 * at zoom level 2 (8 columns × 4 rows = 32 tiles, 256x256 px each), stitches them onto a separate
 * offscreen HTML <canvas> (2048x1024), and converts it to a THREE.CanvasTexture for use as the Moon sphere's bumpMap.
 */
export async function fetchAndStitchNasaDemBumpTexture(
  onProgress?: StitchProgressCallback
): Promise<THREE.CanvasTexture> {
  if (cachedDemBumpTexture) {
    onProgress?.(32, 32);
    return cachedDemBumpTexture;
  }

  const ZOOM = NASA_DEM_CONFIG.zoom;
  const COLS = NASA_DEM_CONFIG.cols;
  const ROWS = NASA_DEM_CONFIG.rows;
  const TILE_SIZE = NASA_DEM_CONFIG.tileSize;
  const CANVAS_WIDTH = COLS * TILE_SIZE;  // 2048 px
  const CANVAS_HEIGHT = ROWS * TILE_SIZE; // 1024 px
  const TOTAL_TILES = COLS * ROWS;        // 32 tiles

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) {
    throw new Error('Failed to create 2D canvas context for DEM bump stitching');
  }

  // Pre-fill with neutral midpoint gray (#808080 = elevation 0m datum)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let loadedCount = 0;

  const loadSingleTile = (x: number, y: number): Promise<{ x: number; y: number; img: HTMLImageElement | null }> => {
    return new Promise((resolve) => {
      const primaryUrl = NASA_DEM_CONFIG.primaryUrl
        .replace('{z}', String(ZOOM))
        .replace('{y}', String(y))
        .replace('{x}', String(x));

      const fallbackUrls = NASA_DEM_CONFIG.fallbackUrls.map(url =>
        url.replace('{z}', String(ZOOM)).replace('{y}', String(y)).replace('{x}', String(x))
      );

      let fallbackIndex = 0;
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        loadedCount++;
        onProgress?.(loadedCount, TOTAL_TILES);
        resolve({ x, y, img });
      };

      img.onerror = () => {
        if (fallbackIndex < fallbackUrls.length) {
          const nextUrl = fallbackUrls[fallbackIndex++];
          img.src = nextUrl;
        } else {
          console.warn(`[NASA DEM Bump] Handled missing tile at z=${ZOOM}, y=${y}, x=${x}`);
          loadedCount++;
          onProgress?.(loadedCount, TOTAL_TILES);
          resolve({ x, y, img: null });
        }
      };

      img.src = primaryUrl;
    });
  };

  const tilePromises: Promise<{ x: number; y: number; img: HTMLImageElement | null }>[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      tilePromises.push(loadSingleTile(x, y));
    }
  }

  const results = await Promise.all(tilePromises);

  for (const { x, y, img } of results) {
    if (img) {
      ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  const bumpCanvasTexture = new THREE.CanvasTexture(canvas);
  // Three.js bump map samples scalar luminance for surface normal perturbation
  bumpCanvasTexture.wrapS = THREE.RepeatWrapping;
  bumpCanvasTexture.wrapT = THREE.ClampToEdgeWrapping;
  bumpCanvasTexture.generateMipmaps = true;
  bumpCanvasTexture.minFilter = THREE.LinearMipmapLinearFilter;
  bumpCanvasTexture.magFilter = THREE.LinearFilter;
  bumpCanvasTexture.anisotropy = 8;
  bumpCanvasTexture.needsUpdate = true;

  cachedDemBumpTexture = bumpCanvasTexture;
  return bumpCanvasTexture;
}

/**
 * Official NASA Moon Trek and USGS Astrogeology Equirectangular (EPSG:4326) WMTS/WMS endpoints
 * Reference Sphere Datum: 1,737,400 meters
 */
export const NASA_TREK_WMTS_ENDPOINTS = {
  // LRO WAC Global Mosaic (100 m/px base)
  wacMosaic: {
    name: 'LRO_WAC_Mosaic_Global_303ppd_v02',
    url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.jpg',
    format: 'image/jpeg',
    matrixSet: 'default028mm',
    maxLevel: 9
  },
  // Elevation: LOLA 128 PPD Color Shaded Relief (hypsometric)
  elevationClrShade: {
    name: 'LRO_LOLA_ClrShade_Global_128ppd_v04',
    url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
    format: 'image/png',
    matrixSet: 'default028mm',
    maxLevel: 8
  },
  // Elevation / DEM: LOLA Kaguya DEM 512 PPD
  demKaguya: {
    name: 'LRO_LOLAKaguya_DEM_60N60S_512ppd',
    url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLAKaguya_DEM_60N60S_512ppd/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
    format: 'image/png',
    matrixSet: 'default028mm',
    maxLevel: 9
  },
  // Slope: USGS LOLA Steel Slope Gradient (high-contrast geomorphological slope)
  slopeSteel: {
    name: 'LOLA_steel',
    url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map',
    format: 'image/jpeg',
    service: 'WMS'
  },
  // Hillshade: USGS LOLA Kaguya Shaded Relief
  hillshade: {
    name: 'LOLA_Kaguya_Shade',
    url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map',
    format: 'image/jpeg',
    service: 'WMS'
  }
};

/**
 * Creates a CesiumJS ImageryProvider for real NASA Moon Trek and USGS Astrogeology layers
 * configured with GeographicTilingScheme and lunar radius 1,737,400 meters.
 */
export function createCesiumTerrainImageryProvider(
  mode: TerrainAnalysisMode,
  Cesium: any,
  ellipsoid: any
): any {
  if (mode === 'none' || !Cesium || !ellipsoid) return null;

  const moonTilingScheme = new Cesium.GeographicTilingScheme({
    ellipsoid,
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 1,
    rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
  });

  const tileMatrixLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

  if (mode === 'elevation') {
    return new Cesium.WebMapTileServiceImageryProvider({
      url: NASA_TREK_WMTS_ENDPOINTS.elevationClrShade.url,
      layer: NASA_TREK_WMTS_ENDPOINTS.elevationClrShade.name,
      style: 'default',
      format: 'image/png',
      tileMatrixSetID: NASA_TREK_WMTS_ENDPOINTS.elevationClrShade.matrixSet,
      tileMatrixLabels,
      tilingScheme: moonTilingScheme,
      maximumLevel: NASA_TREK_WMTS_ENDPOINTS.elevationClrShade.maxLevel
    });
  }

  if (mode === 'slope') {
    return new Cesium.WebMapServiceImageryProvider({
      url: NASA_TREK_WMTS_ENDPOINTS.slopeSteel.url,
      layers: NASA_TREK_WMTS_ENDPOINTS.slopeSteel.name,
      parameters: {
        transparent: true,
        format: 'image/jpeg'
      },
      tilingScheme: moonTilingScheme
    });
  }

  if (mode === 'roughness') {
    return new Cesium.WebMapTileServiceImageryProvider({
      url: NASA_TREK_WMTS_ENDPOINTS.demKaguya.url,
      layer: NASA_TREK_WMTS_ENDPOINTS.demKaguya.name,
      style: 'default',
      format: 'image/png',
      tileMatrixSetID: NASA_TREK_WMTS_ENDPOINTS.demKaguya.matrixSet,
      tileMatrixLabels,
      tilingScheme: moonTilingScheme,
      maximumLevel: NASA_TREK_WMTS_ENDPOINTS.demKaguya.maxLevel
    });
  }

  if (mode === 'hillshade') {
    return new Cesium.WebMapServiceImageryProvider({
      url: NASA_TREK_WMTS_ENDPOINTS.hillshade.url,
      layers: NASA_TREK_WMTS_ENDPOINTS.hillshade.name,
      parameters: {
        transparent: true,
        format: 'image/jpeg'
      },
      tilingScheme: moonTilingScheme
    });
  }

  return null;
}



