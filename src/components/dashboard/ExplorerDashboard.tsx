import { useState, useEffect, useCallback, useRef } from 'react';
import { LunarScene, LunarSceneRef } from '../canvas/LunarScene';
import { Header } from '../ui/Header';
import { LayerControl } from '../ui/LayerControl';
import { TerrainAnalysisControl } from '../ui/TerrainAnalysisControl';
import { SolarPhaseControl } from '../ui/SolarPhaseControl';
import { CoordinateOverlay } from '../ui/CoordinateOverlay';
import { POIInfoPanel } from '../ui/POIInfoPanel';
import { POISearchModal } from '../ui/POISearchModal';
import { HelpGuideModal } from '../ui/HelpGuideModal';
import { LUNAR_POIS } from '../../data/lunarPOIs';
import { BasemapType, LunarPOI, POICategory, LunarCoordinateHover, TerrainFilterConfig, ElevationCategory } from '../../types/lunar';
import { MapPin, X, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import * as THREE from 'three';
import { MapLayerOverlay } from '../ui/MapLayerOverlay';
import { MapLayerId, fetchAndStitchNasaWmtsTiles, fetchAndStitchNasaDemBumpTexture } from '../../utils/nasaWmtsLoader';

interface ExplorerDashboardProps {
  onBackToLanding?: () => void;
  initialSiteId?: string | null;
}

export function ExplorerDashboard({ onBackToLanding, initialSiteId }: ExplorerDashboardProps) {
  const lunarSceneRef = useRef<LunarSceneRef>(null);
  const lastUserActionTimestampRef = useRef<number>(0);

  // Atlas configuration state
  const [isLeftToolbarOpen, setIsLeftToolbarOpen] = useState<boolean>(true);
  const [basemap, setBasemap] = useState<BasemapType>('natural');
  const [sunAngle, setSunAngle] = useState<number>(35);
  const [enableSunShade, setEnableSunShade] = useState<boolean>(true); // Solar shade / terminator shadows
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [autoSunCycle, setAutoSunCycle] = useState<boolean>(false);
  const [showGraticule, setShowGraticule] = useState<boolean>(false); // clean by default
  const [showMarkers, setShowMarkers] = useState<boolean>(false);     // OFF by default
  const [showPOILabels, setShowPOILabels] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<POICategory | 'all'>('all');

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
  const [isBumpReliefEnabled, setIsBumpReliefEnabled] = useState<boolean>(true);
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

  // Prompt banner asking user if they want pins enabled
  const [showPinsPrompt, setShowPinsPrompt] = useState<boolean>(true);

  // Interactive selection state
  const [selectedPOI, setSelectedPOI] = useState<LunarPOI | null>(null);
  const [hoverCoordinate, setHoverCoordinate] = useState<LunarCoordinateHover | null>(null);
  const [clickedCoordinate, setClickedCoordinate] = useState<{ lat: number; lng: number } | null>(null);

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

  // Re-center camera to dead-center
  const handleResetView = useCallback(() => {
    lunarSceneRef.current?.resetCamera();
    setSelectedPOI(null);
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
    setBasemap('topographic');
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
    setBasemap('topographic');
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
      {/* 3D WebGL Lunar Globe Canvas: Centered Fullscreen Viewport */}
      <LunarScene
        ref={lunarSceneRef}
        basemap={basemap}
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
        onSelectPOI={handleSelectPOI}
        onSunAngleChange={handleSunAngleChange}
        onHoverCoordinate={handleGlobeHoverCoordinate}
        onHoverSitePin={handleHoverSitePin}
        onClickCoordinate={handleClickCoordinate}
        isModalOpen={isSearchOpen || isHelpOpen}
        customTexture={customTexture}
        customBumpTexture={isBumpReliefEnabled ? nasaBumpTexture : null}
        bumpScale={isBumpReliefEnabled ? 0.05 : 0}
        mapLayerId={activeMapLayer}
      />

      {/* Top Header & Mission Category Filter */}
      <Header
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
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
        onBackToLanding={onBackToLanding}
      />

      {/* Left Sidebar Stack: 1. MAP LAYER (WMTS)  2. BASEMAP & OVERLAYS  3. TERRAIN ANALYSIS & FILTERS */}
      <div
        className={`absolute top-16 sm:top-20 left-3 sm:left-4 bottom-3 sm:bottom-4 z-20 w-72 sm:w-80 pointer-events-none transition-transform duration-300 ease-in-out ${
          isLeftToolbarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Scrollable Toolbars Stack */}
        <div className="w-full h-full overflow-y-auto space-y-3 pb-4 pr-1.5 pointer-events-auto scrollbar-thin">
          {/* Section 1: MAP LAYER (NASA WMTS / DEFAULT) */}
          <div className="pointer-events-auto">
            <MapLayerOverlay
              activeLayer={activeMapLayer}
              onSelectLayer={handleSelectMapLayer}
              isLoading={isStitchingTiles}
              progress={stitchProgress}
              isBumpActive={isBumpReliefEnabled}
              onToggleBump={() => setIsBumpReliefEnabled(prev => !prev)}
              isLoadingBump={isStitchingBump}
            />
          </div>

          {/* Section 2: BASEMAP & OVERLAYS */}
          <div className="pointer-events-auto">
            <LayerControl
              activeBasemap={basemap}
              onBasemapChange={(newBasemap) => {
                setBasemap(newBasemap);
                if (newBasemap === 'natural') {
                  setTerrainConfig(prev => ({ ...prev, mode: 'none' }));
                } else if (newBasemap === 'topographic') {
                  setTerrainConfig(prev => ({
                    ...prev,
                    mode: 'elevation',
                    elevationCategory: prev.elevationCategory || 'all'
                  }));
                } else if (newBasemap === 'shaded-relief') {
                  setTerrainConfig(prev => ({ ...prev, mode: 'hillshade' }));
                }
              }}
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
              onCollapseToSide={() => setIsLeftToolbarOpen(false)}
            />
          </div>

          {/* Collapsible Section 2: TERRAIN ANALYSIS & FILTERS */}
          <div className="pointer-events-auto">
            <TerrainAnalysisControl
              config={terrainConfig}
              onChangeConfig={(newConfig) => {
                setTerrainConfig(newConfig);
                // Sync basemap active state if relevant
                if (newConfig.mode === 'elevation') {
                  setBasemap('topographic');
                } else if (newConfig.mode === 'hillshade') {
                  setBasemap('shaded-relief');
                } else if (newConfig.mode === 'none') {
                  setBasemap('natural');
                }
              }}
            />
          </div>
        </div>

        {/* Small Toggle Button Showing Direction (Left < when open, Right > when collapsed) */}
        <button
          type="button"
          onClick={() => setIsLeftToolbarOpen(prev => !prev)}
          className="pointer-events-auto absolute top-1 left-full ml-2 p-2 sm:p-2.5 rounded-xl bg-space-900/95 border border-slate-800/90 hover:border-cyan-500/60 hover:bg-cyan-950/80 text-cyan-400 hover:text-white shadow-2xl backdrop-blur-xl transition-all duration-200 flex items-center gap-1.5 group cursor-pointer"
          title={isLeftToolbarOpen ? "Hide left toolbar to side (or press '[')" : "Show left toolbar (or press '[')"}
          aria-label={isLeftToolbarOpen ? "Collapse left toolbar" : "Expand left toolbar"}
        >
          {isLeftToolbarOpen ? (
            <>
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="sr-only">Hide Toolbar</span>
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              {isStitchingTiles ? (
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 pr-1 hidden sm:inline">
                  Layers
                </span>
              )}
            </>
          )}
        </button>
      </div>

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

      {/* Solar Phase & Lighting Simulator (Top-Right) */}
      <SolarPhaseControl
        className={`absolute top-16 sm:top-20 z-20 w-72 sm:w-80 transition-all duration-300 ${selectedPOI ? 'right-3 sm:right-[31.5rem] hidden lg:block' : 'right-3 sm:right-4'
          }`}
        sunAngle={sunAngle}
        onSunAngleChange={handleSunAngleChange}
        autoCycle={autoSunCycle}
        onToggleAutoCycle={() => setAutoSunCycle(prev => !prev)}
        enableSunShade={enableSunShade}
        onToggleSunShade={() => setEnableSunShade(prev => !prev)}
      />

      {/* Shared Right-Side Stack: POI Details Panel (top) + Coordinate Overlay (bottom) */}
      <aside className="absolute top-16 sm:top-20 right-3 sm:right-4 bottom-3 sm:bottom-4 z-20 pointer-events-none flex flex-col justify-end gap-2.5 sm:gap-3 w-[calc(100vw-1.5rem)] sm:w-[480px] max-w-full">
        {/* Slide-out Landing Site Details Card (takes remaining space, scrolls internally) */}
        <POIInfoPanel
          poi={selectedPOI}
          onClose={() => setSelectedPOI(null)}
          onFocusSite={handleFocusSite}
        />

        {/* Real-Time Raycasting Coordinate HUD (anchored at bottom of stack) */}
        <CoordinateOverlay
          hoverCoordinate={hoverCoordinate}
          clickedCoordinate={clickedCoordinate}
          selectedPOIName={selectedPOI?.name}
          onResetView={handleResetView}
          onZoomIn={() => lunarSceneRef.current?.zoomIn()}
          onZoomOut={() => lunarSceneRef.current?.zoomOut()}
        />
      </aside>

      {/* Quick Search Modal & Coordinate Navigation Tool */}
      <POISearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pois={LUNAR_POIS}
        onSelectPOI={handleSelectPOI}
        onNavigateCoordinate={handleNavigateCoordinate}
      />

      {/* Atlas User Guide & Scientific Calibration Modal */}
      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

export default ExplorerDashboard;

