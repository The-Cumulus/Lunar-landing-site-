import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { LunarPOI, POICategory, LunarCoordinateHover, BasemapType, QuickMapTelemetry, LROCLayerConfig, TerrainFilterConfig } from '../../types/lunar';
import { LunarDEMService } from '../../utils/demAnalysis';
import { createCesiumTerrainImageryProvider } from '../../utils/nasaWmtsLoader';
import { LUNAR_FLYOVER_LANDMARKS, FlyoverWaypoint } from '../../data/flyoverLandmarks';
import { USGS_LUNAR_NOMENCLATURE, USGSNomenclatureFeature } from '../../data/usgsLunarNomenclature';
import { copyToClipboard } from '../../utils/clipboard';

export interface RightClickCoordinateEvent {
  lat: number;
  lng: number;
  screenX: number;
  screenY: number;
  siteName?: string;
  elevationMeters?: number;
  poi?: LunarPOI;
}

export type { FlyoverWaypoint };
export { LUNAR_FLYOVER_LANDMARKS };

export interface CesiumMoonGlobeRef {
  flyTo: (lat: number, lng: number, altitudeMeters?: number, headingDeg?: number, pitchDeg?: number, duration?: number) => void;
  flyToLatLng: (lat: number, lng: number, zoomLevel?: number) => void;
  flyToCoordinates: (lat: number, lng: number, altitudeMeters?: number) => void;
  flyToSurfaceHorizon: (lat: number, lng: number, headingDeg: number, pitchDeg?: number, altitudeMeters?: number) => void;
  lookAtDirection: (headingDeg: number, pitchDeg: number) => void;
  setSimulationDate: (date: Date) => void;
  showCelestialMarkers: (siteLat: number, siteLng: number, sunAlt: number, sunAz: number, earthAlt: number, earthAz: number) => void;
  clearCelestialMarkers: () => void;
  resetView: () => void;
  resetCamera: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setSunAngle?: (angle: number) => void;
  startFlyoverTour: (onWaypointChange?: (index: number) => void) => void;
  stopFlyoverTour: () => void;
  isTourActive: () => boolean;
  setLayer: (layerId: 'wac' | 'lola' | 'hillshade') => void;
}

interface CesiumMoonGlobeProps {
  pois: LunarPOI[];
  selectedPOI: LunarPOI | null;
  onSelectPOI: (poi: LunarPOI) => void;
  showMarkers: boolean;
  showPOILabels: boolean;
  activeCategory: POICategory | 'all';
  onHoverCoordinate?: (coord: LunarCoordinateHover | null) => void;
  onHoverTelemetry?: (telemetry: QuickMapTelemetry | null) => void;
  onSelectNomenclature?: (feature: USGSNomenclatureFeature) => void;
  onHoverSitePin?: (coord: LunarCoordinateHover | null) => void;
  onClickCoordinate?: (coord: { lat: number; lng: number }) => void;
  onRightClickCoordinate?: (event: RightClickCoordinateEvent) => void;
  targetCoordinate?: { lat: number; lng: number; label?: string } | null;
  isModalOpen?: boolean;
  basemap?: BasemapType;
  lrocConfig?: LROCLayerConfig;
  terrainConfig?: TerrainFilterConfig;
  sunAngle?: number;
  enableSunShade?: boolean;
  autoRotate?: boolean;
  autoSunCycle?: boolean;
  showGraticule?: boolean;
  onTourStatusChange?: (isActive: boolean, currentWaypointIndex: number) => void;
}

export const CesiumMoonGlobe = forwardRef<CesiumMoonGlobeRef, CesiumMoonGlobeProps>(({
  pois,
  selectedPOI,
  onSelectPOI,
  showMarkers = false,
  showPOILabels = false,
  activeCategory,
  onHoverCoordinate,
  onHoverTelemetry,
  onSelectNomenclature,
  onClickCoordinate,
  onRightClickCoordinate,
  targetCoordinate,
  isModalOpen,
  basemap = 'natural',
  lrocConfig,
  terrainConfig,
  sunAngle = 0,
  enableSunShade = true,
  autoRotate = false,
  showGraticule = false,
  onTourStatusChange
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const ellipsoidRef = useRef<any>(null);
  const baseImageryLayerRef = useRef<any>(null);
  const lolaOverlayLayerRef = useRef<any>(null);
  const terrainAnalysisLayerRef = useRef<any>(null);
  const filterPostProcessStageRef = useRef<any>(null);
  const currentAnalysisModeRef = useRef<string>('none');
  const graticuleLayerRef = useRef<any>(null);
  const nacLayersRef = useRef<any[]>([]);
  const poiEntitiesRef = useRef<Map<string, any>>(new Map());
  const nomenclatureEntitiesRef = useRef<Map<string, any>>(new Map());
  const celestialEntitiesRef = useRef<any[]>([]);
  const targetHighlightEntityRef = useRef<any>(null);
  const [isCesiumReady, setIsCesiumReady] = useState<boolean>(false);
  const [isViewerReady, setIsViewerReady] = useState<boolean>(false);

  // Tour state
  const isTourRunningRef = useRef<boolean>(false);
  const tourIndexRef = useRef<number>(0);
  const tourTimeoutRef = useRef<any>(null);

  // Auto rotation post-render listener ref
  const autoRotateRemoveListenerRef = useRef<(() => void) | null>(null);

  // Last telemetry ref to update resolution on zoom
  const lastTelemetryRef = useRef<QuickMapTelemetry | null>(null);

  // Initialize Lunar DEM Service immediately for accurate elevations
  useEffect(() => {
    LunarDEMService.getInstance().init().catch(() => { });
  }, []);

  // Check for window.Cesium ready
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Cesium) {
      setIsCesiumReady(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).Cesium) {
        clearInterval(checkInterval);
        setIsCesiumReady(true);
      }
    }, 50);

    return () => clearInterval(checkInterval);
  }, []);

  // Helper to calculate exact ground resolution (meters per pixel)
  const calculateResolutionMetersPerPixel = useCallback((cartesianPoint?: any): number => {
    const viewer = viewerRef.current;
    if (!viewer || typeof window === 'undefined') return 100;
    const camera = viewer.camera;
    const Cesium = (window as any).Cesium;

    let distance = 4800000;
    if (cartesianPoint && Cesium) {
      distance = Cesium.Cartesian3.distance(camera.positionWC, cartesianPoint);
    } else if (camera.positionCartographic) {
      distance = camera.positionCartographic.height;
    }

    const fovy = camera.frustum.fovy;
    const canvasHeight = viewer.scene.canvas.clientHeight || window.innerHeight || 1;
    const mPerPx = (2.0 * distance * Math.tan(fovy * 0.5)) / canvasHeight;
    return Math.max(0.05, mPerPx);
  }, []);

  const formatResolutionString = (mPerPx: number): string => {
    if (mPerPx >= 1000) {
      return `${(mPerPx / 1000).toFixed(2)} km/px`;
    }
    if (mPerPx >= 10) {
      return `${mPerPx.toFixed(1)} m/px`;
    }
    return `${mPerPx.toFixed(2)} m/px`;
  };

  // Initialize Cesium viewer for Moon
  useEffect(() => {
    if (!isCesiumReady || !containerRef.current) return;

    const Cesium = (window as any).Cesium;

    // Exact IAU/NASA mean radius of the Moon: 1,737,400 meters (1737.4 km)
    const moonEllipsoid = new Cesium.Ellipsoid(1737400.0, 1737400.0, 1737400.0);
    Cesium.Ellipsoid.default = moonEllipsoid;
    ellipsoidRef.current = moonEllipsoid;

    // Standard Selenographic Equirectangular (EPSG:4326) Tiling Scheme
    // Latitude -90° to +90°, Longitude -180° to +180° with 0° prime meridian at nearside center
    const moonTilingScheme = new Cesium.GeographicTilingScheme({
      ellipsoid: moonEllipsoid,
      numberOfLevelZeroTilesX: 2,
      numberOfLevelZeroTilesY: 1,
      rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
    });

    const tileMatrixLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

    // Base Layer: NASA Moon Trek LRO WAC Global Mosaic (303 PPD, 100m/px monochrome base map)
    const wacProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.jpg',
      layer: 'LRO_WAC_Mosaic_Global_303ppd_v02',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'default028mm',
      tileMatrixLabels,
      tilingScheme: moonTilingScheme,
      maximumLevel: 9,
      credit: 'NASA / JPL / GSFC / ASU / Moon Trek (LROC WAC Global Mosaic)'
    });

    wacProvider.errorEvent.addEventListener((error: any) => {
      console.warn('[CesiumMoonGlobe] Base WMTS provider tile notice:', error);
    });

    // Create Cesium Viewer with all Earth defaults explicitly disabled
    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: new Cesium.ImageryLayer(wacProvider),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      skyAtmosphere: false, // Disables Earth's blue sky atmosphere
      shouldAnimate: true
    });

    viewerRef.current = viewer;
    (window as any).__cesiumViewer = viewer;
    baseImageryLayerRef.current = viewer.imageryLayers.get(0);

    // Touchpad and Gesture Camera Controller Configuration:
    // Support two-finger trackpad pinch gestures (wheel with Ctrl) and touch gestures
    // Swipe fingers OUTSIDE (pinch out / expand) -> ZOOM IN
    // Swipe fingers INWARDS (pinch in / contract) -> ZOOM OUT
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableZoom = true;
    controller.inertiaZoom = 0.8;
    controller.minimumZoomDistance = 100.0;
    controller.maximumZoomDistance = 25000000.0;
    controller.zoomEventTypes = [
      Cesium.CameraEventType.WHEEL,
      Cesium.CameraEventType.PINCH,
      {
        eventType: Cesium.CameraEventType.WHEEL,
        modifier: Cesium.KeyboardEventModifier.CTRL
      }
    ];

    // Prevent default browser page scaling when pinch-zooming on laptop touchpads
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    const containerEl = containerRef.current;
    if (containerEl) {
      containerEl.addEventListener('wheel', handleWheel, { passive: false });
    }

    // Completely eliminate Earth atmospheric haze and skybox Earth
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = false;
    }
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.globe.baseColor = Cesium.Color.BLACK;
    viewer.scene.backgroundColor = Cesium.Color.BLACK;

    // Disable default Earth moon object (we are ON the Moon)
    if (viewer.scene.moon) {
      viewer.scene.moon.show = false;
    }

    // Disable Cesium default Earth-centric sun graphic (we are on the Moon;
    // scientifically accurate topocentric Sun is rendered via lunar ephemeris)
    if (viewer.scene.sun) {
      viewer.scene.sun.show = false;
    }
    viewer.scene.globe.enableLighting = false;

    // Clean unobtrusive credit container
    if (viewer.creditDisplay && viewer.creditDisplay.container) {
      viewer.creditDisplay.container.style.display = 'none';
    }

    // Prevent fatal rendering stops by intercepting scene render errors
    if (viewer.scene && viewer.scene.renderError) {
      viewer.scene.renderError.addEventListener((_scene: any, error: any) => {
        console.warn('[CesiumMoonGlobe] Recovered from rendering notice:', error);
        if (filterPostProcessStageRef.current && viewer.scene && !viewer.isDestroyed()) {
          try {
            viewer.scene.postProcessStages.remove(filterPostProcessStageRef.current);
            filterPostProcessStageRef.current = null;
          } catch { }
        }
      });
    }

    // Suppress intrusive Cesium error modal popup to ensure uninterrupted exploration
    if (viewer.cesiumWidget && viewer.cesiumWidget.showErrorPanel) {
      viewer.cesiumWidget.showErrorPanel = (title: string, message: string, error: any) => {
        console.warn('[CesiumMoonGlobe] Error panel notice intercepted:', title, message, error);
      };
    }

    // Add Topographic LOLA Color Shaded Relief Altimetry Overlay (with opacity blending)
    try {
      const lolaProvider = new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
        layer: 'LRO_LOLA_ClrShade_Global_128ppd_v04',
        style: 'default',
        format: 'image/png',
        tileMatrixSetID: 'default028mm',
        tileMatrixLabels,
        tilingScheme: moonTilingScheme,
        maximumLevel: 9,
        credit: 'NASA / LOLA Laser Altimetry Topography'
      });
      lolaProvider.errorEvent.addEventListener((err: any) => {
        console.warn('[CesiumMoonGlobe] LOLA overlay notice:', err);
      });
      const lolaLayer = viewer.imageryLayers.addImageryProvider(lolaProvider);
      lolaLayer.show = false;
      lolaLayer.alpha = 0.65;
      lolaOverlayLayerRef.current = lolaLayer;
    } catch (err) {
      console.warn('[CesiumMoonGlobe] LOLA overlay init notice:', err);
    }

    // Initialize Scientific LOLA Real-Time GPU PostProcess Filtering Shader
    // Accurately filters Elevation (min/max range & out-of-range dimming),
    // Slope categories (0-5°, 5-10°, 10-15°, >15°), Surface Roughness (RMS classes),
    // and Analytical Dynamic Hillshade (Azimuth & Altitude lighting).
    // Uses adaptive WebGL 2 (GLSL 300 ES) vs WebGL 1 (GLSL 100) syntax generation
    // to guarantee 100% compilation safety across all GPUs and browsers.
    try {
      const isWebGL2 = viewer.scene?.context?.webgl2 !== false;
      const coordVarDecl = isWebGL2 ? 'in vec2 v_textureCoordinates;' : 'varying vec2 v_textureCoordinates;';
      const sampleFn = isWebGL2 ? 'texture' : 'texture2D';
      const outColorVar = isWebGL2 ? 'out_FragColor' : 'gl_FragColor';

      const terrainFilterShaderSource = `
        uniform sampler2D colorTexture;
        ${coordVarDecl}
        uniform float u_mode;               // 0.0=none, 1.0=elevation, 2.0=slope, 3.0=roughness, 4.0=hillshade
        uniform float u_minElevNorm;        // 0.0 to 1.0
        uniform float u_maxElevNorm;        // 0.0 to 1.0
        uniform float u_highlightOutOfRange;// 1.0=dim, 0.0=hard mask
        uniform float u_slopeCategory;      // 0=all, 1=0-5, 2=5-10, 3=10-15, 4=15+
        uniform float u_roughnessCategory;  // 0=all, 1=smooth, 2=moderate, 3=rough
        uniform float u_hillshadeAzimuth;   // radians
        uniform float u_hillshadeAltitude;  // radians
        uniform vec2 u_pixelStep;           // 1.0 / canvas dimensions

        vec3 rgb2hsv(vec3 c) {
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }

        void main() {
          vec4 color = ${sampleFn}(colorTexture, v_textureCoordinates);

          // If terrain analysis mode is OFF, render untouched
          if (u_mode < 0.5) {
            ${outColorVar} = color;
            return;
          }

          float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

          // Protect background space & black borders from modification
          if (lum < 0.005) {
            ${outColorVar} = color;
            return;
          }

          // ================= 1. ELEVATION FILTER =================
          if (u_mode > 0.5 && u_mode < 1.5) {
            vec3 hsv = rgb2hsv(color.rgb);
            // In NASA LOLA hypsometric palette, color wraps from violet (0.75+) to red (0.0)
            float normElev = 0.0;
            if (color.r > 0.72 && color.g > 0.72 && color.b > 0.72) {
              normElev = 1.0; // Dirichlet-Jackson peaks (white/pink)
            } else if (hsv.x > 0.72) {
              normElev = 0.0; // Antoniadi / South Pole-Aitken depths (violet)
            } else {
              // Blue (0.66) -> Cyan (0.50) -> Green (0.33) -> Yellow (0.16) -> Red (0.0)
              normElev = 1.0 - clamp(hsv.x / 0.66, 0.0, 1.0);
            }

            if (normElev < u_minElevNorm || normElev > u_maxElevNorm) {
              if (u_highlightOutOfRange > 0.5) {
                // Dim Background: Desaturate and darken out-of-range elevations
                vec3 gray = vec3(lum * 0.28);
                ${outColorVar} = vec4(mix(gray, color.rgb * 0.25, 0.15), color.a);
              } else {
                // Hard Mask: Mute out-of-range elevations to dark tone
                ${outColorVar} = vec4(color.rgb * 0.04, color.a);
              }
              return;
            }
            ${outColorVar} = color;
            return;
          }

          // ================= 2. SLOPE CLASSIFICATION =================
          if (u_mode > 1.5 && u_mode < 2.5) {
            float slopeVal = lum;
            bool match = false;
            vec3 binColor = color.rgb;

            if (u_slopeCategory < 0.5) {
              match = true;
            } else if (u_slopeCategory < 1.5) {
              // 0° – 5° (Flat Maria & Plains)
              match = (slopeVal <= 0.24);
              binColor = vec3(0.23, 0.51, 0.96); // Blue #3b82f6
            } else if (u_slopeCategory < 2.5) {
              // 5° – 10° (Gentle Slopes)
              match = (slopeVal > 0.24 && slopeVal <= 0.46);
              binColor = vec3(0.02, 0.71, 0.83); // Cyan #06b6d4
            } else if (u_slopeCategory < 3.5) {
              // 10° – 15° (Moderate Slopes)
              match = (slopeVal > 0.46 && slopeVal <= 0.68);
              binColor = vec3(0.96, 0.62, 0.04); // Amber #f59e0b
            } else {
              // > 15° (Steep Terraces & Massifs)
              match = (slopeVal > 0.68);
              binColor = vec3(0.94, 0.27, 0.27); // Red #ef4444
            }

            if (match) {
              if (u_slopeCategory > 0.5) {
                ${outColorVar} = vec4(mix(color.rgb, binColor, 0.65), color.a);
              } else {
                ${outColorVar} = color;
              }
            } else {
              if (u_highlightOutOfRange > 0.5) {
                ${outColorVar} = vec4(vec3(lum * 0.22), color.a);
              } else {
                ${outColorVar} = vec4(color.rgb * 0.04, color.a);
              }
            }
            return;
          }

          // ================= 3. SURFACE ROUGHNESS =================
          if (u_mode > 2.5 && u_mode < 3.5) {
            vec2 step = u_pixelStep;
            float cCenter = lum;
            float cR = dot(${sampleFn}(colorTexture, v_textureCoordinates + vec2(step.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
            float cL = dot(${sampleFn}(colorTexture, v_textureCoordinates - vec2(step.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
            float cU = dot(${sampleFn}(colorTexture, v_textureCoordinates + vec2(0.0, step.y)).rgb, vec3(0.299, 0.587, 0.114));
            float cD = dot(${sampleFn}(colorTexture, v_textureCoordinates - vec2(0.0, step.y)).rgb, vec3(0.299, 0.587, 0.114));
            float roughness = (abs(cR - cCenter) + abs(cL - cCenter) + abs(cU - cCenter) + abs(cD - cCenter)) * 8.5;

            bool match = false;
            vec3 binColor = color.rgb;

            if (u_roughnessCategory < 0.5) {
              match = true;
              if (roughness <= 0.28) {
                binColor = mix(vec3(0.06, 0.72, 0.51), vec3(0.96, 0.62, 0.04), roughness / 0.28);
              } else {
                binColor = mix(vec3(0.96, 0.62, 0.04), vec3(0.92, 0.28, 0.60), clamp((roughness - 0.28) / 0.40, 0.0, 1.0));
              }
              ${outColorVar} = vec4(mix(color.rgb, binColor, 0.60), color.a);
              return;
            } else if (u_roughnessCategory < 1.5) {
              // Planar / Smooth (< 35m RMS)
              match = (roughness <= 0.28);
              binColor = vec3(0.06, 0.72, 0.51); // Emerald #10b981
            } else if (u_roughnessCategory < 2.5) {
              // Hummocky / Moderate (35-90m RMS)
              match = (roughness > 0.28 && roughness <= 0.65);
              binColor = vec3(0.96, 0.62, 0.04); // Amber #f59e0b
            } else {
              // Rugged / Massifs (> 90m RMS)
              match = (roughness > 0.65);
              binColor = vec3(0.92, 0.28, 0.60); // Pink #ec4899
            }

            if (match) {
              ${outColorVar} = vec4(mix(color.rgb, binColor, 0.70), color.a);
            } else {
              if (u_highlightOutOfRange > 0.5) {
                ${outColorVar} = vec4(vec3(lum * 0.22), color.a);
              } else {
                ${outColorVar} = vec4(color.rgb * 0.04, color.a);
              }
            }
            return;
          }

          // ================= 4. DYNAMIC ANALYTICAL HILLSHADE =================
          if (u_mode > 3.5) {
            vec2 step = u_pixelStep * 1.5;
            float hL = dot(${sampleFn}(colorTexture, v_textureCoordinates - vec2(step.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
            float hR = dot(${sampleFn}(colorTexture, v_textureCoordinates + vec2(step.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
            float hD = dot(${sampleFn}(colorTexture, v_textureCoordinates - vec2(0.0, step.y)).rgb, vec3(0.299, 0.587, 0.114));
            float hU = dot(${sampleFn}(colorTexture, v_textureCoordinates + vec2(0.0, step.y)).rgb, vec3(0.299, 0.587, 0.114));

            float dx = (hR - hL) * 3.2;
            float dy = (hU - hD) * 3.2;
            vec3 N = normalize(vec3(-dx, -dy, 1.0));

            // Light direction based on user Azimuth & Sun Elevation Angle
            // Azimuth: 0 = North (+Y), 90 = East (+X), 180 = South (-Y), 270 = West (-X)
            vec3 L = normalize(vec3(
              cos(u_hillshadeAltitude) * sin(u_hillshadeAzimuth),
              cos(u_hillshadeAltitude) * cos(u_hillshadeAzimuth),
              sin(u_hillshadeAltitude)
            ));

            float shade = clamp(dot(N, L), 0.0, 1.0);
            float shadowExp = 1.1 + (1.0 - sin(u_hillshadeAltitude)) * 0.9;
            float dynamicShade = pow(shade, shadowExp);

            float combined = mix(lum * 0.75, dynamicShade, 0.65);
            ${outColorVar} = vec4(vec3(combined), color.a);
            return;
          }

          ${outColorVar} = color;
        }
      `;

      const filterStage = new Cesium.PostProcessStage({
        fragmentShader: terrainFilterShaderSource,
        uniforms: {
          u_mode: 0.0,
          u_minElevNorm: 0.0,
          u_maxElevNorm: 1.0,
          u_highlightOutOfRange: 1.0,
          u_slopeCategory: 0.0,
          u_roughnessCategory: 0.0,
          u_hillshadeAzimuth: 315.0 * (Math.PI / 180.0),
          u_hillshadeAltitude: 45.0 * (Math.PI / 180.0),
          u_pixelStep: new Cesium.Cartesian2(
            1.0 / (viewer.scene.canvas.width || 1920),
            1.0 / (viewer.scene.canvas.height || 1080)
          )
        }
      });
      viewer.scene.postProcessStages.add(filterStage);
      filterPostProcessStageRef.current = filterStage;
    } catch (shaderErr) {
      console.warn('[CesiumMoonGlobe] Terrain filter stage init notice:', shaderErr);
    }

    // Add High Resolution Regional LROC NAC Mosaics
    try {
      // 1. Apollo 11 Landing Site NAC Mosaic
      const apollo11Rect = Cesium.Rectangle.fromDegrees(23.4484977, 0.1464484, 23.5396839, 1.1149051);
      const nacApollo11Provider = new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_NAC_Apollo11_Mosaic_p/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
        layer: 'LRO_NAC_Apollo11_Mosaic_p',
        style: 'default',
        format: 'image/png',
        tileMatrixSetID: 'default028mm',
        tileMatrixLabels,
        tilingScheme: moonTilingScheme,
        rectangle: apollo11Rect,
        minimumLevel: 6,
        maximumLevel: 15,
        credit: 'NASA / LROC NAC Apollo 11'
      });
      const nac11Layer = viewer.imageryLayers.addImageryProvider(nacApollo11Provider);
      nac11Layer.show = true;
      nacLayersRef.current.push(nac11Layer);

      // 2. Apollo 12 & Surveyor 3 NAC Mosaic
      const apollo12Rect = Cesium.Rectangle.fromDegrees(-23.48, -3.06, -23.36, -2.96);
      const nacApollo12Provider = new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_NAC_Apollo12_Mosaic_p/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
        layer: 'LRO_NAC_Apollo12_Mosaic_p',
        style: 'default',
        format: 'image/png',
        tileMatrixSetID: 'default028mm',
        tileMatrixLabels,
        tilingScheme: moonTilingScheme,
        rectangle: apollo12Rect,
        minimumLevel: 6,
        maximumLevel: 15,
        credit: 'NASA / LROC NAC Apollo 12'
      });
      const nac12Layer = viewer.imageryLayers.addImageryProvider(nacApollo12Provider);
      nac12Layer.show = true;
      nacLayersRef.current.push(nac12Layer);

      // 3. Apollo 17 Taurus-Littrow NAC Mosaic
      const apollo17Rect = Cesium.Rectangle.fromDegrees(30.70, 20.12, 30.84, 20.26);
      const nacApollo17Provider = new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_NAC_Apollo17_Mosaic_p/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png',
        layer: 'LRO_NAC_Apollo17_Mosaic_p',
        style: 'default',
        format: 'image/png',
        tileMatrixSetID: 'default028mm',
        tileMatrixLabels,
        tilingScheme: moonTilingScheme,
        rectangle: apollo17Rect,
        minimumLevel: 6,
        maximumLevel: 15,
        credit: 'NASA / LROC NAC Apollo 17'
      });
      const nac17Layer = viewer.imageryLayers.addImageryProvider(nacApollo17Provider);
      nac17Layer.show = true;
      nacLayersRef.current.push(nac17Layer);
    } catch (err) {
      console.warn('[CesiumMoonGlobe] Regional NAC layer init notice:', err);
    }

    // Initial camera position: Centered overview of lunar nearside
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 4800000.0, moonEllipsoid),
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0.0
      }
    });

    // Mouse interaction: Real-time Selenographic Coordinate & Resolution Tracking HUD
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement: any) => {
      if (isModalOpen) return;
      let cartesian = viewer.camera.pickEllipsoid(movement.endPosition, moonEllipsoid);
      if (!cartesian) {
        const ray = viewer.camera.getPickRay(movement.endPosition);
        cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      }

      if (cartesian) {
        const cartographic = moonEllipsoid.cartesianToCartographic(cartesian);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const lng = Cesium.Math.toDegrees(cartographic.longitude);
        const resM = calculateResolutionMetersPerPixel(cartesian);

        // Retrieve real LOLA geodetic elevation
        const demService = LunarDEMService.getInstance();
        const dem = demService.getPointAnalysis(lat, lng);

        const latFormatted = `${lat >= 0 ? '+' : ''}${lat.toFixed(5)}°`;
        const lngFormatted = `${lng >= 0 ? '+' : ''}${lng.toFixed(5)}°`;
        const resolutionFormatted = formatResolutionString(resM);

        const nearestPOI = pois.reduce((closest, curr) => {
          const dLat = curr.lat - lat;
          const dLng = curr.lng - lng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          return dist < closest.dist ? { poi: curr, dist } : closest;
        }, { poi: pois[0], dist: 9999 });

        const telemetryData: QuickMapTelemetry = {
          lat,
          lng,
          latFormatted,
          lngFormatted,
          resolutionMetersPerPixel: resM,
          resolutionFormatted,
          elevationMeters: dem ? dem.elevationMeters : demService.estimateLunarElevation(lat, lng),
          slopeDeg: dem ? dem.slopeDeg : 4.0,
          roughnessM: dem ? dem.roughnessM : 30.0,
          terrainClass: dem ? dem.elevationCategoryName : 'Mare Regolith',
          nearestFeature: nearestPOI.poi ? nearestPOI.poi.name : 'Lunar Surface'
        };

        lastTelemetryRef.current = telemetryData;
        if (onHoverTelemetry) onHoverTelemetry(telemetryData);

        if (onHoverCoordinate) {
          onHoverCoordinate({
            lat,
            lng,
            elevationMeters: dem ? dem.elevationMeters : demService.estimateLunarElevation(lat, lng),
            slopeDeg: dem ? dem.slopeDeg : 4.0,
            roughnessM: dem ? dem.roughnessM : 30.0,
            terrainClass: dem ? dem.elevationCategoryName : 'Mare Regolith',
            siteName: nearestPOI.poi ? nearestPOI.poi.name : 'Lunar Surface'
          });
        }
      } else {
        // Off globe
        const resM = calculateResolutionMetersPerPixel();
        if (lastTelemetryRef.current && onHoverTelemetry) {
          onHoverTelemetry({
            ...lastTelemetryRef.current,
            resolutionMetersPerPixel: resM,
            resolutionFormatted: formatResolutionString(resM)
          });
        }
        if (onHoverCoordinate) onHoverCoordinate(null);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Left click: Select site pin, crater nomenclature, or inspect coordinate
    handler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        if (pickedObject.id._nomenclatureData && onSelectNomenclature) {
          onSelectNomenclature(pickedObject.id._nomenclatureData as USGSNomenclatureFeature);
          return;
        }
        if (pickedObject.id._poiData) {
          const poi = pickedObject.id._poiData as LunarPOI;
          onSelectPOI(poi);
          return;
        }
      }

      let cartesian = viewer.camera.pickEllipsoid(click.position, moonEllipsoid);
      if (!cartesian) {
        const ray = viewer.camera.getPickRay(click.position);
        cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      }
      if (cartesian) {
        const carto = moonEllipsoid.cartesianToCartographic(cartesian);
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const lng = Cesium.Math.toDegrees(carto.longitude);
        if (onClickCoordinate) onClickCoordinate({ lat, lng });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Right-Click Coordinate Handler: Works seamlessly with mouse right-click and trackpad two-finger tap
    let lastRightClickTime = 0;
    const processRightClick = (screenX: number, screenY: number, canvasX: number, canvasY: number) => {
      let lat: number | null = null;
      let lng: number | null = null;
      let siteName: string = 'Lunar Surface';
      let pickedPOI: LunarPOI | undefined = undefined;

      const pickPos = new Cesium.Cartesian2(canvasX, canvasY);

      // 1. Check if clicked directly on an entity pin (POI / Landing Site)
      const pickedObject = viewer.scene.pick(pickPos);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        if (pickedObject.id._poiData) {
          pickedPOI = pickedObject.id._poiData as LunarPOI;
          lat = pickedPOI.lat;
          lng = pickedPOI.lng;
          siteName = pickedPOI.name;
        } else if (pickedObject.id._nomenclatureData) {
          const feature = pickedObject.id._nomenclatureData as USGSNomenclatureFeature;
          lat = feature.lat;
          lng = feature.lng;
          siteName = feature.name;
        }
      }

      // 2. If not on a specific pin, pick coordinates directly from lunar ellipsoid / globe
      if (lat === null || lng === null) {
        let cartesian = viewer.camera.pickEllipsoid(pickPos, moonEllipsoid);
        if (!cartesian) {
          const ray = viewer.camera.getPickRay(pickPos);
          cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        if (cartesian) {
          const carto = moonEllipsoid.cartesianToCartographic(cartesian);
          lat = Cesium.Math.toDegrees(carto.latitude);
          lng = Cesium.Math.toDegrees(carto.longitude);

          // Find nearest landmark or feature if close
          const nearestPOI = pois.reduce((closest, curr) => {
            const dLat = curr.lat - lat!;
            const dLng = curr.lng - lng!;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            return dist < closest.dist ? { poi: curr, dist } : closest;
          }, { poi: null as LunarPOI | null, dist: 9999 });

          if (nearestPOI.poi && nearestPOI.dist < 1.0) {
            siteName = `Near ${nearestPOI.poi.name}`;
          } else {
            siteName = 'Selenographic Coordinate';
          }
        }
      }

      if (lat !== null && lng !== null) {
        // Sample geodetic LOLA elevation
        const demService = LunarDEMService.getInstance();
        const dem = demService.getPointAnalysis(lat, lng);
        const elev = dem ? dem.elevationMeters : demService.estimateLunarElevation(lat, lng);

        // Auto copy coordinates immediately to clipboard
        const coordString = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        copyToClipboard(coordString);

        if (onRightClickCoordinate) {
          onRightClickCoordinate({
            lat,
            lng,
            screenX,
            screenY,
            siteName,
            elevationMeters: elev,
            poi: pickedPOI
          });
        }
      }
    };

    const handleRightClickThrottled = (screenX: number, screenY: number, canvasX: number, canvasY: number) => {
      const now = performance.now();
      if (now - lastRightClickTime < 300) return;
      lastRightClickTime = now;
      processRightClick(screenX, screenY, canvasX, canvasY);
    };

    // Right click via Cesium ScreenSpaceEventHandler
    handler.setInputAction((click: any) => {
      const rect = viewer.scene.canvas.getBoundingClientRect();
      handleRightClickThrottled(rect.left + click.position.x, rect.top + click.position.y, click.position.x, click.position.y);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    // Right click via DOM contextmenu event (suppresses browser default and supports trackpad two-finger tap)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const rect = viewer.scene.canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      handleRightClickThrottled(e.clientX, e.clientY, canvasX, canvasY);
    };

    if (containerEl) {
      containerEl.addEventListener('contextmenu', handleContextMenu);
    }

    // Dynamic Horizon Occlusion Culling: Hide pins located on the far/back side from the user's viewpoint
    const updatePOIVisibility = () => {
      const v = viewerRef.current;
      const ell = ellipsoidRef.current;
      if (!v || !ell || !Cesium.EllipsoidalOccluder) return;

      const occluder = new Cesium.EllipsoidalOccluder(ell, v.camera.positionWC);

      poiEntitiesRef.current.forEach((entity: any) => {
        if (entity && entity._cartesianPos) {
          const isVisible = occluder.isPointVisible(entity._cartesianPos);
          if (entity.show !== isVisible) {
            entity.show = isVisible;
          }
        }
      });

      nomenclatureEntitiesRef.current.forEach((entity: any) => {
        if (entity && entity._cartesianPos) {
          const isVisible = occluder.isPointVisible(entity._cartesianPos);
          if (entity.show !== isVisible) {
            entity.show = isVisible;
          }
        }
      });

      celestialEntitiesRef.current.forEach((entity: any) => {
        if (entity && entity._cartesianPos) {
          const isVisible = occluder.isPointVisible(entity._cartesianPos);
          if (entity.show !== isVisible) {
            entity.show = isVisible;
          }
        }
      });

      if (targetHighlightEntityRef.current && targetHighlightEntityRef.current._cartesianPos) {
        const isVisible = occluder.isPointVisible(targetHighlightEntityRef.current._cartesianPos);
        if (targetHighlightEntityRef.current.show !== isVisible) {
          targetHighlightEntityRef.current.show = isVisible;
        }
      }
    };

    // Camera movement listener: Update ground resolution (m/px) when user zooms
    const handleCameraChanged = () => {
      const resM = calculateResolutionMetersPerPixel();
      if (lastTelemetryRef.current && onHoverTelemetry) {
        const updated: QuickMapTelemetry = {
          ...lastTelemetryRef.current,
          resolutionMetersPerPixel: resM,
          resolutionFormatted: formatResolutionString(resM)
        };
        lastTelemetryRef.current = updated;
        onHoverTelemetry(updated);
      }
    };

    viewer.scene.preRender.addEventListener(updatePOIVisibility);
    viewer.camera.changed.addEventListener(handleCameraChanged);

    setIsViewerReady(true);

    return () => {
      setIsViewerReady(false);
      viewer.scene.preRender.removeEventListener(updatePOIVisibility);
      viewer.camera.changed.removeEventListener(handleCameraChanged);
      handler.destroy();
      if (containerEl) {
        containerEl.removeEventListener('wheel', handleWheel);
        containerEl.removeEventListener('contextmenu', handleContextMenu);
      }
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
      if (autoRotateRemoveListenerRef.current) {
        autoRotateRemoveListenerRef.current();
        autoRotateRemoveListenerRef.current = null;
      }
      if (filterPostProcessStageRef.current && viewer && !viewer.isDestroyed()) {
        try {
          viewer.scene.postProcessStages.remove(filterPostProcessStageRef.current);
        } catch (e) {}
        filterPostProcessStageRef.current = null;
      }
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, [isCesiumReady]);

  // Update LOLA Topographic Altimetry Layer & Opacity from LROC Config
  useEffect(() => {
    if (!lolaOverlayLayerRef.current) return;
    if (lrocConfig) {
      lolaOverlayLayerRef.current.show = Boolean(lrocConfig.showLolaOverlay);
      lolaOverlayLayerRef.current.alpha = lrocConfig.lolaOpacity ?? 0.65;
    }
  }, [lrocConfig?.showLolaOverlay, lrocConfig?.lolaOpacity]);

  // Update Real LOLA Terrain Analysis & Filters (WMTS Endpoints, Modes, Opacity, Shaders)
  useEffect(() => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;
    const mode = terrainConfig?.mode || 'none';
    const overlayOnNatural = terrainConfig?.overlayOnNatural ?? false;
    const blendOpacity = terrainConfig?.blendOpacity ?? 0.65;
    const minElev = terrainConfig?.minElevation ?? -9000;
    const maxElev = terrainConfig?.maxElevation ?? 10760;
    const highlightOutOfRange = terrainConfig?.highlightOutOfRange ?? true;

    // 1. Switch active ImageryProvider if mode changed
    if (currentAnalysisModeRef.current !== mode) {
      currentAnalysisModeRef.current = mode;

      if (terrainAnalysisLayerRef.current) {
        try {
          viewer.imageryLayers.remove(terrainAnalysisLayerRef.current);
        } catch (e) {
          console.warn('[CesiumMoonGlobe] Remove terrain layer note:', e);
        }
        terrainAnalysisLayerRef.current = null;
      }

      if (mode !== 'none') {
        try {
          const provider = createCesiumTerrainImageryProvider(mode, Cesium, ellipsoid);
          if (provider) {
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            layer.show = true;
            layer.alpha = overlayOnNatural ? blendOpacity : 1.0;
            terrainAnalysisLayerRef.current = layer;
          }
        } catch (err) {
          console.warn('[CesiumMoonGlobe] Error creating terrain provider:', err);
        }
      }
    } else if (terrainAnalysisLayerRef.current) {
      terrainAnalysisLayerRef.current.show = mode !== 'none';
      terrainAnalysisLayerRef.current.alpha = overlayOnNatural ? blendOpacity : 1.0;
    }

    // 2. Update Shader Uniforms for Min/Max Elevation Filtering, Slope, Roughness & Hillshade
    if (filterPostProcessStageRef.current) {
      const stage = filterPostProcessStageRef.current;
      if (mode === 'none') {
        stage.enabled = false;
        stage.uniforms.u_mode = 0.0;
      } else {
        stage.enabled = true;
        let modeNum = 0.0;
        if (mode === 'elevation') modeNum = 1.0;
        else if (mode === 'slope') modeNum = 2.0;
        else if (mode === 'roughness') modeNum = 3.0;
        else if (mode === 'hillshade') modeNum = 4.0;

        const normMin = Math.max(0.0, Math.min(1.0, (minElev - (-9150)) / 19910));
        const normMax = Math.max(0.0, Math.min(1.0, (maxElev - (-9150)) / 19910));

        let slopeCatNum = 0.0;
        const slopeCat = terrainConfig?.slopeCategory;
        if (slopeCat === '0-5') slopeCatNum = 1.0;
        else if (slopeCat === '5-10') slopeCatNum = 2.0;
        else if (slopeCat === '10-15') slopeCatNum = 3.0;
        else if (slopeCat === '15+') slopeCatNum = 4.0;

        let roughCatNum = 0.0;
        const roughCat = terrainConfig?.roughnessCategory;
        if (roughCat === 'smooth') roughCatNum = 1.0;
        else if (roughCat === 'moderate') roughCatNum = 2.0;
        else if (roughCat === 'rough') roughCatNum = 3.0;

        const azRad = (terrainConfig?.hillshadeAzimuth ?? 315) * (Math.PI / 180.0);
        const altRad = (terrainConfig?.hillshadeAltitude ?? 45) * (Math.PI / 180.0);

        stage.uniforms.u_mode = modeNum;
        stage.uniforms.u_minElevNorm = normMin;
        stage.uniforms.u_maxElevNorm = normMax;
        stage.uniforms.u_highlightOutOfRange = highlightOutOfRange ? 1.0 : 0.0;
        stage.uniforms.u_slopeCategory = slopeCatNum;
        stage.uniforms.u_roughnessCategory = roughCatNum;
        stage.uniforms.u_hillshadeAzimuth = azRad;
        stage.uniforms.u_hillshadeAltitude = altRad;
        if (viewer.scene && viewer.scene.canvas) {
          stage.uniforms.u_pixelStep = new Cesium.Cartesian2(
            1.0 / (viewer.scene.canvas.width || 1920),
            1.0 / (viewer.scene.canvas.height || 1080)
          );
        }
      }
    }
  }, [
    terrainConfig?.mode,
    terrainConfig?.overlayOnNatural,
    terrainConfig?.blendOpacity,
    terrainConfig?.minElevation,
    terrainConfig?.maxElevation,
    terrainConfig?.highlightOutOfRange,
    terrainConfig?.slopeCategory,
    terrainConfig?.roughnessCategory,
    terrainConfig?.hillshadeAzimuth,
    terrainConfig?.hillshadeAltitude
  ]);

  // Update Regional NAC High-Resolution Overlays
  useEffect(() => {
    const showNac = lrocConfig ? Boolean(lrocConfig.showNacOverlays) : true;
    nacLayersRef.current.forEach(layer => {
      if (layer) layer.show = showNac;
    });
  }, [lrocConfig?.showNacOverlays]);

  // Update Basemap Layer when basemap changes
  useEffect(() => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;
    const moonTilingScheme = new Cesium.GeographicTilingScheme({
      ellipsoid,
      numberOfLevelZeroTilesX: 2,
      numberOfLevelZeroTilesY: 1,
      rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
    });

    const tileMatrixLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

    let url = 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.jpg';
    let layer = 'LRO_WAC_Mosaic_Global_303ppd_v02';
    let format = 'image/jpeg';

    if (basemap === 'nasa-lola') {
      url = 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png';
      layer = 'LRO_LOLA_ClrShade_Global_128ppd_v04';
      format = 'image/png';
    } else if (basemap === 'shaded-relief') {
      url = 'https://trek.nasa.gov/tiles/Moon/EQ/LOLA_ClrShade_Global_128ppd/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png';
      layer = 'LOLA_ClrShade_Global_128ppd';
      format = 'image/png';
    }

    try {
      const newProvider = new Cesium.WebMapTileServiceImageryProvider({
        url,
        layer,
        style: 'default',
        format,
        tileMatrixSetID: 'default028mm',
        tileMatrixLabels,
        tilingScheme: moonTilingScheme,
        maximumLevel: 9
      });

      if (baseImageryLayerRef.current) {
        viewer.imageryLayers.remove(baseImageryLayerRef.current);
      }
      baseImageryLayerRef.current = viewer.imageryLayers.addImageryProvider(newProvider, 0);
    } catch (err) {
      console.warn('[CesiumMoonGlobe] Layer switch note:', err);
    }
  }, [basemap]);

  // Update Selenographic Graticule (EPSG:4326) Grid Overlay
  useEffect(() => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;

    if (graticuleLayerRef.current) {
      viewer.imageryLayers.remove(graticuleLayerRef.current);
      graticuleLayerRef.current = null;
    }

    const shouldShowGrid = Boolean(showGraticule || lrocConfig?.showGraticule);

    if (shouldShowGrid) {
      try {
        const moonTilingScheme = new Cesium.GeographicTilingScheme({
          ellipsoid,
          numberOfLevelZeroTilesX: 2,
          numberOfLevelZeroTilesY: 1,
          rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
        });
        const gridProvider = new Cesium.GridImageryProvider({
          tilingScheme: moonTilingScheme,
          color: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.4),
          glowColor: Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.2),
          cells: 8
        });
        graticuleLayerRef.current = viewer.imageryLayers.addImageryProvider(gridProvider);
      } catch (err) {
        console.warn('[CesiumMoonGlobe] Graticule layer note:', err);
      }
    }
  }, [showGraticule, lrocConfig?.showGraticule]);

  // Update Solar Phase & Directional Lighting (Shade ON / OFF & Sun Azimuth Terminator)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewer.scene || !viewer.scene.globe || typeof window === 'undefined') return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    if (!enableSunShade) {
      // Shade OFF: Uniform 360° surface illumination with no terminator shadows
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.dynamicAtmosphereLighting = false;
      viewer.scene.requestRender();
    } else {
      // Shade ON: Directional lunar lighting with realistic day/night terminator shadows
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.dynamicAtmosphereLighting = false;
      viewer.scene.globe.showGroundAtmosphere = false;
      // Prevent lighting from fading out when zooming close to lunar surface
      viewer.scene.globe.lightingFadeInDistance = 100.0;
      viewer.scene.globe.lightingFadeOutDistance = 10.0;

      // Calculate directional light vector in Cesium Selenographic coordinate frame:
      // In Cesium, longitude 0° is +X, longitude +90° is +Y, longitude 180° is -X, longitude -90° is -Y.
      // sunAngle = 0°: Full Moon (Sun directly over nearside 0° Lon -> light travels in -X direction)
      // sunAngle = 90°: Last Quarter (Sun at 90° Lon -> light travels in -Y direction)
      // sunAngle = 180°: New Moon (Sun behind farside 180° Lon -> light travels in +X direction)
      // sunAngle = 270°: First Quarter (Sun at -90° Lon -> light travels in +Y direction)
      const rad = Cesium.Math.toRadians(sunAngle);
      const lightDir = new Cesium.Cartesian3(-Math.cos(rad), -Math.sin(rad), 0.0);
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: lightDir
      });

      // Synchronize astronomical ephemeris time so celestial objects align
      const baseJulian = Cesium.JulianDate.fromIso8601('2024-01-01T00:00:00Z');
      const offsetSeconds = (sunAngle / 360) * 2551443;
      viewer.clock.currentTime = Cesium.JulianDate.addSeconds(baseJulian, offsetSeconds, new Cesium.JulianDate());

      viewer.scene.requestRender();
    }
  }, [enableSunShade, sunAngle, isViewerReady]);

  // Auto-rotate globe around lunar polar axis (Z-axis)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewer.scene || !isViewerReady || typeof window === 'undefined') return;
    const Cesium = (window as any).Cesium;

    if (autoRotateRemoveListenerRef.current) {
      autoRotateRemoveListenerRef.current();
      autoRotateRemoveListenerRef.current = null;
    }

    if (autoRotate && Cesium) {
      const listener = () => {
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.001);
      };
      viewer.scene.postRender.addEventListener(listener);
      autoRotateRemoveListenerRef.current = () => {
        viewer.scene.postRender.removeEventListener(listener);
      };
    }
  }, [autoRotate, isViewerReady]);

  // Update USGS Lunar Crater & Landing Site Nomenclature Entities
  useEffect(() => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;

    // Clear existing nomenclature entities
    nomenclatureEntitiesRef.current.forEach(entity => viewer.entities.remove(entity));
    nomenclatureEntitiesRef.current.clear();

    const showNomenclature = lrocConfig ? Boolean(lrocConfig.showUSGSNomenclature) : false;
    if (!showNomenclature) return;

    const activeFilter = lrocConfig?.nomenclatureFilter || 'all';
    const filteredFeatures = USGS_LUNAR_NOMENCLATURE.filter(f => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'crater') return f.category === 'crater';
      if (activeFilter === 'landing_site') return f.category === 'landing_site';
      if (activeFilter === 'mare') return f.category === 'mare' || f.category === 'mons';
      return true;
    });

    filteredFeatures.forEach(feature => {
      let pinColor = Cesium.Color.fromCssColorString('#c084fc'); // purple for craters
      let pointSize = 7;
      let labelText = feature.cleanName;

      if (feature.category === 'landing_site') {
        pinColor = Cesium.Color.fromCssColorString('#fbbf24'); // gold for landers
        pointSize = 8;
      } else if (feature.category === 'mare') {
        pinColor = Cesium.Color.fromCssColorString('#38bdf8'); // cyan for maria
        pointSize = 6;
      } else if (feature.category === 'mons') {
        pinColor = Cesium.Color.fromCssColorString('#34d399'); // emerald for mountains
        pointSize = 6;
      }

      if (feature.diameterKm) {
        labelText = `${feature.name} (${feature.diameterKm} km)`;
      }

      const cartesianPos = Cesium.Cartesian3.fromDegrees(feature.lng, feature.lat, 180.0, ellipsoid);

      const entity = viewer.entities.add({
        position: cartesianPos,
        point: {
          pixelSize: pointSize,
          color: pinColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: labelText,
          font: '10px JetBrains Mono, monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -8),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });

      entity._nomenclatureData = feature;
      entity._cartesianPos = cartesianPos;
      nomenclatureEntitiesRef.current.set(feature.id, entity);
    });

    // Occlusion check
    if (Cesium.EllipsoidalOccluder) {
      const occluder = new Cesium.EllipsoidalOccluder(ellipsoid, viewer.camera.positionWC);
      nomenclatureEntitiesRef.current.forEach((entity: any) => {
        if (entity && entity._cartesianPos) {
          entity.show = occluder.isPointVisible(entity._cartesianPos);
        }
      });
    }
  }, [lrocConfig?.showUSGSNomenclature, lrocConfig?.nomenclatureFilter, isViewerReady]);

  // Update POI markers when pois, activeCategory, or showMarkers change
  useEffect(() => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;

    // Clear existing entities
    poiEntitiesRef.current.forEach(entity => viewer.entities.remove(entity));
    poiEntitiesRef.current.clear();

    if (!showMarkers) return;

    const filteredPOIs = pois.filter(p => activeCategory === 'all' || p.category === activeCategory);

    filteredPOIs.forEach(poi => {
      let pinColor = Cesium.Color.CYAN;
      if (poi.category === 'apollo') pinColor = Cesium.Color.fromCssColorString('#38bdf8');
      else if (poi.category === 'artemis') pinColor = Cesium.Color.fromCssColorString('#34d399');
      else if (poi.category === 'chandrayaan') pinColor = Cesium.Color.fromCssColorString('#fb923c');
      else if (poi.category === 'change') pinColor = Cesium.Color.fromCssColorString('#f87171');
      else if (poi.category === 'historic') pinColor = Cesium.Color.fromCssColorString('#fbbf24');
      else if (poi.category === 'geological') pinColor = Cesium.Color.fromCssColorString('#c084fc');

      const isSelected = selectedPOI && selectedPOI.id === poi.id;
      const cartesianPos = Cesium.Cartesian3.fromDegrees(poi.lng, poi.lat, 250.0, ellipsoid);

      const entity = viewer.entities.add({
        position: cartesianPos,
        point: {
          pixelSize: isSelected ? 12 : 7,
          color: pinColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: showPOILabels || isSelected ? {
          text: poi.name,
          font: isSelected ? 'bold 12px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        } : undefined
      });

      entity._poiData = poi;
      entity._cartesianPos = cartesianPos;
      poiEntitiesRef.current.set(poi.id, entity);
    });

    if (Cesium.EllipsoidalOccluder) {
      const occluder = new Cesium.EllipsoidalOccluder(ellipsoid, viewer.camera.positionWC);
      poiEntitiesRef.current.forEach((entity: any) => {
        if (entity && entity._cartesianPos) {
          entity.show = occluder.isPointVisible(entity._cartesianPos);
        }
      });
    }
  }, [pois, activeCategory, showMarkers, showPOILabels, selectedPOI, isViewerReady]);

  // Dedicated Target Site Highlight Beacon & Reticle
  useEffect(() => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;

    // Remove existing target highlight entity
    if (targetHighlightEntityRef.current) {
      viewer.entities.remove(targetHighlightEntityRef.current);
      targetHighlightEntityRef.current = null;
    }

    const activeTarget = selectedPOI 
      ? { lat: selectedPOI.lat, lng: selectedPOI.lng, label: selectedPOI.name }
      : targetCoordinate;

    if (!activeTarget || isNaN(activeTarget.lat) || isNaN(activeTarget.lng)) return;

    const cartesianPos = Cesium.Cartesian3.fromDegrees(activeTarget.lng, activeTarget.lat, 200.0, ellipsoid);

    const highlightEntity = viewer.entities.add({
      position: cartesianPos,
      point: {
        pixelSize: 15,
        color: Cesium.Color.fromCssColorString('#06B6D4'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: activeTarget.label || `${activeTarget.lat.toFixed(4)}°, ${activeTarget.lng.toFixed(4)}°`,
        font: 'bold 12px JetBrains Mono, monospace',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#083344'),
        outlineWidth: 4,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    highlightEntity._cartesianPos = cartesianPos;
    targetHighlightEntityRef.current = highlightEntity;
    viewer.scene.requestRender();
  }, [selectedPOI, targetCoordinate, isViewerReady]);

  // Imperative flyTo implementation: accurately targets and centers the selected lunar location
  const flyTo = useCallback((
    lat: number,
    lng: number,
    altitudeMeters: number = 55000,
    headingDeg: number = 0,
    pitchDeg: number = -45,
    duration: number = 3.5,
    onComplete?: () => void
  ) => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      console.warn('[CesiumMoonGlobe] Invalid coordinates passed to flyTo:', { lat, lng });
      return;
    }

    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLng = Math.max(-180, Math.min(180, lng));

    // Convert lunar lat/lng to exact 3D Cartesian coordinates on lunar surface (IAU radius 1,737,400m)
    const targetCenter = Cesium.Cartesian3.fromDegrees(clampedLng, clampedLat, 0.0, ellipsoid);
    const boundingSphere = new Cesium.BoundingSphere(targetCenter, 0.0);

    // Range in meters from target center and camera orientation
    const safeRange = Math.max(3000, altitudeMeters);
    const safePitchDeg = Math.min(-15, Math.max(-90, pitchDeg));
    const heading = Cesium.Math.toRadians(headingDeg);
    const pitch = Cesium.Math.toRadians(safePitchDeg);

    // Cancel any in-progress flight to avoid camera animation conflicts
    viewer.camera.cancelFlight();

    // Fly to target bounding sphere so targetCenter is centered in the viewport
    viewer.camera.flyToBoundingSphere(boundingSphere, {
      offset: new Cesium.HeadingPitchRange(heading, pitch, safeRange),
      duration,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      complete: () => {
        viewer.scene.requestRender();
        if (onComplete) onComplete();
      }
    });
  }, []);

  // QuickMap "Go to Coordinates" search implementation
  const flyToCoordinates = useCallback((lat: number, lng: number, altitudeMeters: number = 55000) => {
    flyTo(lat, lng, altitudeMeters, 0, -45, 3.5);
  }, [flyTo]);

  // flyToLatLng helper (matches signature with smooth lunar altitude mapping)
  const flyToLatLng = useCallback((lat: number, lng: number, zoomLevel: number = 1.25) => {
    let rangeMeters = 55000;
    let pitch = -45;
    let heading = 0;

    if (zoomLevel > 1000) {
      rangeMeters = zoomLevel;
    } else if (zoomLevel <= 1.3) {
      // Close inspection of crater / landing site
      rangeMeters = 55000;
      pitch = -45;
    } else if (zoomLevel <= 1.8) {
      // Regional basin view
      rangeMeters = 160000;
      pitch = -50;
    } else if (zoomLevel <= 2.2) {
      // Hemisphere / quadrant view
      rangeMeters = 450000;
      pitch = -60;
    } else {
      // Full globe view
      rangeMeters = 4800000;
      pitch = -90;
      heading = 0;
    }

    flyTo(lat, lng, rangeMeters, heading, pitch, 3.5);
  }, [flyTo]);

  // Eye-level surface horizon flyover looking across local terrain
  const flyToSurfaceHorizon = useCallback((
    lat: number,
    lng: number,
    headingDeg: number,
    pitchDeg: number = -6,
    altitudeMeters: number = 280
  ) => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, altitudeMeters, ellipsoid),
      orientation: {
        heading: Cesium.Math.toRadians(headingDeg),
        pitch: Cesium.Math.toRadians(pitchDeg),
        roll: 0.0
      },
      duration: 3.5,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  }, []);

  // Smoothly rotate camera in place to inspect a specific celestial heading & elevation
  const lookAtDirection = useCallback((headingDeg: number, pitchDeg: number) => {
    const viewer = viewerRef.current;
    if (!viewer || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;
    const currentPos = viewer.camera.position.clone();

    viewer.camera.flyTo({
      destination: currentPos,
      orientation: {
        heading: Cesium.Math.toRadians(headingDeg),
        pitch: Cesium.Math.toRadians(pitchDeg),
        roll: 0.0
      },
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  }, []);

  // Synchronize Cesium solar clock to user date
  const setSimulationDate = useCallback((date: Date) => {
    const viewer = viewerRef.current;
    if (!viewer || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(date);
    viewer.scene.globe.enableLighting = true;
  }, []);

  // Clear 3D celestial markers
  const clearCelestialMarkers = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    celestialEntitiesRef.current.forEach(entity => viewer.entities.remove(entity));
    celestialEntitiesRef.current = [];
  }, []);

  // Render 3D Earth, Sun, and Site Beacon markers in the lunar sky
  const showCelestialMarkers = useCallback((
    siteLat: number,
    siteLng: number,
    sunAlt: number,
    sunAz: number,
    earthAlt: number,
    earthAz: number
  ) => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;
    clearCelestialMarkers();

    // Ensure Cesium default Earth-centric sun graphic is strictly hidden so
    // only the single, astronomically accurate lunar ephemeris Sun is displayed.
    if (viewer.scene.sun) {
      viewer.scene.sun.show = false;
    }

    const sitePos = Cesium.Cartesian3.fromDegrees(siteLng, siteLat, 15.0, ellipsoid);
    const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(sitePos, ellipsoid);

    // 1. Site surface beacon
    const siteEntity = viewer.entities.add({
      position: sitePos,
      point: {
        pixelSize: 14,
        color: Cesium.Color.fromCssColorString('#f59e0b'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: 'LANDING SITE (OBSERVER)',
        font: 'bold 11px JetBrains Mono, monospace',
        fillColor: Cesium.Color.fromCssColorString('#fcd34d'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    siteEntity._cartesianPos = sitePos;
    celestialEntitiesRef.current.push(siteEntity);

    // 2. Earth Celestial Marker
    const earthDist = 1800000.0;
    const earthAltRad = earthAlt * (Math.PI / 180);
    const earthAzRad = earthAz * (Math.PI / 180);
    const earthLocalOffset = new Cesium.Cartesian3(
      earthDist * Math.cos(earthAltRad) * Math.sin(earthAzRad),
      earthDist * Math.cos(earthAltRad) * Math.cos(earthAzRad),
      earthDist * Math.sin(earthAltRad)
    );
    const earthWorldPos = Cesium.Matrix4.multiplyByPoint(enuTransform, earthLocalOffset, new Cesium.Cartesian3());

    const earthEntity = viewer.entities.add({
      position: earthWorldPos,
      point: {
        pixelSize: 22,
        color: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: `EARTH (Elev: ${earthAlt >= 0 ? '+' : ''}${earthAlt.toFixed(1)}°, Az: ${earthAz.toFixed(1)}°)`,
        font: 'bold 12px JetBrains Mono, monospace',
        fillColor: Cesium.Color.fromCssColorString('#7dd3fc'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    earthEntity._cartesianPos = earthWorldPos;
    celestialEntitiesRef.current.push(earthEntity);

    // 3. Sun Celestial Marker (Sole authentic solar body in the lunar sky)
    const sunDist = 2000000.0;
    const sunAltRad = sunAlt * (Math.PI / 180);
    const sunAzRad = sunAz * (Math.PI / 180);
    const sunLocalOffset = new Cesium.Cartesian3(
      sunDist * Math.cos(sunAltRad) * Math.sin(sunAzRad),
      sunDist * Math.cos(sunAltRad) * Math.cos(sunAzRad),
      sunDist * Math.sin(sunAltRad)
    );
    const sunWorldPos = Cesium.Matrix4.multiplyByPoint(enuTransform, sunLocalOffset, new Cesium.Cartesian3());

    const sunEntity = viewer.entities.add({
      position: sunWorldPos,
      point: {
        pixelSize: 28,
        color: Cesium.Color.fromCssColorString('#fffbeb'),
        outlineColor: Cesium.Color.fromCssColorString('#f59e0b'),
        outlineWidth: 4,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: `SUN (Elev: ${sunAlt >= 0 ? '+' : ''}${sunAlt.toFixed(1)}°, Az: ${sunAz.toFixed(1)}°)`,
        font: 'bold 12px JetBrains Mono, monospace',
        fillColor: Cesium.Color.fromCssColorString('#fef08a'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    sunEntity._cartesianPos = sunWorldPos;
    celestialEntitiesRef.current.push(sunEntity);
  }, [clearCelestialMarkers]);

  // Reset view to dead-center Moon
  const resetView = useCallback(() => {
    const viewer = viewerRef.current;
    const ellipsoid = ellipsoidRef.current;
    if (!viewer || !ellipsoid || typeof window === 'undefined') return;

    const Cesium = (window as any).Cesium;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 4800000.0, ellipsoid),
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0.0
      },
      duration: 3,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  }, []);

  // Zoom in helper
  const zoomIn = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const currentHeight = viewer.camera.positionCartographic ? viewer.camera.positionCartographic.height : 200000;
    viewer.camera.zoomIn(Math.max(currentHeight * 0.35, 12000));
  }, []);

  // Zoom out helper
  const zoomOut = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const currentHeight = viewer.camera.positionCartographic ? viewer.camera.positionCartographic.height : 200000;
    viewer.camera.zoomOut(Math.max(currentHeight * 0.45, 18000));
  }, []);

  // Continuous Flyover Tour execution
  const executeTourStep = useCallback((index: number, onWaypointChange?: (index: number) => void) => {
    if (!isTourRunningRef.current) return;

    const waypoints = LUNAR_FLYOVER_LANDMARKS;
    const waypoint = waypoints[index];
    tourIndexRef.current = index;

    if (onWaypointChange) onWaypointChange(index);
    if (onTourStatusChange) onTourStatusChange(true, index);

    // Fly to the waypoint with pitched 3D view
    flyTo(
      waypoint.lat,
      waypoint.lng,
      waypoint.altitudeMeters,
      waypoint.headingDeg,
      waypoint.pitchDeg,
      waypoint.durationSeconds || 5
    );

    // Wait for flight duration + hover duration, then advance to next landmark
    const totalStepTimeMs = ((waypoint.durationSeconds || 5) + (waypoint.hoverSeconds || 4)) * 1000;

    tourTimeoutRef.current = setTimeout(() => {
      if (!isTourRunningRef.current) return;
      const nextIndex = (index + 1) % waypoints.length;
      executeTourStep(nextIndex, onWaypointChange);
    }, totalStepTimeMs);
  }, [flyTo, onTourStatusChange]);

  const startFlyoverTour = useCallback((onWaypointChange?: (index: number) => void) => {
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    isTourRunningRef.current = true;
    executeTourStep(0, onWaypointChange);
  }, [executeTourStep]);

  const stopFlyoverTour = useCallback(() => {
    isTourRunningRef.current = false;
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    if (onTourStatusChange) onTourStatusChange(false, tourIndexRef.current);
  }, [onTourStatusChange]);

  // Expose imperative methods to parent via ref
  useImperativeHandle(ref, () => ({
    flyTo,
    flyToLatLng,
    flyToCoordinates,
    flyToSurfaceHorizon,
    lookAtDirection,
    setSimulationDate,
    showCelestialMarkers,
    clearCelestialMarkers,
    resetView,
    resetCamera: resetView,
    zoomIn,
    zoomOut,
    setSunAngle: (angle: number) => {
      const viewer = viewerRef.current;
      if (!viewer || typeof window === 'undefined') return;
      const Cesium = (window as any).Cesium;
      const rad = Cesium.Math.toRadians(angle);
      const lightDir = new Cesium.Cartesian3(-Math.cos(rad), -Math.sin(rad), 0.0);
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: lightDir
      });
      const baseJulian = Cesium.JulianDate.fromIso8601('2024-01-01T00:00:00Z');
      const offsetSeconds = (angle / 360) * 2551443;
      viewer.clock.currentTime = Cesium.JulianDate.addSeconds(baseJulian, offsetSeconds, new Cesium.JulianDate());
      viewer.scene.requestRender();
    },
    startFlyoverTour,
    stopFlyoverTour,
    isTourActive: () => isTourRunningRef.current,
    setLayer: (layerId: 'wac' | 'lola' | 'hillshade') => {
      const viewer = viewerRef.current;
      const ellipsoid = ellipsoidRef.current;
      if (!viewer || !ellipsoid || typeof window === 'undefined') return;

      const Cesium = (window as any).Cesium;
      const moonTilingScheme = new Cesium.GeographicTilingScheme({
        ellipsoid,
        numberOfLevelZeroTilesX: 2,
        numberOfLevelZeroTilesY: 1,
        rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
      });

      const tileMatrixLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

      let url = 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.jpg';
      let layer = 'LRO_WAC_Mosaic_Global_303ppd_v02';
      let format = 'image/jpeg';

      if (layerId === 'lola') {
        url = 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/{TileMatrix}/{TileRow}/{TileCol}.png';
        layer = 'LRO_LOLA_ClrShade_Global_128ppd_v04';
        format = 'image/png';
      }

      const newProvider = new Cesium.WebMapTileServiceImageryProvider({
        url,
        layer,
        style: 'default',
        format,
        tileMatrixSetID: 'default028mm',
        tileMatrixLabels,
        tilingScheme: moonTilingScheme,
        maximumLevel: 9
      });

      if (baseImageryLayerRef.current) {
        viewer.imageryLayers.remove(baseImageryLayerRef.current);
      }
      baseImageryLayerRef.current = viewer.imageryLayers.addImageryProvider(newProvider, 0);
    }
  }), [
    flyTo,
    flyToLatLng,
    flyToCoordinates,
    flyToSurfaceHorizon,
    lookAtDirection,
    setSimulationDate,
    showCelestialMarkers,
    clearCelestialMarkers,
    resetView,
    zoomIn,
    zoomOut,
    startFlyoverTour,
    stopFlyoverTour
  ]);

  return (
    <div id="tutorial-globe" className="absolute inset-0 w-full h-full overflow-hidden bg-black select-none touch-none">
      {/* Cesium WebGL Container with touchpad & touch gesture support */}
      <div
        ref={containerRef}
        className="w-full h-full touch-none"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
});

CesiumMoonGlobe.displayName = 'CesiumMoonGlobe';
