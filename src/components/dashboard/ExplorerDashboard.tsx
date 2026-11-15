import { useState, useEffect, useCallback, useRef } from 'react';
import { CesiumMoonGlobe, CesiumMoonGlobeRef, RightClickCoordinateEvent } from '../cesium/CesiumMoonGlobe';
import { LunarFlyoverControl } from '../ui/LunarFlyoverControl';
import { Header } from '../ui/Header';
import { LayerControl } from '../ui/LayerControl';
import { TerrainAnalysisControl } from '../ui/TerrainAnalysisControl';
import { SolarPhaseControl } from '../ui/SolarPhaseControl';
import { CoordinateOverlay } from '../ui/CoordinateOverlay';
import { QuickMapBottomBar } from '../ui/QuickMapBottomBar';
import { LROCLayerSwitcher } from '../ui/LROCLayerSwitcher';
import { USGSNomenclatureModal } from '../ui/USGSNomenclatureModal';
import { POIInfoPanel } from '../ui/POIInfoPanel';
import { POISearchModal } from '../ui/POISearchModal';
import { HelpGuideModal } from '../ui/HelpGuideModal';
import { LunarSiteComparatorModal } from '../comparator/LunarSiteComparatorModal';
import { LunarHorizonObserverModal } from '../ephemeris/LunarHorizonObserverModal';
import { LunarMissionEvaluatorModal } from '../mission/LunarMissionEvaluatorModal';
import { HorizonObserverActiveHUD, ActiveHorizonState } from '../ui/HorizonObserverActiveHUD';
import { CoordinateContextMenu } from '../ui/CoordinateContextMenu';
import { CoordinateCopyToast, ToastData } from '../ui/CoordinateCopyToast';
import { WebsiteTutorial } from '../tutorial/WebsiteTutorial';
import { LUNAR_POIS } from '../../data/lunarPOIs';
import { USGSNomenclatureFeature } from '../../data/usgsLunarNomenclature';
import { BasemapType, LunarPOI, POICategory, LunarCoordinateHover, TerrainFilterConfig, ElevationCategory, QuickMapTelemetry, LROCLayerConfig } from '../../types/lunar';
import { MapPin, X, Check, ChevronLeft, ChevronRight, Loader2, GitCompare, Compass, Rocket, Layers } from 'lucide-react';
import * as THREE from 'three';
import { MapLayerId, fetchAndStitchNasaWmtsTiles, fetchAndStitchNasaDemBumpTexture } from '../../utils/nasaWmtsLoader';
import { copyToClipboard } from '../../utils/clipboard';
import { getInitialHorizonState, saveHorizonState } from '../../utils/horizonStatePersistence';
import { calculateLunarHorizonEphemeris } from '../../utils/lunarEphemeris';

interface ExplorerDashboardProps {
  onBackToLanding?: () => void;
  initialSiteId?: string | null;
}

export function ExplorerDashboard({ onBackToLanding, initialSiteId }: ExplorerDashboardProps) {
  const lunarSceneRef = useRef<CesiumMoonGlobeRef>(null);
  const lastUserActionTimestampRef = useRef<number>(0);

  // 3D Cinematic Flyover Tour state
  const [isFlyoverTourActive, setIsFlyoverTourActive] = useState<boolean>(false);
  const [currentFlyoverIndex, setCurrentFlyoverIndex] = useState<number>(0);

  // Atlas configuration state
  const [isLeftToolbarOpen, setIsLeftToolbarOpen] = useState<boolean>(true);
  const [basemap, setBasemap] = useState<BasemapType>('natural');
  const [sunAngle, setSunAngle] = useState<number>(0);
  const [enableSunShade, setEnableSunShade] = useState<boolean>(true); // Solar shade / terminator shadows
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [autoSunCycle, setAutoSunCycle] = useState<boolean>(false);
  const [showGraticule, setShowGraticule] = useState<boolean>(false); // clean by default
  const [showMarkers, setShowMarkers] = useState<boolean>(false);     // OFF by default
  const [showPOILabels, setShowPOILabels] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<POICategory | 'all'>('all');

  // LROC QuickMap Tile & WMTS Layer System state
  const [lrocConfig, setLrocConfig] = useState<LROCLayerConfig>({
    showWacBase: true,
    showLolaOverlay: false,
    lolaOpacity: 0.65,
    showNacOverlays: true,
    showUSGSNomenclature: false,
    showGraticule: false,
    nomenclatureFilter: 'all'
  });
  const [isLayerSwitcherOpen, setIsLayerSwitcherOpen] = useState<boolean>(false);
  const [quickMapTelemetry, setQuickMapTelemetry] = useState<QuickMapTelemetry | null>(null);
  const [selectedNomenclature, setSelectedNomenclature] = useState<USGSNomenclatureFeature | null>(null);

  // Scientific LOLA Terrain Analysis & Filtering System state
  const [terrainConfig, setTerrainConfig] = useState<TerrainFilterConfig>({
    mode: 'none',
    minElevation: -9000,
    maxElevation: 10760,
    elevationCategory: 'all',
    highlightOutOfRange: true,
    paletteId: 'lola',
    slopeCategory: 'all',
    roughnessCategory: 'all',
    hillshadeAzimuth: 315,
    hillshadeAltitude: 45,
    blendOpacity: 1.0,
    overlayOnNatural: false,
    continuousTargetElev: null,
    continuousWindowM: 1800
  });

  // NASA WMTS Map Layer surface texture state
  const [activeMapLayer, setActiveMapLayer] = useState<MapLayerId>('default');
  const [customTexture, setCustomTexture] = useState<THREE.Texture | null>(null);
  const [isStitchingTiles, setIsStitchingTiles] = useState<boolean>(false);
  const [stitchProgress, setStitchProgress] = useState<{ loaded: number; total: number } | null>(null);

  // Switch between Default Texture, NASA LRO WAC Global Mosaic, and NASA LOLA Color Elevation
  const handleSelectMapLayer = useCallback(async (layerId: MapLayerId) => {
    setActiveMapLayer(layerId);

    if (layerId === 'default') {
      setCustomTexture(null);
      setIsStitchingTiles(false);
      setStitchProgress(null);
      return;
    }

    setIsStitchingTiles(true);
    setStitchProgress({ loaded: 0, total: 32 });

    try {
      const stitchedTexture = await fetchAndStitchNasaWmtsTiles(layerId, (loaded, total) => {
        setStitchProgress({ loaded, total });
      });
      setCustomTexture(stitchedTexture);
    } catch (err) {
      console.error(`[MapLayer] Error stitching NASA WMTS tiles for ${layerId}:`, err);
    } finally {
      setIsStitchingTiles(false);
    }
  }, []);

  // NASA LOLA Grayscale Elevation DEM bumpMap state for realistic 3D crater and mountain relief
  const [nasaBumpTexture, setNasaBumpTexture] = useState<THREE.Texture | null>(null);
  const [isBumpReliefEnabled, setIsBumpReliefEnabled] = useState<boolean>(false);
  const [isStitchingBump, setIsStitchingBump] = useState<boolean>(false);

  // Automatically load NASA's grayscale elevation mosaic at zoom 2 onto a separate CanvasTexture
  useEffect(() => {
    let isMounted = true;
    setIsStitchingBump(true);

    fetchAndStitchNasaDemBumpTexture()
      .then(bumpTex => {
        if (isMounted) {
          setNasaBumpTexture(bumpTex);
          setIsStitchingBump(false);
        }
      })
      .catch(err => {
        console.warn('[ExplorerDashboard] Error loading NASA DEM bump texture:', err);
        if (isMounted) {
          setIsStitchingBump(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Prompt banner asking user if they want pins enabled (pins are now ON by default)
  const [showPinsPrompt, setShowPinsPrompt] = useState<boolean>(false);

  // Interactive selection state
  const [selectedPOI, setSelectedPOI] = useState<LunarPOI | null>(null);
  const [hoverCoordinate, setHoverCoordinate] = useState<LunarCoordinateHover | null>(null);
  const [clickedCoordinate, setClickedCoordinate] = useState<{ lat: number; lng: number } | null>(null);

  // Right-Click Selenographic Coordinate Context Menu and Toast State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    lat: number;
    lng: number;
    siteName?: string;
    elevationMeters?: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    lat: 0,
    lng: 0
  });

  const [copyToast, setCopyToast] = useState<ToastData | null>(null);

  const handleRightClickCoordinate = useCallback((event: RightClickCoordinateEvent) => {
    // 1. Immediately show copy feedback toast
    setCopyToast({
      title: '✓ Coordinates Copied to Clipboard',
      coordinates: `${event.lat.toFixed(5)}, ${event.lng.toFixed(5)}`,
      siteName: event.siteName
    });

    // 2. Open rich context menu at cursor position
    setContextMenu({
      isOpen: true,
      x: event.screenX,
      y: event.screenY,
      lat: event.lat,
      lng: event.lng,
      siteName: event.siteName,
      elevationMeters: event.elevationMeters
    });
  }, []);

  const handleCopyToastNotification = useCallback((coordString: string, siteName: string) => {
    setCopyToast({
      title: '✓ Coordinates Copied to Clipboard',
      coordinates: coordString,
      siteName
    });
  }, []);

  // Active hovered site/pin tracker ref: protects pin telemetry from being clobbered by canvas raycast pointerout
  const hoveredSiteRef = useRef<LunarCoordinateHover | null>(null);
  const pinLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Surface raycast handler (from LunarGlobe mesh pointermove/pointerout and Canvas background missed)
  const handleGlobeHoverCoordinate = useCallback((coord: LunarCoordinateHover | null) => {
    if (coord === null) {
      // If cursor is currently hovering a pin or site, DO NOT overwrite with null from canvas pointerout!
      if (hoveredSiteRef.current !== null) {
        return;
      }
      setHoverCoordinate(null);
    } else {
      // Valid lunar surface coordinate under cursor:
      // Clear any pending pin leave timer
      if (pinLeaveTimeoutRef.current) {
        clearTimeout(pinLeaveTimeoutRef.current);
        pinLeaveTimeoutRef.current = null;
      }
      hoveredSiteRef.current = null;
      setHoverCoordinate(coord);
    }
  }, []);

  // Explicit Pin & Toolbar Site hover handler (from POIMarkers pins and Header sites)
  const handleHoverSitePin = useCallback((coord: LunarCoordinateHover | null) => {
    if (pinLeaveTimeoutRef.current) {
      clearTimeout(pinLeaveTimeoutRef.current);
      pinLeaveTimeoutRef.current = null;
    }

    if (coord !== null) {
      hoveredSiteRef.current = coord;
      setHoverCoordinate(coord);
    } else {
      // Debounce clearing by 60ms to eliminate micro-jitter when moving within pin elements or transitioning
      pinLeaveTimeoutRef.current = setTimeout(() => {
        hoveredSiteRef.current = null;
        setHoverCoordinate(null);
        pinLeaveTimeoutRef.current = null;
      }, 60);
    }
  }, []);

  // Cleanup pin leave timeout on unmount
  useEffect(() => {
    return () => {
      if (pinLeaveTimeoutRef.current) {
        clearTimeout(pinLeaveTimeoutRef.current);
      }
    };
  }, []);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isComparatorOpen, setIsComparatorOpen] = useState<boolean>(false);
  const [isHorizonToolOpen, setIsHorizonToolOpen] = useState<boolean>(false);
  const [isMissionEvaluatorOpen, setIsMissionEvaluatorOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialStartStep, setTutorialStartStep] = useState<number>(0);
  const [searchModalInitialQuery, setSearchModalInitialQuery] = useState<string>('');

  // Automatic Welcome Tutorial activation on every fresh dashboard load / reload / return from Homepage
  useEffect(() => {
    const timer = setTimeout(() => {
      setTutorialStartStep(0);
      setIsTutorialOpen(true);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Active Horizon Observation HUD State
  // Always starts as null on page load — the HUD must only appear when the
  // user explicitly triggers an Orient-Sun or Orient-Earth action within the
  // current session. It must NOT be restored from localStorage on page open.
  const [activeHorizonState, setActiveHorizonState] = useState<ActiveHorizonState | null>(null);

  // Re-center camera to dead-center
  const handleResetView = useCallback(() => {
    lunarSceneRef.current?.resetCamera();
    lunarSceneRef.current?.clearCelestialMarkers();
    setActiveHorizonState(null);
    setSelectedPOI(null);
  }, []);

  // Quick Orient Sun from Active HUD
  const handleHUDOrientSun = useCallback(() => {
    if (!activeHorizonState) return;
    const ephemeris = calculateLunarHorizonEphemeris(new Date(), activeHorizonState.lat, activeHorizonState.lng);
    const targetPitch = Math.max(-10, ephemeris.sun.altitudeDeg);
    lunarSceneRef.current?.showCelestialMarkers(
      activeHorizonState.lat,
      activeHorizonState.lng,
      ephemeris.sun.altitudeDeg,
      ephemeris.sun.azimuthDeg,
      ephemeris.earth.altitudeDeg,
      ephemeris.earth.azimuthDeg
    );
    lunarSceneRef.current?.lookAtDirection(ephemeris.sun.azimuthDeg, targetPitch);
    saveHorizonState({
      lastAction: 'orient-sun',
      lastActionTimestamp: Date.now(),
      lastActionSummary: `Oriented at Sun (${ephemeris.sun.azimuthDeg}°, Alt ${ephemeris.sun.altitudeDeg}°) at ${activeHorizonState.siteName}`
    });
    setActiveHorizonState(prev => prev ? {
      ...prev,
      action: 'orient-sun',
      headingDeg: ephemeris.sun.azimuthDeg,
      pitchDeg: targetPitch,
      sunAlt: ephemeris.sun.altitudeDeg,
      sunAz: ephemeris.sun.azimuthDeg,
      timestamp: Date.now()
    } : null);
  }, [activeHorizonState]);

  // Quick Orient Earth from Active HUD
  const handleHUDOrientEarth = useCallback(() => {
    if (!activeHorizonState) return;
    const ephemeris = calculateLunarHorizonEphemeris(new Date(), activeHorizonState.lat, activeHorizonState.lng);
    const targetPitch = Math.max(-10, ephemeris.earth.altitudeDeg);
    lunarSceneRef.current?.showCelestialMarkers(
      activeHorizonState.lat,
      activeHorizonState.lng,
      ephemeris.sun.altitudeDeg,
      ephemeris.sun.azimuthDeg,
      ephemeris.earth.altitudeDeg,
      ephemeris.earth.azimuthDeg
    );
    lunarSceneRef.current?.lookAtDirection(ephemeris.earth.azimuthDeg, targetPitch);
    saveHorizonState({
      lastAction: 'orient-earth',
      lastActionTimestamp: Date.now(),
      lastActionSummary: `Oriented at Earth (${ephemeris.earth.azimuthDeg}°, Alt ${ephemeris.earth.altitudeDeg}°) at ${activeHorizonState.siteName}`
    });
    setActiveHorizonState(prev => prev ? {
      ...prev,
      action: 'orient-earth',
      headingDeg: ephemeris.earth.azimuthDeg,
      pitchDeg: targetPitch,
      earthAlt: ephemeris.earth.altitudeDeg,
      earthAz: ephemeris.earth.azimuthDeg,
      timestamp: Date.now()
    } : null);
  }, [activeHorizonState]);

  // Exit Horizon Observation Mode from Active HUD
  const handleHUDExit = useCallback(() => {
    lunarSceneRef.current?.clearCelestialMarkers();
    setActiveHorizonState(null);
  }, []);

  // Initial site selection if requested from landing page
  useEffect(() => {
    if (initialSiteId) {
      const poi = LUNAR_POIS.find(p => p.id === initialSiteId);
      if (poi) {
        setSelectedPOI(poi);
        setClickedCoordinate({ lat: poi.lat, lng: poi.lng });
        setShowMarkers(true);
        setShowPinsPrompt(false);
        const timer = setTimeout(() => {
          lunarSceneRef.current?.flyToLatLng(poi.lat, poi.lng, 1.7);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [initialSiteId]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === '?' || e.key === 'h') {
        setIsHelpOpen(prev => !prev);
      }
      if (e.key === 'g') {
        setShowGraticule(prev => !prev);
      }
      if (e.key === 'p') {
        setShowMarkers(prev => !prev);
      }
      if (e.key === 'r') {
        setAutoRotate(prev => !prev);
      }
      if (e.key === 's' || e.key === 'S') {
        setEnableSunShade(prev => !prev);
      }
      if (e.key === 'c') {
        handleResetView();
      }
      if (e.key === '+' || e.key === '=') {
        lunarSceneRef.current?.zoomIn();
      }
      if (e.key === '-' || e.key === '_') {
        lunarSceneRef.current?.zoomOut();
      }
      if (e.key === '[' || e.key === ']') {
        setIsLeftToolbarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetView]);

  const handleSelectPOI = useCallback((poi: LunarPOI) => {
    setSelectedPOI(poi);
    setClickedCoordinate({ lat: poi.lat, lng: poi.lng });
    // Automatically enable pins if user picked one
    setShowMarkers(true);
    setShowPinsPrompt(false);
    // Fly camera to site with close-up zoom (works whether pins are on or off)
    lunarSceneRef.current?.flyToLatLng(poi.lat, poi.lng, 1.25);
  }, []);

  // Dedicated coordinate navigator handler: flies directly to custom or searched lat/lng
  const handleNavigateCoordinate = useCallback((lat: number, lng: number, customPOI?: LunarPOI) => {
    if (customPOI) {
      setSelectedPOI(customPOI);
    }
    setClickedCoordinate({ lat, lng });
    setShowMarkers(true);
    setShowPinsPrompt(false);
    lunarSceneRef.current?.flyToLatLng(lat, lng, 1.25);
  }, []);

  // Dedicated handler when user touches any mission site filter in top header
  const handleCategoryChange = useCallback((cat: POICategory | 'all') => {
    setActiveCategory(cat);

    // Turn pins ON and dismiss prompt banner
    setShowMarkers(true);
    setShowPinsPrompt(false);

    const matchingPOIs = LUNAR_POIS.filter(p => cat === 'all' || p.category === cat);

    if (matchingPOIs.length === 1) {
      // Single mission site (e.g. Chandrayaan-3):
      // Automatically re-center to it and select it
      const singlePOI = matchingPOIs[0];
      setSelectedPOI(singlePOI);
      setClickedCoordinate({ lat: singlePOI.lat, lng: singlePOI.lng });
      lunarSceneRef.current?.flyToLatLng(singlePOI.lat, singlePOI.lng, 1.25);
    } else {
      // Multiple mission sites (e.g. Apollo, Chang'e, Artemis, Landmarks, or All Sites):
      // Show pins for all these sites!
      setSelectedPOI(null);
      setClickedCoordinate(null);

      if (cat === 'apollo') {
        // Apollo sites (Apollo 11, 12, 14, 15, 16, 17) are all on lunar near side
        // Center the near side with a wide overview so all 6 pins are in clear view
        lunarSceneRef.current?.flyToLatLng(0, 0, 2.0);
      } else if (cat === 'artemis') {
        // Artemis candidate regions are at lunar South Pole (-85° to -89.4° S)
        // Center the South Pole so all Artemis candidate pins are displayed clearly
        lunarSceneRef.current?.flyToLatLng(-89.0, 0, 1.6);
      } else if (cat === 'change') {
        // Chang'e sites: center on Mare Imbrium / near side
        lunarSceneRef.current?.flyToLatLng(25.0, -15.0, 1.8);
      } else if (cat === 'geological') {
        // Landmarks and South Pole craters:
        // Position camera to frame the lunar South Polar basin and crater cluster
        lunarSceneRef.current?.flyToLatLng(-80.0, 50.0, 1.65);
      } else if (cat === 'all') {
        // All sites: reset to full globe center view
        lunarSceneRef.current?.resetCamera();
      } else if (matchingPOIs.length > 0) {
        lunarSceneRef.current?.flyToLatLng(matchingPOIs[0].lat, matchingPOIs[0].lng, 1.8);
      }
    }
  }, []);

  // Dedicated re-center handler: always flies to current poi even if already selected
  const handleFocusSite = useCallback((poi: LunarPOI) => {
    lunarSceneRef.current?.flyToLatLng(poi.lat, poi.lng, 1.25);
  }, []);

  const handleClickCoordinate = useCallback((coord: { lat: number; lng: number }) => {
    setClickedCoordinate(coord);
  }, []);

  // Elevation color touch filter handler for LOLA Topography
  const handleSelectElevationCategory = useCallback((category: ElevationCategory) => {
    if (category === 'all') {
      setTerrainConfig(prev => ({
        ...prev,
        mode: 'elevation',
        elevationCategory: 'all',
        minElevation: -9000,
        maxElevation: 10760,
        continuousTargetElev: null
      }));
      return;
    }

    const ranges: Record<Exclude<ElevationCategory, 'all'>, [number, number]> = {
      basins: [-9000, -3000],
      lowlands: [-3000, -1000],
      intermediate: [-1000, 1000],
      highlands: [1000, 10760]
    };

    const [min, max] = ranges[category];
    setTerrainConfig(prev => ({
      ...prev,
      mode: 'elevation',
      elevationCategory: category,
      minElevation: min,
      maxElevation: max,
      continuousTargetElev: null
    }));
  }, []);

  const handleContinuousElevationChange = useCallback((elev: number | null) => {
    setTerrainConfig(prev => ({
      ...prev,
      mode: 'elevation',
      continuousTargetElev: elev,
      highlightOutOfRange: true
    }));
  }, []);

  const handleContinuousWindowChange = useCallback((windowM: number) => {
    setTerrainConfig(prev => ({
      ...prev,
      continuousWindowM: windowM
    }));
  }, []);

  // Sun angle update handler: discriminates user interactions from simulation loop frames
  const handleSunAngleChange = useCallback((newAngle: number, isUserAction: boolean = false) => {
    if (isUserAction) {
      lastUserActionTimestampRef.current = performance.now();
      // Synchronously update 3D lights and sun marker with zero frame latency
      lunarSceneRef.current?.setSunAngle?.(newAngle);
      setSunAngle(newAngle);
    } else {
      // Simulation loop frame from SunLighting:
      // Discard if user clicked a preset or moved slider within the last 150ms
      if (performance.now() - lastUserActionTimestampRef.current < 150) {
        return;
      }
      setSunAngle(newAngle);
    }
  }, []);

  // Real-time Solar Cycle Simulation animation loop (~8°/s)
  useEffect(() => {
    if (!autoSunCycle) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      // Discard tick if user just moved the slider or clicked a preset within 150ms
      if (performance.now() - lastUserActionTimestampRef.current >= 150) {
        setSunAngle(prev => (prev + dt * 8) % 360);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [autoSunCycle]);

  const categoryCounts = {
    all: LUNAR_POIS.length,
    apollo: LUNAR_POIS.filter(p => p.category === 'apollo').length,
    chandrayaan: LUNAR_POIS.filter(p => p.category === 'chandrayaan').length,
    artemis: LUNAR_POIS.filter(p => p.category === 'artemis').length,
    change: LUNAR_POIS.filter(p => p.category === 'change').length,
    geological: LUNAR_POIS.filter(p => p.category === 'geological').length,
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black text-slate-100 select-none">
      {/* CesiumJS High-Resolution Moon Globe: IAU lunar radius 1,737.4 km & NASA WMTS Streaming */}
      <CesiumMoonGlobe
        ref={lunarSceneRef}
        basemap={basemap}
        lrocConfig={lrocConfig}
        terrainConfig={terrainConfig}
        sunAngle={sunAngle}
        enableSunShade={enableSunShade}
        autoRotate={autoRotate}
        autoSunCycle={autoSunCycle}
        showGraticule={showGraticule}
        showMarkers={showMarkers}
        showPOILabels={showPOILabels}
        activeCategory={activeCategory}
        pois={LUNAR_POIS}
        selectedPOI={selectedPOI}
        targetCoordinate={clickedCoordinate ? { lat: clickedCoordinate.lat, lng: clickedCoordinate.lng, label: selectedPOI?.name } : null}
        onSelectPOI={handleSelectPOI}
        onHoverCoordinate={handleGlobeHoverCoordinate}
        onHoverTelemetry={setQuickMapTelemetry}
        onSelectNomenclature={setSelectedNomenclature}
        onHoverSitePin={handleHoverSitePin}
        onClickCoordinate={handleClickCoordinate}
        onRightClickCoordinate={handleRightClickCoordinate}
        isModalOpen={isSearchOpen || isHelpOpen || isComparatorOpen || isHorizonToolOpen || isMissionEvaluatorOpen || isLayerSwitcherOpen}
        onTourStatusChange={(active, index) => {
          setIsFlyoverTourActive(active);
          setCurrentFlyoverIndex(index);
        }}
      />

      {/* Top Header & Mission Category Filter */}
      <Header
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        onOpenSearch={(initialQuery?: string) => {
          setSearchModalInitialQuery(initialQuery || '');
          setIsSearchOpen(true);
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenTutorial={() => {
          setTutorialStartStep(1);
          setIsTutorialOpen(true);
        }}
        onOpenLayers={() => setIsLayerSwitcherOpen(prev => !prev)}
        totalPOICount={LUNAR_POIS.length}
        filteredCount={LUNAR_POIS.filter(p => activeCategory === 'all' || p.category === activeCategory).length}
        showMarkers={showMarkers}
        onToggleMarkers={() => {
          setShowMarkers(prev => !prev);
          setShowPinsPrompt(false);
        }}
        onResetView={handleResetView}
        categoryCounts={categoryCounts}
        pois={LUNAR_POIS}
        onHoverSite={handleHoverSitePin}
        onSelectSite={handleSelectPOI}
        onCopySiteCoordinates={handleCopyToastNotification}
        onBackToLanding={onBackToLanding}
        sunAngle={sunAngle}
        onSunAngleChange={handleSunAngleChange}
        autoSunCycle={autoSunCycle}
        onToggleAutoCycle={() => setAutoSunCycle(prev => !prev)}
        enableSunShade={enableSunShade}
        onToggleSunShade={() => setEnableSunShade(prev => !prev)}
      />

      {/* Left Sidebar Stack (Figma 7-Card Hierarchy) */}
      <div
        className={`absolute top-14 sm:top-16 left-3 sm:left-4 z-20 w-[316px] sm:w-[320px] pointer-events-none transition-transform duration-300 ease-in-out ${
          isLeftToolbarOpen ? 'translate-x-0' : '-translate-x-[115%]'
        }`}
      >
        {/* Toolbars Stack */}
        <div className="w-full max-h-[calc(100vh-7.5rem)] overflow-y-auto space-y-2 pb-2 pr-1 pointer-events-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Top Collapse Action: < LAYERS (Figma Reference) */}
          <div className="flex items-center justify-between pb-0.5">
            <button
              id="tutorial-layers-toggle"
              type="button"
              onClick={() => setIsLeftToolbarOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B101A] border border-[#1D2C3F] hover:border-cyan-500/50 text-[#06B6D4] text-xs font-mono font-bold uppercase transition-all shadow-md group cursor-pointer"
              title="Collapse Layers Sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#06B6D4] transition-transform group-hover:-translate-x-0.5" />
              <span>LAYERS</span>
            </button>
          </div>

          {/* Card 1: BASEMAP & OVERLAYS */}
          <div id="tutorial-card-basemap" className="pointer-events-auto">
            <LayerControl
              activeBasemap={basemap}
              onBasemapChange={async (newBasemap) => {
                setBasemap(newBasemap);
                if (newBasemap === 'natural') {
                  setCustomTexture(null);
                  setActiveMapLayer('default');
                  setTerrainConfig(prev => ({ ...prev, mode: 'none' }));
                } else if (newBasemap === 'nasa-lola') {
                  setActiveMapLayer('nasa-lola');
                  setTerrainConfig(prev => ({ ...prev, mode: 'none' }));
                  setIsStitchingTiles(true);
                  setStitchProgress({ loaded: 0, total: 32 });
                  try {
                    const stitched = await fetchAndStitchNasaWmtsTiles('nasa-lola', (loaded, total) => {
                      setStitchProgress({ loaded, total });
                    });
                    setCustomTexture(stitched);
                  } catch (err) {
                    console.error('[ExplorerDashboard] Error stitching NASA LOLA tiles:', err);
                  } finally {
                    setIsStitchingTiles(false);
                  }
                } else if (newBasemap === 'shaded-relief') {
                  setCustomTexture(null);
                  setActiveMapLayer('default');
                  setTerrainConfig(prev => ({ ...prev, mode: 'hillshade' }));
                }
              }}
              isLoadingTiles={isStitchingTiles}
              tileProgress={stitchProgress}
              continuousTargetElev={terrainConfig.continuousTargetElev}
              onContinuousElevationChange={handleContinuousElevationChange}
              continuousWindowM={terrainConfig.continuousWindowM}
              onContinuousWindowChange={handleContinuousWindowChange}
              elevationCategory={terrainConfig.elevationCategory}
              onSelectElevationCategory={handleSelectElevationCategory}
              showGraticule={showGraticule}
              onToggleGraticule={() => setShowGraticule(prev => !prev)}
              showMarkers={showMarkers}
              onToggleMarkers={() => {
                setShowMarkers(prev => !prev);
                setShowPinsPrompt(false);
              }}
              autoRotate={autoRotate}
              onToggleAutoRotate={() => setAutoRotate(prev => !prev)}
              enableSunShade={enableSunShade}
              onToggleSunShade={() => setEnableSunShade(prev => !prev)}
              isBumpActive={isBumpReliefEnabled}
              onToggleBump={() => setIsBumpReliefEnabled(prev => !prev)}
            />
          </div>

          {/* Card 2: TERRAIN ANALYSIS & FILTERS */}
          <div id="tutorial-card-terrain" className="pointer-events-auto">
            <TerrainAnalysisControl
              config={terrainConfig}
              onChangeConfig={(newConfig) => {
                setTerrainConfig(newConfig);
                if (newConfig.mode === 'hillshade') {
                  setBasemap('shaded-relief');
                } else if (newConfig.mode === 'none') {
                  setBasemap('natural');
                }
              }}
            />
          </div>

          {/* Card 3: LROC TILE LAYERS */}
          <div id="tutorial-card-lroc" className="pointer-events-auto">
            <div
              onClick={() => setIsLayerSwitcherOpen(true)}
              className="rounded-2xl bg-[#0B0F19]/95 border border-[#1E293B] hover:border-cyan-500/60 backdrop-blur-xl shadow-2xl p-2.5 sm:p-3 cursor-pointer transition-all hover:bg-cyan-950/20 group select-none"
              title="Open LROC QuickMap Tile & WMTS Layer Switcher"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#083344] border border-[#06B6D4]/60 text-[#06B6D4] flex items-center justify-center shrink-0 shadow-md shadow-cyan-950/40 group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                      LROC Tile Layers
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">
                      WAC, LOLA Altimetry &amp; NAC Mosaics
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#083344] text-[#22D3EE] border border-[#0E7490] group-hover:bg-cyan-900/50 transition-colors">
                  LAYERS
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: LUNAR SITE COMPARATOR */}
          <div id="tutorial-card-comparator" className="pointer-events-auto">
            <div
              onClick={() => setIsComparatorOpen(true)}
              className="rounded-2xl bg-[#0B0F19]/95 border border-[#1E293B] hover:border-purple-500/60 backdrop-blur-xl shadow-2xl p-2.5 sm:p-3 cursor-pointer transition-all hover:bg-purple-950/20 group select-none"
              title="Launch Lunar Site Comparator Tool"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#2E1065] border border-[#A855F7]/60 text-[#A855F7] flex items-center justify-center shrink-0 shadow-md shadow-purple-950/40 group-hover:scale-105 transition-transform">
                    <GitCompare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white group-hover:text-purple-300 transition-colors">
                      Lunar Site Comparator
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Dual Location Exploration Analysis
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#2E1065] text-[#D8B4FE] border border-[#7E22CE] group-hover:bg-purple-900/50 transition-colors">
                  COMPARE
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: CELESTIAL HORIZON */}
          <div id="tutorial-card-horizon" className="pointer-events-auto">
            <div
              onClick={() => setIsHorizonToolOpen(true)}
              className="rounded-2xl bg-[#0B0F19]/95 border border-[#1E293B] hover:border-amber-500/60 backdrop-blur-xl shadow-2xl p-2.5 sm:p-3 cursor-pointer transition-all hover:bg-amber-950/20 group select-none"
              title="Launch Lunar Celestial Horizon & Ephemeris Observer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#451A03] border border-[#F59E0B]/60 text-[#F59E0B] flex items-center justify-center shrink-0 shadow-md shadow-amber-950/40 group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white group-hover:text-amber-300 transition-colors">
                      Celestial Horizon
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Sun &amp; Earth Relative to Horizon
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#451A03] text-[#FCD34D] border border-[#B45309] group-hover:bg-amber-900/50 transition-colors">
                  HORIZON
                </span>
              </div>
            </div>
          </div>

          {/* Card 6: MISSION EVALUATOR */}
          <div id="tutorial-card-evaluator" className="pointer-events-auto">
            <div
              onClick={() => setIsMissionEvaluatorOpen(true)}
              className="rounded-2xl bg-[#0B0F19]/95 border border-[#1E293B] hover:border-blue-500/60 backdrop-blur-xl shadow-2xl p-2.5 sm:p-3 cursor-pointer transition-all hover:bg-blue-950/20 group select-none"
              title="Launch NASA/JPL Horizons Lunar Mission Feasibility Evaluator"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#172554] border border-[#3B82F6]/60 text-[#3B82F6] flex items-center justify-center shrink-0 shadow-md shadow-blue-950/40 group-hover:scale-105 transition-transform">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white group-hover:text-blue-300 transition-colors">
                      Mission Evaluator
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">
                      JPL Solar &amp; Comms Feasibility
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#172554] text-[#93C5FD] border border-[#1D4ED8] group-hover:bg-blue-900/50 transition-colors">
                  FEASIBILITY
                </span>
              </div>
            </div>
          </div>

          {/* Card 7: 3D FLYOVER & TOURS (Bottom card in Figma design) */}
          <div id="tutorial-card-flyover" className="pointer-events-auto">
            <LunarFlyoverControl
              onFlyToLandmark={(landmark) => {
                lunarSceneRef.current?.flyTo(
                  landmark.lat,
                  landmark.lng,
                  landmark.altitudeMeters,
                  landmark.headingDeg,
                  landmark.pitchDeg,
                  landmark.durationSeconds || 5
                );
              }}
              onStartTour={() => {
                lunarSceneRef.current?.startFlyoverTour((idx) => {
                  setCurrentFlyoverIndex(idx);
                });
                setIsFlyoverTourActive(true);
              }}
              onStopTour={() => {
                lunarSceneRef.current?.stopFlyoverTour();
                setIsFlyoverTourActive(false);
              }}
              isTourActive={isFlyoverTourActive}
              currentWaypointIndex={currentFlyoverIndex}
              onResetOverview={handleResetView}
            />
          </div>
        </div>
      </div>

      {/* Re-expand Sidebar Floating Pill (when collapsed) */}
      {!isLeftToolbarOpen && (
        <button
          type="button"
          onClick={() => setIsLeftToolbarOpen(true)}
          className="pointer-events-auto absolute top-16 left-3 p-2 px-3 rounded-xl bg-[#0B101A]/95 border border-[#1D2C3F] hover:border-cyan-500/60 text-[#06B6D4] text-xs font-mono font-bold uppercase shadow-2xl backdrop-blur-xl transition-all flex items-center gap-1.5 group cursor-pointer z-20"
          title="Expand Layers Sidebar"
        >
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          <span>LAYERS</span>
        </button>
      )}

      {/* User Option Floating Prompt: Ask if they want mission tags */}
      {showPinsPrompt && !showMarkers && (
        <div className="absolute top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-40 animate-fadeIn max-w-md w-[92%] sm:w-auto">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-space-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-xs font-mono">
            <div className="flex items-center gap-2.5 text-slate-200">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Display lunar landing sites & mission pins?</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setShowMarkers(true);
                  setShowPinsPrompt(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 transition-all font-semibold"
              >
                <Check className="w-3 h-3" />
                Yes, Show Pins
              </button>
              <button
                onClick={() => setShowPinsPrompt(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Keep Clean (Dismiss)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Right-Side Stack: POI Details Panel */}
      <aside className="absolute top-16 sm:top-20 right-3 sm:right-4 bottom-14 sm:bottom-16 z-20 pointer-events-none flex flex-col justify-end gap-2.5 sm:gap-3 w-[calc(100vw-1.5rem)] sm:w-[480px] max-w-full">
        {/* Slide-out Landing Site Details Card (takes remaining space, scrolls internally) */}
        <POIInfoPanel
          poi={selectedPOI}
          onClose={() => setSelectedPOI(null)}
          onFocusSite={handleFocusSite}
          onCopyCoordinates={handleCopyToastNotification}
        />
      </aside>

      {/* LROC QuickMap Selenographic Telemetry Bar & Go to Coordinates HUD */}
      <QuickMapBottomBar
        telemetry={quickMapTelemetry}
        onGoToCoordinates={(lat, lng, altitudeMeters) => {
          lunarSceneRef.current?.flyToCoordinates(lat, lng, altitudeMeters || 48000);
        }}
        onCenterMoon={handleResetView}
      />

      {/* LROC QuickMap Layer Switcher Panel */}
      <LROCLayerSwitcher
        isOpen={isLayerSwitcherOpen}
        onClose={() => setIsLayerSwitcherOpen(false)}
        config={lrocConfig}
        onChangeConfig={setLrocConfig}
        onFlyToNacTarget={(lat, lng, altitude) => {
          lunarSceneRef.current?.flyTo(lat, lng, altitude || 20000, 45, -35, 3.5);
        }}
      />

      {/* USGS Crater & Landing Site Nomenclature Inspector Modal */}
      <USGSNomenclatureModal
        feature={selectedNomenclature}
        onClose={() => setSelectedNomenclature(null)}
        onFlyToFeature={(lat, lng, altitude) => {
          lunarSceneRef.current?.flyTo(lat, lng, altitude || 30000, 45, -35, 3.5);
        }}
      />

      {/* Quick Search Modal & Coordinate Navigation Tool */}
      <POISearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pois={LUNAR_POIS}
        onSelectPOI={handleSelectPOI}
        onNavigateCoordinate={handleNavigateCoordinate}
        initialQuery={searchModalInitialQuery}
      />

      {/* Atlas User Guide & Scientific Calibration Modal */}
      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Lunar Site Comparator Centred Modal Popup */}
      <LunarSiteComparatorModal
        isOpen={isComparatorOpen}
        onClose={() => setIsComparatorOpen(false)}
      />

      {/* Active Horizon Observation Floating HUD Pill */}
      <HorizonObserverActiveHUD
        state={activeHorizonState}
        onReopenModal={() => setIsHorizonToolOpen(true)}
        onOrientSun={handleHUDOrientSun}
        onOrientEarth={handleHUDOrientEarth}
        onExit={handleHUDExit}
      />

      {/* Lunar Celestial Horizon & Ephemeris Observer Modal */}
      <LunarHorizonObserverModal
        isOpen={isHorizonToolOpen}
        onClose={() => {
          setIsHorizonToolOpen(false);
          // Keep 3D celestial markers rendered so the user can continue viewing them
        }}
        onActionTriggered={(payload) => {
          setActiveHorizonState(payload);
        }}
        onFlyToHorizon={(lat, lng, headingDeg, pitchDeg, altitudeMeters) => {
          lunarSceneRef.current?.flyToSurfaceHorizon(lat, lng, headingDeg, pitchDeg, altitudeMeters);
        }}
        onLookAtDirection={(headingDeg, pitchDeg) => {
          lunarSceneRef.current?.lookAtDirection(headingDeg, pitchDeg);
        }}
        onSetSimulationDate={(date) => {
          lunarSceneRef.current?.setSimulationDate(date);
        }}
        onShowCelestialMarkers={(siteLat, siteLng, sunAlt, sunAz, earthAlt, earthAz) => {
          lunarSceneRef.current?.showCelestialMarkers(siteLat, siteLng, sunAlt, sunAz, earthAlt, earthAz);
        }}
        currentHoverCoord={hoverCoordinate}
      />

      {/* NASA/JPL Lunar Mission Feasibility Evaluator Modal */}
      <LunarMissionEvaluatorModal
        isOpen={isMissionEvaluatorOpen}
        onClose={() => setIsMissionEvaluatorOpen(false)}
        onFlyToSite={(lat, lng, altitudeMeters) => {
          lunarSceneRef.current?.flyTo(lat, lng, altitudeMeters || 200000);
        }}
        onSetSimulationDate={(date) => {
          lunarSceneRef.current?.setSimulationDate(date);
        }}
        currentHoverCoord={hoverCoordinate}
      />

      {/* Right-Click Selenographic Coordinate Context Menu */}
      <CoordinateContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        lat={contextMenu.lat}
        lng={contextMenu.lng}
        siteName={contextMenu.siteName}
        elevationMeters={contextMenu.elevationMeters}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onFlyTo={(lat, lng) => {
          lunarSceneRef.current?.flyToCoordinates(lat, lng, 48000);
        }}
        onEvaluateMission={(lat, lng, siteName) => {
          setHoverCoordinate({
            lat,
            lng,
            elevationMeters: contextMenu.elevationMeters || 0,
            slopeDeg: 4.0,
            roughnessM: 30.0,
            terrainClass: 'Target Site',
            siteName: siteName || 'Target Site'
          });
          setIsMissionEvaluatorOpen(true);
        }}
      />

      {/* Floating Clipboard Copy Notification Toast */}
      <CoordinateCopyToast
        toast={copyToast}
        onDismiss={() => setCopyToast(null)}
      />

      {/* Interactive Website Tutorial / Guided User Tour */}
      <WebsiteTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onOpenSidebar={() => setIsLeftToolbarOpen(true)}
        initialStepIndex={tutorialStartStep}
      />
    </div>
  );
}

export default ExplorerDashboard;

