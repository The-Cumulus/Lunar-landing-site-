# SELENE-3D | Interactive 3D Lunar Map & Exploration

Production-ready, interactive 3D Lunar Map and Exploration web application inspired by **NASA Moon Trek** and **LROC QuickMap**. Built with **React**, **Three.js / React Three Fiber**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Key Features

### 1. 3D Lunar Globe Viewer (`LunarGlobe.tsx`)
- High-resolution tessellated 3D Moon sphere (`SphereGeometry(2, 128, 128)`) with custom material properties (`roughness: 0.92`, `metalness: 0.03`).
- Procedural bump map displacement calibrated for crater rim depth and realistic shadow casting.
- Celestial limb glow / exosphere scatter effect using an inverted Fresnel sphere.
- Smooth `OrbitControls` with custom inertia damping (`dampingFactor: 0.06`), zoom clamps (`minDistance: 2.35`, `maxDistance: 14.0`), and optional auto-rotation.

### 2. Multi-Basemap & Layer Switcher (`LayerControl.tsx`)
- **Natural Surface (LROC WAC Visual Mosaic)**: True-albedo reflectance model rendering dark basaltic maria (*Oceanus Procellarum, Mare Tranquillitatis, Mare Imbrium*), anorthositic highlands, and expansive ejecta ray systems (*Tycho, Copernicus, Kepler*).
- **Topographic / LOLA Elevation**: Hypsometric false-color elevation mapping derived from the Lunar Orbiter Laser Altimeter (-9,000 m deep purple in South Pole-Aitken Basin to +10,760 m white on far-side highland peaks). Includes an interactive elevation scale legend.
- **LOLA Shaded Relief / Hillshade**: High-contrast synthetic hillshade illumination accentuating crater terracing, central peaks, and lava channels.
- **Coordinate Graticule**: 3D spherical grid displaying latitude parallels (every 20°) and longitude meridians (every 30°), with vibrant cyan Equator and gold Prime Meridian.
- **Landing Site Pin Badges & Globe Auto-Rotation**: Toggleable anytime from the floating HUD panel.

### 3. Interactive Landing Sites & Points of Interest (`POIMarkers.tsx`)
Interactive 3D billboard markers with animated pulse beacons for historical and future missions:
- **Apollo 11, 12, 14, 15, 16, 17** (NASA)
- **Chandrayaan-3** (Shiv Shakti Point near Lunar South Pole - ISRO)
- **Artemis III Candidate Landing Regions** (*Shackleton Connecting Ridge, Malapert Mountain, Haworth Crater Rim, Nobile Rim*)
- **Chang'e 4** (First Far-Side Touchdown in Von Kármán crater) & **Chang'e 5** (Youngest basalts from Mons Rümker)
- **Historic Milestones & Impact Craters** (*Luna 2, Tycho Crater, Copernicus Crater*)
- **Cinematic Fly-To**: Smooth interpolated camera transition (`camera.position.lerp()`) positioning the viewpoint directly above the selected coordinate.
- **Slide-Out Telemetry Card (`POIInfoPanel.tsx`)**: Displays latitude, longitude, LOLA elevation, touchdown epoch, crew members, surface stay duration, returned sample weight, and scientific objectives.

### 4. Real-Time Solar Phase & Lighting Simulator (`SunLighting.tsx` & `SolarPhaseControl.tsx`)
- Directional Sun light source revolving around the Moon's equatorial plane.
- Real-time / manual Solar Phase Slider (0° to 360°) simulating day/night illumination cycles, terminator shadows, and lunar phases (*Full Moon, Waxing/Waning Gibbous, Quarters, New Moon*).
- Subtle Earthshine / cosmic ambient fill on the lunar night side.
- Auto-simulation mode with automated orbital rotation.

### 5. Real-Time Raycasting HUD & Coordinate Tracking (`CoordinateOverlay.tsx`)
- Real-time raycasting converting mouse cursor hover coordinates on the 3D globe into lunar **Decimal Degrees** and **Standard DMS (Degrees, Minutes, Seconds)**.
- Live **LOLA Elevation** query reporting exact height in meters, surface slope in degrees, and terrain classification on cursor hover.
- Automatic landmark detection identifying nearest geological formations (e.g., *Mare Tranquillitatis, South Pole-Aitken Basin, Tycho*).
- Nearside / Far-side and Northern / Southern hemisphere indicators.
- One-click coordinate clipboard copy utility.

### 6. Scientific Terrain Analysis & Filtering Suite (`TerrainAnalysisControl.tsx` & `TerrainShaderMaterial.ts`)
Collapsible scientific analysis dashboard below Basemap & Overlays powered by real **NASA LOLA / SLDEM** geodesy:
- **LOLA Elevation & Dynamic Filtering**: Dual interactive sliders (-9,000 m to +10,760 m) highlighting selected elevation bands directly on the 3D Moon while dimming out-of-range topography. Includes quick categories (*Deep Basins, Lowlands, Intermediate, Highlands & Peaks*).
- **Adjustable Hypsometric Palettes**: 5 real scientific color palettes (*NASA LOLA Standard, Turbo Spectrum, Magma Volcanic, Monochrome Geomorphological, Cool-to-Warm Diverging*) with a dynamic numerical legend.
- **Slope Analysis (Degrees)**: Computes spatial gradient $\nabla z = (dz/dx, dz/dy)$ and slope angles via Horn's planetary geodesy algorithm across standard bins (*0–5° Flat Maria, 5–10° Gentle, 10–15° Moderate, >15° Steep Terraces & Scarps*).
- **Surface Roughness (RMS Dispersion)**: Hectometer/kilometer baseline elevation dispersion analysis classifying terrain into *Smooth (<35m RMS), Moderate (35–90m RMS), and Rough (>90m RMS)*.
- **Directional Analytical Hillshade**: Interactive Solar Azimuth (0°–360°) and Solar Elevation Angle (10°–80°) with real-time 3D relief updates.
- **Overlay Blend Mode**: Toggleable overlay on the authentic 8K natural photographic surface with an adjustable opacity slider (20% to 100%).

---

## 📐 Mathematical Formulation

### 1. Converting (Latitude, Longitude, Radius) to 3D Cartesian (X, Y, Z)
Matching Three.js standard `SphereGeometry` UV parameterization:
- **Latitude ($\phi$)**: $[-90^\circ, +90^\circ]$ where $+90^\circ$ is North Pole ($+Y$) and $-90^\circ$ is South Pole ($-Y$)
- **Longitude ($\theta$)**: $[-180^\circ, +180^\circ]$ where $0^\circ$ is Prime Meridian ($+X$)

$$\text{Normalized Longitude: } u = \frac{\lambda + 180^\circ}{360^\circ}$$
$$\text{Normalized Latitude: } v = \frac{90^\circ - \phi}{180^\circ}$$

$$\Phi = v \cdot \pi \quad (\text{polar angle from }+Y)$$
$$\Theta = u \cdot 2\pi \quad (\text{azimuthal angle around }Y)$$

$$X = -R \cdot \cos(\Theta) \cdot \sin(\Phi)$$
$$Y = R \cdot \cos(\Phi)$$
$$Z = R \cdot \sin(\Theta) \cdot \sin(\Phi)$$

### 2. Inverse Raycast: Converting 3D Cartesian (X, Y, Z) to (Latitude, Longitude)
Given intersection vector $(X, Y, Z)$ on sphere of radius $R = \sqrt{X^2 + Y^2 + Z^2}$:

$$\Phi = \arccos\left(\text{clamp}\left(\frac{Y}{R}, -1, 1\right)\right)$$
$$\text{Latitude } \phi = 90^\circ - \left(\frac{\Phi}{\pi}\right) \cdot 180^\circ$$

$$\Theta = \text{atan2}(Z, -X) \quad (\text{if } \Theta < 0, \Theta \leftarrow \Theta + 2\pi)$$
$$\text{Longitude } \lambda = \left(\frac{\Theta}{2\pi}\right) \cdot 360^\circ - 180^\circ$$

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | Declarative Component Architecture |
| **TypeScript 5** | Strict Static Typing & Lunar Coordinate Contracts |
| **Vite 5** | Ultra-Fast Bundler & Hot Module Replacement |
| **Three.js** | 3D Graphics Engine & WebGL Shader Pipeline |
| **@react-three/fiber** | React Reconciler for Three.js |
| **@react-three/drei** | OrbitControls, HTML Overlays, Stars Shaders |
| **Tailwind CSS** | Sleek Deep Space Dark Mode UI System |
| **lucide-react** | Mission & Navigation Icons |

---

## 📁 Project Architecture

```
nasa-project/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── lunar.ts                  # Interfaces for POIs, Basemaps, Hover state
│   ├── utils/
│   │   ├── coordinates.ts            # Mathematical bijection (Lat/Lng <-> X/Y/Z), DMS & distance
│   │   └── proceduralTextures.ts     # Procedural Lunar Canvas generators (Visual, LOLA, Relief, Bump)
│   ├── data/
│   │   └── lunarPOIs.ts              # Detailed POI registry: Apollo 11-17, Chandrayaan-3, Artemis III, Chang'e, Craters
│   └── components/
│       ├── canvas/
│       │   ├── LunarScene.tsx        # Canvas root, camera, controls, stars
│       │   ├── LunarGlobe.tsx        # High-res Moon mesh, material & raycaster
│       │   ├── SunLighting.tsx       # Solar directional light & phase simulation
│       │   ├── POIMarkers.tsx        # 3D billboard pin markers & fly-to animation
│       │   ├── CoordinateGraticule.tsx # Lat/Long parallels & meridians
│       │   └── LunarAtmosphere.tsx   # Celestial limb glow
│       └── ui/
│           ├── Header.tsx            # Mission filter pills, search & guide buttons
│           ├── LayerControl.tsx      # Floating basemap & overlays switcher + LOLA ramp
│           ├── SolarPhaseControl.tsx # Solar azimuth slider & phase presets
│           ├── CoordinateOverlay.tsx # Raycasting HUD, DMS coordinates & landmarks
│           ├── POIInfoPanel.tsx      # Slide-out historical & scientific telemetry card
│           ├── POISearchModal.tsx    # Fast search filter by name, astronaut, agency
│           └── HelpGuideModal.tsx    # Atlas controls & scientific documentation
```

---

## ⚡ Terminal Setup & Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Production Build
```bash
npm run build
```

### 4. Local Preview of Production Build
```bash
npm run preview
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` or `Ctrl+K` | Open Instant Landing Site Search |
| `H` or `?` | Open Atlas Navigation Guide & Calibration Specs |
| `G` | Toggle Coordinate Graticule (Lat/Long Grid) |
| `S` | Toggle Solar Shade / Nightside Shadows (ON / OFF) |
| `R` | Toggle Globe Idle Rotation |
| `C` | Re-center Camera on the Moon (Home View) |
| `Esc` | Close Active Modal / Search Dialog |

