import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  RotateCcw, 
  Check, 
  Compass, 
  Globe2, 
  Layers, 
  Activity, 
  Rocket, 
  Eye, 
  Search, 
  Sun, 
  Plane, 
  GitCompare, 
  Keyboard
} from 'lucide-react';

export interface TutorialStep {
  id: string;
  targetId: string | null; // null for center welcome / completion modals
  title: string;
  subtitle: string;
  description: string;
  proTip?: string;
  icon: React.ReactNode;
  category: 'overview' | 'navigation' | 'lighting' | 'instruments' | 'telemetry';
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  onEnter?: () => void;
}

interface WebsiteTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSidebar?: () => void;
  onOpenSearch?: () => void;
  initialStepIndex?: number;
}

export const WebsiteTutorial: React.FC<WebsiteTutorialProps> = ({
  isOpen,
  onClose,
  onOpenSidebar,
  onOpenSearch,
  initialStepIndex = 0
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(initialStepIndex);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; placement: string }>({ top: 100, left: 100, placement: 'center' });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Sync initialStepIndex when isOpen opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(initialStepIndex);
    }
  }, [isOpen, initialStepIndex]);

  // 14 Targeted Steps + Step 0 (Welcome) + Step 15 (Final Screen)
  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      targetId: null,
      title: 'Welcome to SELENE 3D',
      subtitle: 'Photographic Lunar Globe & Planetary Exploration Portal',
      description: 'SELENE 3D is a photorealistic, scientific lunar atlas powered by NASA Moon Trek and LRO (Lunar Orbiter Laser Altimeter) WMTS datasets. This guided tour introduces the 3D globe, scientific instruments, terrain analytics, and ephemeris calculators.',
      proTip: 'You can restart or exit this tour anytime using the buttons below or the Tutorial button in the top bar.',
      icon: <Globe2 className="w-6 h-6 text-cyan-400" />,
      category: 'overview',
      preferredPlacement: 'center'
    },
    {
      id: 'globe',
      targetId: 'tutorial-globe',
      title: 'Interactive 3D Moon Globe',
      subtitle: 'IAU Radius 1,737.4 km & NASA WMTS Streaming',
      description: 'Interact directly with the high-resolution lunar sphere. Left-click and drag to orbit smoothly around any feature. Use your mouse wheel or touchpad swipe to zoom in on crater floors and rilles. Right-click anywhere on the surface to instantly inspect and copy exact selenographic coordinates.',
      proTip: 'Touchpad: Swipe outwards to zoom in; swipe inwards to zoom out. Drag with one finger to rotate.',
      icon: <Globe2 className="w-5 h-5 text-cyan-400" />,
      category: 'navigation',
      preferredPlacement: 'right'
    },
    {
      id: 'brand-header',
      targetId: 'tutorial-brand-header',
      title: 'Header & Quick Controls',
      subtitle: 'Homepage Navigation & Recenter View',
      description: 'The top left bar displays the SELENE 3D brand badge. Click "Homepage" to return to the educational landing portal. Click the glowing cyan SELENE 3D globe logo anytime to instantly reset and re-center the Moon in your viewport.',
      proTip: 'Keyboard shortcut: Press C anytime to re-center the Moon.',
      icon: <RotateCcw className="w-5 h-5 text-cyan-400" />,
      category: 'navigation',
      preferredPlacement: 'bottom'
    },
    {
      id: 'pins-toggle',
      targetId: 'tutorial-pins-toggle',
      title: 'Landing Sites & Mission Pins',
      subtitle: 'Apollo, Chandrayaan, Artemis & Landmarks',
      description: 'Toggle landing site pins on or off the 3D lunar surface. When enabled, mission markers for historic Apollo landings, Chandrayaan-3, Artemis III candidate sites, and geological impact craters appear on the globe with custom badges.',
      proTip: 'Clicking any pin on the globe flies the camera directly to that site and opens its scientific dossier.',
      icon: <Eye className="w-5 h-5 text-cyan-400" />,
      category: 'navigation',
      preferredPlacement: 'bottom'
    },
    {
      id: 'search-bar',
      targetId: 'tutorial-search-bar',
      title: 'Find Sites & Coordinate Navigator',
      subtitle: 'Fast Nomenclature & Decimal Coordinate Search',
      description: 'Search across 29 cataloged landing sites, prominent craters, and geological landmarks. You can also paste or type decimal coordinates (e.g. 34.85892, 90.00000) to jump directly to any lunar location.',
      proTip: 'Press the forward slash key "/" anywhere on your keyboard to instantly open the search navigator.',
      icon: <Search className="w-5 h-5 text-cyan-400" />,
      category: 'navigation',
      preferredPlacement: 'bottom'
    },
    {
      id: 'solar-phase',
      targetId: 'tutorial-solar-phase',
      title: 'Solar Phase & Lighting Simulator',
      subtitle: 'Terminator Shadows & Real-time Solar Cycle',
      description: 'Simulates the lunar synodic month and solar illumination. Toggle "Shade ON/OFF" to render directional terminator shadows that highlight mountain peaks. Click "▷" to run the continuous solar cycle simulation (~8°/s), or click the widget to open the manual Azimuth slider and phase presets (Full Moon, Quarter, New Moon).',
      proTip: 'Press "S" on your keyboard to quickly toggle realistic terminator shadows on and off.',
      icon: <Sun className="w-5 h-5 text-amber-400" />,
      category: 'lighting',
      preferredPlacement: 'bottom'
    },
    {
      id: 'layers-toggle',
      targetId: 'tutorial-layers-toggle',
      title: 'Scientific Layers Sidebar',
      subtitle: '7 Integrated Exploration & Analysis Suites',
      description: 'The left sidebar hosts 7 specialized instruments for planetary exploration. Click the "< LAYERS" pill to collapse the sidebar for full-screen viewing, or expand it to access basemaps, LOLA analytics, comparators, and ephemeris calculators.',
      proTip: 'Press "[" on your keyboard to toggle the sidebar open and closed.',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      category: 'instruments',
      preferredPlacement: 'right'
    },
    {
      id: 'card-basemap',
      targetId: 'tutorial-card-basemap',
      title: '1. Basemap & Overlays',
      subtitle: 'Visual Mosaic, LOLA Hypsometry & Shaded Relief',
      description: 'Switch between the Natural 8K LROC mosaic, LOLA hypsometric color elevation, and directional shaded relief. You can also toggle 15° selenographic graticule grid lines, auto-rotation, and NASA DEM 3D bump relief.',
      proTip: 'Press "G" to toggle coordinate graticule grid lines; press "R" to toggle smooth globe rotation.',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      category: 'instruments',
      preferredPlacement: 'right',
      onEnter: () => onOpenSidebar?.()
    },
    {
      id: 'card-terrain',
      targetId: 'tutorial-card-terrain',
      title: '2. Terrain Analysis & Filters',
      subtitle: 'Live LOLA Elevation, Slope, Roughness & Hillshade',
      description: 'Perform real-time GPU filtering on official NASA LOLA datasets. Filter elevation by min/max meters with out-of-range dimming, classify slope gradients into geomorphic categories (0-5° flat maria, 5-10° gentle, 10-15° moderate, >15° steep), view surface roughness RMS classes, and adjust analytical hillshade lighting.',
      proTip: 'Toggle "Overlay on Natural Surface" to blend LOLA scientific color scales with the base photographic mosaic.',
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      category: 'instruments',
      preferredPlacement: 'right',
      onEnter: () => onOpenSidebar?.()
    },
    {
      id: 'card-lroc',
      targetId: 'tutorial-card-lroc',
      title: '3. LROC Tile Layers & NAC Mosaics',
      subtitle: 'Sub-Meter Apollo 11 & 17 Regional Imagery',
      description: 'Access NASA Moon Trek Web Map Tile Services (WMTS). Explore regional Narrow Angle Camera (NAC) mosaics of Apollo 11 and Apollo 17 landing sites down to 0.5 meters per pixel, revealing rover tracks, lander descent stages, and crater ejecta.',
      proTip: 'Click the "LAYERS" pill on the card to open the complete LROC QuickMap layer manager.',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      category: 'instruments',
      preferredPlacement: 'right',
      onEnter: () => onOpenSidebar?.()
    },
    {
      id: 'card-comparator',
      targetId: 'tutorial-card-comparator',
      title: '4. Lunar Site Comparator',
      subtitle: 'Side-by-Side Dual Location Exploration Analysis',
      description: 'Compare any two lunar sites simultaneously. Inspect differences in elevation datum, slope safety, surface roughness, illumination, and geological context side-by-side to evaluate landing feasibility.',
      proTip: 'Click the "COMPARE" button to launch the comparator with Apollo 11 and Shackleton Crater pre-loaded.',
      icon: <GitCompare className="w-5 h-5 text-purple-400" />,
      category: 'instruments',
      preferredPlacement: 'right',
      onEnter: () => onOpenSidebar?.()
    },
    {
      id: 'card-horizon',
      targetId: 'tutorial-card-horizon',
      title: '5. Celestial Horizon & Ephemeris',
      subtitle: 'Sun & Earth Relative to Lunar Horizon',
      description: 'Calculates topocentric astronomical ephemeris for the Sun and Earth from any lunar coordinate. Features "Flyover & Observe Horizon" camera modes and one-click camera orientation towards the Sun and Earth with persistent state management.',
      proTip: 'Click "HORIZON" to open the ephemeris tool. Your selected viewpoint and last action are automatically saved.',
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      category: 'instruments',
      preferredPlacement: 'right',
      onEnter: () => onOpenSidebar?.()
    },
    {
      id: 'card-evaluator',
      targetId: 'tutorial-card-evaluator',
      title: '6. Lunar Mission Evaluator',
      subtitle: 'JPL Solar Elevation Trajectory & Comms Feasibility',
      description: 'Simulates mission feasibility using NASA/JPL Horizons solar curves over 24h to 29.5d synodic months. Features an interactive solar elevation angle graph with readable UTC time ticks, hover and touchscreen coordinates tooltip, and Next Sunset / Next Earthset predictions.',
      proTip: 'Click "FEASIBILITY" to inspect power generation windows and direct Line-of-Sight communications with Earth.',
      icon: <Rocket className="w-5 h-5 text-blue-400" />,
      category: 'instruments',
      preferredPlacement: 'right',
      onEnter: () => onOpenSidebar?.()
    },
    {
      id: 'card-flyover',
      targetId: 'tutorial-card-flyover',
      title: '7. 3D Flyover & Cinematic Tours',
      subtitle: 'Pitched Camera Flights Over Lunar Wonders',
      description: 'Take low-altitude pitched camera flights across iconic lunar formations including Tycho Crater central peak, Shackleton Crater cold trap, Aristarchus Plateau, Apollo 11 base, and Hadley Rille.',
      proTip: 'Click the card to choose a landmark flight or start the automated multi-waypoint guided flyover tour.',
      icon: <Plane className="w-5 h-5 text-indigo-400" />,
      category: 'instruments',
      preferredPlacement: 'right',
      onEnter: () => onOpenSidebar?.()
    },
    {
      id: 'bottom-bar',
      targetId: 'tutorial-bottom-bar',
      title: 'Live Telemetry & Coordinate Jump HUD',
      subtitle: 'Real-Time LAT, LON, ELEV, SLOPE & ROUGH Readouts',
      description: 'Hover your cursor anywhere across the 3D Moon to see live selenographic telemetry sampled from LOLA altimetry in real time. Use the "Go to Lat, Lon" input and click "GO" to navigate to any custom coordinate on the Moon.',
      proTip: 'Click "Center Moon" in the bottom HUD to instantly reset your camera view to the center.',
      icon: <Compass className="w-5 h-5 text-cyan-400" />,
      category: 'telemetry',
      preferredPlacement: 'top'
    },
    {
      id: 'complete',
      targetId: null,
      title: 'READY TO EXPLORE THE MOON?',
      subtitle: 'You have completed the SELENE 3D guided introduction.',
      description: 'You now know the essentials of SELENE 3D. Explore the Moon using the real-time LOLA scientific instruments, dynamic lighting simulator, and mission planning tools.',
      proTip: 'You can restart this tutorial at any time by clicking "Website Tutorial" in the top navigation bar.',
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      category: 'overview',
      preferredPlacement: 'center'
    }
  ];

  const currentStep = steps[currentStepIndex] || steps[0];
  const isGlobe = currentStep.targetId === 'tutorial-globe';
  const isModalStep = !currentStep.targetId;

  // Accurate target rect measurement and smart tooltip positioning
  const updatePosition = useCallback(() => {
    if (!isOpen) return;

    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const isMobile = windowW < 640;
    const popupW = isMobile ? Math.min(windowW - 24, 380) : 400;
    const popupH = 310;
    const gap = 20;

    if (!currentStep.targetId) {
      setTargetRect(null);
      setTooltipPos({
        top: Math.max(20, (windowH - popupH) / 2),
        left: Math.max(12, (windowW - popupW) / 2),
        placement: 'center'
      });
      return;
    }

    if (isGlobe) {
      // Special spotlight circle for the central Moon sphere
      const cx = windowW / 2 + (windowW > 1024 ? 60 : 0);
      const cy = windowH / 2;
      const radius = Math.min(windowW, windowH) * 0.36;
      const globeVirtualRect = {
        x: cx - radius,
        y: cy - radius,
        width: radius * 2,
        height: radius * 2,
        top: cy - radius,
        bottom: cy + radius,
        left: cx - radius,
        right: cx + radius,
        toJSON: () => {}
      } as DOMRect;

      setTargetRect(globeVirtualRect);

      // Position popup in the open starry space to the right
      const idealLeft = Math.min(windowW - popupW - 32, cx + radius * 0.55);
      const idealTop = Math.max(85, cy - popupH / 2);
      setTooltipPos({
        top: Math.max(20, Math.min(windowH - popupH - 20, idealTop)),
        left: Math.max(16, Math.min(windowW - popupW - 16, idealLeft)),
        placement: 'right'
      });
      return;
    }

    const targetEl = document.getElementById(currentStep.targetId);
    if (!targetEl) {
      setTargetRect(null);
      setTooltipPos({
        top: Math.max(20, (windowH - popupH) / 2),
        left: Math.max(12, (windowW - popupW) / 2),
        placement: 'center'
      });
      return;
    }

    // Scroll target into view if needed (for sidebar cards or bottom elements)
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    const rect = targetEl.getBoundingClientRect();
    setTargetRect(rect);

    let top = 0;
    let left = 0;
    let placement = currentStep.preferredPlacement || 'bottom';

    if (isMobile) {
      // Mobile layout: place at top or bottom opposite of target
      if (rect.top > windowH / 2) {
        top = 20;
        placement = 'top';
      } else {
        top = windowH - popupH - 20;
        placement = 'bottom';
      }
      left = (windowW - popupW) / 2;
    } else if (placement === 'right') {
      // Place to the right of the element (e.g. sidebar cards)
      left = rect.right + gap;
      top = rect.top + rect.height / 2 - popupH / 2;
      if (left + popupW > windowW - 20) {
        left = Math.max(20, rect.left - popupW - gap);
        placement = 'left';
      }
    } else if (placement === 'bottom') {
      // Place below target (e.g. header elements)
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - popupW / 2;
      if (top + popupH > windowH - 20) {
        top = Math.max(20, rect.top - popupH - gap);
        placement = 'top';
      }
    } else if (placement === 'top') {
      // Place above target (e.g. bottom bar)
      top = rect.top - popupH - gap;
      left = rect.left + rect.width / 2 - popupW / 2;
      if (top < 20) {
        top = rect.bottom + gap;
        placement = 'bottom';
      }
    } else if (placement === 'left') {
      left = rect.left - popupW - gap;
      top = rect.top + rect.height / 2 - popupH / 2;
      if (left < 20) {
        left = rect.right + gap;
        placement = 'right';
      }
    }

    // Clamp within screen boundaries
    left = Math.max(16, Math.min(windowW - popupW - 16, left));
    top = Math.max(16, Math.min(windowH - popupH - 16, top));

    setTooltipPos({ top, left, placement });
  }, [isOpen, currentStep, isGlobe]);

  // Handle step enter hooks and positioning updates with transition debouncing
  useEffect(() => {
    if (!isOpen) return;

    currentStep.onEnter?.();

    // Initial measure
    const timer1 = setTimeout(updatePosition, 40);
    // Secondary measure after smooth scrolling / panel expansion completes
    const timer2 = setTimeout(updatePosition, 320);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, currentStepIndex, updatePosition, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleExit();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleExit = () => {
    onClose();
  };

  const handleRestart = () => {
    setCurrentStepIndex(1); // Restart from Step 1 on explicit restart
  };

  if (!isOpen) return null;

  // Cutout geometry calculation
  const pad = isGlobe ? 0 : 8;
  const cutoutX = targetRect ? targetRect.x - pad : 0;
  const cutoutY = targetRect ? targetRect.y - pad : 0;
  const cutoutW = targetRect ? targetRect.width + pad * 2 : 0;
  const cutoutH = targetRect ? targetRect.height + pad * 2 : 0;

  // Step counter & progress: 14 tools total
  const stepNumber = Math.max(1, Math.min(14, currentStepIndex));
  const progressPercent = Math.round((stepNumber / 14) * 100);

  return (
    <div className="fixed inset-0 z-[120] pointer-events-auto select-none font-mono">
      {/* 
        CRITICAL SPOTLIGHT CUTOUT LAYER:
        Only render the SVG mask overlay when targetRect is present.
        NO unmasked full-screen black div is rendered underneath!
        This guarantees the highlighted target element receives ZERO overlay pixels,
        preserving 100% of its native brightness, sharp text, colors, and visibility!
      */}
      {targetRect ? (
        <svg className="fixed inset-0 w-full h-full pointer-events-auto z-10 transition-opacity duration-300">
          <defs>
            <mask id="tutorial-spotlight-mask">
              {/* White fills the mask = shows the dark overlay */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cuts out the mask hole = 100% TRANSPARENT on the target */}
              {isGlobe ? (
                <circle
                  cx={targetRect.x + targetRect.width / 2}
                  cy={targetRect.y + targetRect.height / 2}
                  r={targetRect.width / 2}
                  fill="black"
                />
              ) : (
                <rect
                  x={cutoutX}
                  y={cutoutY}
                  width={cutoutW}
                  height={cutoutH}
                  rx="16"
                  ry="16"
                  fill="black"
                />
              )}
            </mask>
          </defs>

          {/* Dimmed backdrop covering everything EXCEPT the transparent cutout hole */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(3, 7, 18, 0.85)"
            mask="url(#tutorial-spotlight-mask)"
          />
        </svg>
      ) : (
        /* For modal steps (Step 0 Welcome & Step 15 Completion): full-screen darkened backdrop */
        <div 
          className="fixed inset-0 bg-[#030712]/85 backdrop-blur-[4px] transition-opacity duration-300 z-10"
          onClick={handleExit}
        />
      )}

      {/* 
        Transparent Click-Interceptor over the Cutout:
        Prevents accidental button clicks inside the dashboard tool while tutorial is active
      */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${cutoutY}px`,
            left: `${cutoutX}px`,
            width: `${cutoutW}px`,
            height: `${cutoutH}px`,
            borderRadius: isGlobe ? '50%' : '16px',
            pointerEvents: 'auto',
            background: 'transparent',
            zIndex: 15
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Clicking the highlighted tool advances the tutorial
            handleNext();
          }}
          title="Click to proceed to next tool"
        />
      )}

      {/* 
        Pulsing Electric-Cyan Border & Glowing Spotlight Ring:
        Accentuates the target element with a high-tech glowing aura
      */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${cutoutY}px`,
            left: `${cutoutX}px`,
            width: `${cutoutW}px`,
            height: `${cutoutH}px`,
            borderRadius: isGlobe ? '50%' : '16px',
            border: '2px solid rgba(6, 182, 212, 0.95)',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.75), inset 0 0 15px rgba(6, 182, 212, 0.25)',
            pointerEvents: 'none',
            zIndex: 20,
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="animate-pulse"
        />
      )}

      {/* ================= STEP 0: WELCOME SCREEN MODAL ================= */}
      {currentStepIndex === 0 && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#0B0F19] border border-[#1E293B] shadow-[0_0_50px_rgba(6,182,212,0.25)] p-6 sm:p-7 space-y-5 animate-scaleUp text-slate-200 relative overflow-hidden backdrop-blur-xl"
          >
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#083344] border border-[#06B6D4]/50 shadow-lg shadow-cyan-950/50">
                  {currentStep.icon}
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 inline-block mb-1">
                    Interactive Tour
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold font-mono text-white tracking-wide">
                    {currentStep.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExit}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Exit Tour (Press Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {currentStep.description}
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 font-mono">
              <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-200">8K Natural &amp; LOLA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200">Elevation &amp; Slope</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-200">Lighting &amp; Solar</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] flex items-center gap-2">
                <Rocket className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-slate-200">JPL Feasibility</span>
              </div>
            </div>

            {currentStep.proTip && (
              <div className="p-3 rounded-xl bg-[#083344]/40 border border-cyan-500/30 text-[11px] text-cyan-200 font-sans flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{currentStep.proTip}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={handleExit}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                Skip Tutorial
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition-all cursor-pointer group"
              >
                <span>Start Guided Tour</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 15: FINAL COMPLETION SCREEN ================= */}
      {currentStepIndex === steps.length - 1 && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#0B0F19] border border-[#1E293B] shadow-[0_0_50px_rgba(16,185,129,0.25)] p-6 sm:p-7 space-y-5 animate-scaleUp text-slate-200 relative overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#083344] border border-[#06B6D4]/50 shadow-lg shadow-cyan-950/50">
                  {currentStep.icon}
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 inline-block mb-1">
                    Introduction Complete
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold font-mono text-white tracking-wide">
                    {currentStep.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExit}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Exit Tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {currentStep.subtitle}
            </p>

            {/* Keyboard Shortcuts Cheat Sheet */}
            <div className="p-3.5 rounded-xl bg-[#050B14] border border-[#1E293B] space-y-2">
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-[#1E293B]">
                <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Keyboard Shortcuts Quick Reference</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Search Sites</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#030712] border border-slate-700 text-cyan-300">/</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Solar Shade</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#030712] border border-slate-700 text-amber-300">S</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Center Moon</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#030712] border border-slate-700 text-cyan-300">C</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mission Pins</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#030712] border border-slate-700 text-cyan-300">P</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Graticule Grid</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#030712] border border-slate-700 text-cyan-300">G</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Help Guide</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#030712] border border-slate-700 text-cyan-300">?</kbd>
                </div>
              </div>
            </div>

            {/* Actions: Start Exploring & Restart Tutorial */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Tutorial</span>
              </button>
              <button
                type="button"
                onClick={handleExit}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Start Exploring</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEPS 1 to 14: INTERACTIVE SPOTLIGHT POPUP CARD ================= */}
      {!isModalStep && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            width: window.innerWidth < 640 ? `${Math.min(window.innerWidth - 24, 380)}px` : '400px'
          }}
          className="z-30 p-4 sm:p-5 rounded-2xl bg-[#0B0F19]/98 border border-[#06B6D4]/50 shadow-[0_0_35px_rgba(6,182,212,0.3)] backdrop-blur-2xl text-slate-200 space-y-3.5 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-2.5 border-b border-[#1E293B] pb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#083344] border border-[#06B6D4]/60 shadow-md shadow-cyan-950/40 shrink-0">
                {currentStep.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold text-[#22D3EE] uppercase tracking-widest">
                    STEP {stepNumber} OF 14
                  </span>
                </div>
                <h3 className="text-sm font-bold font-mono text-white truncate" title={currentStep.title}>
                  {currentStep.title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExit}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Close Tutorial (Press Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subtitle & Description */}
          <div className="space-y-1.5">
            <div className="text-[10.5px] font-mono text-cyan-300/80 font-medium">
              {currentStep.subtitle}
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Pro Tip Callout */}
          {currentStep.proTip && (
            <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-[10.5px] text-cyan-200 font-sans flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>{currentStep.proTip}</span>
            </div>
          )}

          {/* Progress Bar & Actions */}
          <div className="pt-2 border-t border-[#1E293B] space-y-2.5">
            {/* Progress bar line */}
            <div className="w-full h-1 bg-[#050B14] rounded-full overflow-hidden border border-[#1E293B]/60">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleExit}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                Skip Tutorial
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStepIndex <= 1}
                  className="px-2.5 py-1.5 rounded-xl bg-[#050B14] border border-[#1E293B] hover:border-slate-700 text-slate-300 hover:text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-950/40 transition-all flex items-center gap-1 cursor-pointer group"
                >
                  <span>{currentStepIndex === steps.length - 2 ? 'Finish' : 'Next'}</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
