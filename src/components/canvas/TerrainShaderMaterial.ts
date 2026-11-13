import * as THREE from 'three';
import { TerrainFilterConfig } from '../../types/lunar';

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D uDEM;
uniform sampler2D uNaturalTexture;
uniform int uMode; // 0=None/Natural, 1=Elevation, 2=Slope, 3=Roughness, 4=Hillshade
uniform int uElevationCategory; // 0=all, 1=basins (purple), 2=lowlands (blue), 3=intermediate (green), 4=highlands (orange)
uniform bool uContinuousFilter; // Continuous cursor color scrub filter
uniform float uContinuousTargetElev; // Selected elevation in meters
uniform float uContinuousWindow; // Half-width window in meters
uniform float uMinElevation;
uniform float uMaxElevation;
uniform bool uHighlightOutOfRange;
uniform int uPaletteId; // 0=LOLA, 1=Turbo, 2=Magma, 3=Monochrome, 4=CoolWarm
uniform float uSlopeMin;
uniform float uSlopeMax;
uniform int uRoughnessFilter; // -1=all, 0=smooth, 1=moderate, 2=rough
uniform float uHillshadeAzimuth; // radians
uniform float uHillshadeAltitude; // radians
uniform bool uOverlayOnNatural;
uniform float uBlendOpacity;
uniform vec2 uTexelSize;
uniform vec3 uSunDirection;
uniform bool uEnableSunShade;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

// Piecewise Color Palettes for LOLA DEM
vec3 sampleLOLAPalette(float t) {
  // LOLA Standard: Deep Purple (-9km) -> Blue -> Cyan -> Green (0m) -> Yellow -> Red -> White (+10.7km)
  if (t < 0.16) return mix(vec3(0.18, 0.02, 0.33), vec3(0.04, 0.52, 0.89), t / 0.16);
  if (t < 0.31) return mix(vec3(0.04, 0.52, 0.89), vec3(0.0, 0.81, 0.79), (t - 0.16) / 0.15);
  if (t < 0.46) return mix(vec3(0.0, 0.81, 0.79), vec3(0.42, 0.69, 0.30), (t - 0.31) / 0.15);
  if (t < 0.58) return mix(vec3(0.42, 0.69, 0.30), vec3(0.95, 0.77, 0.06), (t - 0.46) / 0.12);
  if (t < 0.78) return mix(vec3(0.95, 0.77, 0.06), vec3(0.91, 0.30, 0.24), (t - 0.58) / 0.20);
  return mix(vec3(0.91, 0.30, 0.24), vec3(1.0, 1.0, 1.0), (t - 0.78) / 0.22);
}

vec3 sampleTurboPalette(float t) {
  // Turbo Scientific Spectrum
  if (t < 0.2) return mix(vec3(0.19, 0.07, 0.23), vec3(0.16, 0.73, 0.93), t / 0.2);
  if (t < 0.4) return mix(vec3(0.16, 0.73, 0.93), vec3(0.19, 0.88, 0.73), (t - 0.2) / 0.2);
  if (t < 0.6) return mix(vec3(0.19, 0.88, 0.73), vec3(0.64, 0.99, 0.24), (t - 0.4) / 0.2);
  if (t < 0.8) return mix(vec3(0.64, 0.99, 0.24), vec3(0.98, 0.75, 0.19), (t - 0.6) / 0.2);
  return mix(vec3(0.98, 0.75, 0.19), vec3(0.80, 0.11, 0.02), (t - 0.8) / 0.2);
}

vec3 sampleMagmaPalette(float t) {
  // Magma Volcanic Heat
  if (t < 0.25) return mix(vec3(0.0, 0.0, 0.02), vec3(0.27, 0.06, 0.46), t / 0.25);
  if (t < 0.50) return mix(vec3(0.27, 0.06, 0.46), vec3(0.62, 0.18, 0.50), (t - 0.25) / 0.25);
  if (t < 0.75) return mix(vec3(0.62, 0.18, 0.50), vec3(0.95, 0.38, 0.36), (t - 0.50) / 0.25);
  return mix(vec3(0.95, 0.38, 0.36), vec3(0.99, 0.99, 0.75), (t - 0.75) / 0.25);
}

vec3 sampleMonochromePalette(float t) {
  float val = 0.08 + 0.92 * t;
  return vec3(val, val, val * 1.02);
}

vec3 sampleCoolWarmPalette(float t) {
  if (t < 0.35) return mix(vec3(0.03, 0.32, 0.61), vec3(0.42, 0.68, 0.84), t / 0.35);
  if (t < 0.55) return mix(vec3(0.42, 0.68, 0.84), vec3(0.98, 0.95, 0.82), (t - 0.35) / 0.20);
  if (t < 0.80) return mix(vec3(0.98, 0.95, 0.82), vec3(0.99, 0.60, 0.16), (t - 0.55) / 0.25);
  return mix(vec3(0.99, 0.60, 0.16), vec3(0.80, 0.30, 0.01), (t - 0.80) / 0.20);
}

vec3 getElevationColor(float t, int paletteId) {
  if (paletteId == 1) return sampleTurboPalette(t);
  if (paletteId == 2) return sampleMagmaPalette(t);
  if (paletteId == 3) return sampleMonochromePalette(t);
  if (paletteId == 4) return sampleCoolWarmPalette(t);
  return sampleLOLAPalette(t);
}

void main() {
  // Sample raw DEM elevation
  float rawH0 = texture2D(uDEM, vUv).r;
  // Convert to true elevation in meters (-9150 m to +10760 m)
  float centerElev = -9150.0 + rawH0 * 19910.0;

  vec3 finalColor = vec3(0.0);

  // Physical spatial gradient calculation using Horn's kernel on equirectangular projection
  float lat = (0.5 - vUv.y) * 3.14159265;
  float cosLat = max(0.08, cos(lat));
  // Metric pixel scale (Lunar radius = 1,737,400 meters)
  float dy = (3.14159265 * 1737400.0) * uTexelSize.y;
  float dx = (2.0 * 3.14159265 * 1737400.0 * cosLat) * uTexelSize.x;

  vec2 offX = vec2(uTexelSize.x, 0.0);
  vec2 offY = vec2(0.0, uTexelSize.y);

  float zNW = -9150.0 + texture2D(uDEM, vUv - offX - offY).r * 19910.0;
  float zN  = -9150.0 + texture2D(uDEM, vUv - offY).r * 19910.0;
  float zNE = -9150.0 + texture2D(uDEM, vUv + offX - offY).r * 19910.0;
  float zW  = -9150.0 + texture2D(uDEM, vUv - offX).r * 19910.0;
  float zE  = -9150.0 + texture2D(uDEM, vUv + offX).r * 19910.0;
  float zSW = -9150.0 + texture2D(uDEM, vUv - offX + offY).r * 19910.0;
  float zS  = -9150.0 + texture2D(uDEM, vUv + offY).r * 19910.0;
  float zSE = -9150.0 + texture2D(uDEM, vUv + offX + offY).r * 19910.0;

  float dz_dx = ((zNE + 2.0 * zE + zSE) - (zNW + 2.0 * zW + zSW)) / (8.0 * dx);
  float dz_dy = ((zSW + 2.0 * zS + zSE) - (zNW + 2.0 * zN + zNE)) / (8.0 * dy);
  float riseRun = length(vec2(dz_dx, dz_dy));
  float slopeDeg = atan(riseRun) * (180.0 / 3.14159265);

  // ================= MODE 1: ELEVATION (LOLA DEM) =================
  if (uMode == 1) {
    float normT = clamp((centerElev - (-9150.0)) / 19910.0, 0.0, 1.0);
    vec3 palColor = getElevationColor(normT, uPaletteId);

    if (uContinuousFilter) {
      // Continuous cursor-driven color filter:
      // Dynamically highlight the specific elevation & color selected by cursor
      float dist = abs(centerElev - uContinuousTargetElev);
      float halfWin = max(150.0, uContinuousWindow);

      if (dist <= halfWin) {
        // Smooth cosine bell-curve falloff for rich organic illumination
        float factor = 0.5 + 0.5 * cos((dist / halfWin) * 3.14159265);
        float gray = dot(palColor, vec3(0.299, 0.587, 0.114)) * 0.14;
        vec3 dimColor = vec3(gray, gray, gray * 1.06);
        finalColor = mix(dimColor, palColor * 1.18, factor);
      } else {
        // Out-of-window: dimmed dark monochrome surface so the highlighted color band pops
        float gray = dot(palColor, vec3(0.299, 0.587, 0.114)) * 0.14;
        finalColor = vec3(gray, gray, gray * 1.06);
      }
    } else {
      bool inRange = (centerElev >= uMinElevation && centerElev <= uMaxElevation);
      if (inRange) {
        if (uElevationCategory == 1) {
          // Deep Basins: Radiant Purple / Violet palette (< -5,000m) matching left filter
          float bT = clamp((centerElev - (-9150.0)) / 4150.0, 0.0, 1.0);
          finalColor = mix(vec3(0.38, 0.06, 0.72), vec3(0.72, 0.38, 0.98), bT);
        } else if (uElevationCategory == 2) {
          // Maria Basalts (-5,000m to 0m): Radiant Azure Blue -> Cyan -> Emerald Green matching left filter
          float lT = clamp((centerElev - (-5000.0)) / 5000.0, 0.0, 1.0);
          if (lT < 0.5) {
            finalColor = mix(vec3(0.04, 0.52, 0.89), vec3(0.0, 0.81, 0.79), lT / 0.5);
          } else {
            finalColor = mix(vec3(0.0, 0.81, 0.79), vec3(0.06, 0.73, 0.51), (lT - 0.5) / 0.5);
          }
        } else if (uElevationCategory == 3) {
          // Intermediate Terrain (-2,000m to +1,000m)
          float iT = clamp((centerElev - (-2000.0)) / 3000.0, 0.0, 1.0);
          finalColor = mix(vec3(0.06, 0.72, 0.40), vec3(0.35, 0.92, 0.58), iT);
        } else if (uElevationCategory == 4) {
          // Highland Peaks (> 0m to +10,760m): Radiant Warm Gold -> Orange/Amber -> Red -> White matching left filter
          float hT = clamp((centerElev - 0.0) / 10760.0, 0.0, 1.0);
          if (hT < 0.35) {
            finalColor = mix(vec3(0.95, 0.77, 0.06), vec3(0.96, 0.62, 0.04), hT / 0.35);
          } else if (hT < 0.75) {
            finalColor = mix(vec3(0.96, 0.62, 0.04), vec3(0.91, 0.30, 0.24), (hT - 0.35) / 0.40);
          } else {
            finalColor = mix(vec3(0.91, 0.30, 0.24), vec3(1.0, 1.0, 1.0), (hT - 0.75) / 0.25);
          }
        } else {
          // All categories: full continuous hypsometric palette (LOLA Standard / Turbo / etc.)
          finalColor = palColor;
        }
      } else {
        if (uHighlightOutOfRange) {
          // Dim out-of-range areas to low-contrast dark monochrome surface so active category pops brilliantly
          float gray = dot(palColor, vec3(0.299, 0.587, 0.114)) * 0.14;
          finalColor = vec3(gray, gray, gray * 1.06);
        } else {
          // Hard mask out
          finalColor = vec3(0.02, 0.03, 0.05);
        }
      }
    }
  }

  // ================= MODE 2: SLOPE (DEGREES) =================
  else if (uMode == 2) {
    vec3 slopeColor;
    if (slopeDeg < 5.0) {
      slopeColor = vec3(0.23, 0.51, 0.96); // 0–5° Flat Maria (Blue #3b82f6)
    } else if (slopeDeg < 10.0) {
      slopeColor = vec3(0.02, 0.71, 0.83); // 5–10° Gentle Slopes (Cyan #06b6d4)
    } else if (slopeDeg < 15.0) {
      slopeColor = vec3(0.96, 0.62, 0.04); // 10–15° Moderate Slopes (Amber #f59e0b)
    } else {
      slopeColor = vec3(0.93, 0.27, 0.27); // > 15° Steep Terraces & Scarps (Red #ef4444)
    }

    bool inSlope = (slopeDeg >= uSlopeMin && slopeDeg <= uSlopeMax);
    if (inSlope) {
      finalColor = slopeColor;
    } else {
      float gray = dot(slopeColor, vec3(0.299, 0.587, 0.114)) * 0.18;
      finalColor = vec3(gray);
    }
  }

  // ================= MODE 3: SURFACE ROUGHNESS =================
  else if (uMode == 3) {
    float mean = (zNW + zN + zNE + zW + centerElev + zE + zSW + zS + zSE) / 9.0;
    float variance = (
      pow(zNW - mean, 2.0) + pow(zN - mean, 2.0) + pow(zNE - mean, 2.0) +
      pow(zW - mean, 2.0)  + pow(centerElev - mean, 2.0) + pow(zE - mean, 2.0) +
      pow(zSW - mean, 2.0) + pow(zS - mean, 2.0) + pow(zSE - mean, 2.0)
    ) / 9.0;
    float roughnessRMS = sqrt(variance);

    vec3 roughColor;
    int roughBin = 0;
    if (roughnessRMS < 35.0) {
      roughColor = vec3(0.06, 0.73, 0.51); // Smooth (< 35m RMS, Emerald #10b981)
      roughBin = 0;
    } else if (roughnessRMS < 90.0) {
      roughColor = vec3(0.96, 0.62, 0.04); // Moderate (35–90m RMS, Amber #f59e0b)
      roughBin = 1;
    } else {
      roughColor = vec3(0.93, 0.28, 0.60); // Rough (> 90m RMS, Magenta #ec4899)
      roughBin = 2;
    }

    bool inRough = (uRoughnessFilter == -1 || uRoughnessFilter == roughBin);
    if (inRough) {
      finalColor = roughColor;
    } else {
      float gray = dot(roughColor, vec3(0.299, 0.587, 0.114)) * 0.18;
      finalColor = vec3(gray);
    }
  }

  // ================= MODE 4: HILLSHADE =================
  else if (uMode == 4) {
    vec3 norm = normalize(vec3(-dz_dx, -dz_dy, 1.0));
    // Solar illumination vector from Azimuth and Altitude
    vec3 sunLightDir = normalize(vec3(
      sin(uHillshadeAzimuth) * cos(uHillshadeAltitude),
      cos(uHillshadeAzimuth) * cos(uHillshadeAltitude),
      sin(uHillshadeAltitude)
    ));

    float relief = max(0.0, dot(norm, sunLightDir));
    float hillValue = 0.12 + 0.88 * relief;
    finalColor = vec3(hillValue);
  }

  // Optional: Overlay on top of real photographic natural albedo mosaic
  if (uOverlayOnNatural && uMode > 0) {
    vec3 naturalColor = texture2D(uNaturalTexture, vUv).rgb;
    finalColor = mix(naturalColor, finalColor, uBlendOpacity);
  }

  // Dynamic Sun illumination & terminator shading
  if (uEnableSunShade) {
    vec3 lightDir = normalize(uSunDirection);
    float NdotL = max(0.0, dot(vNormal, lightDir));
    float NdotOpp = max(0.0, dot(vNormal, -lightDir));
    // Ambient cosmic fill + directional sunlight + soft blue earthshine fill matching homepage
    vec3 ambient = vec3(0.22, 0.23, 0.26);
    vec3 earthshine = vec3(0.08, 0.16, 0.24) * NdotOpp;
    finalColor = finalColor * (ambient + earthshine + NdotL * 0.76);
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export class TerrainMaterialManager {
  private static materialInstance: THREE.ShaderMaterial | null = null;
  private static demTexture: THREE.Texture | null = null;
  private static naturalTexture: THREE.Texture | null = null;

  public static getMaterial(
    config: TerrainFilterConfig,
    sunPosition: THREE.Vector3,
    enableSunShade: boolean
  ): THREE.ShaderMaterial {
    if (!this.demTexture) {
      const loader = new THREE.TextureLoader();
      this.demTexture = loader.load('/textures/moon_bump.jpg', (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
      });
    }

    if (!this.naturalTexture) {
      const loader = new THREE.TextureLoader();
      this.naturalTexture = loader.load('/textures/moon_natural_8k.jpg', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = true;
        tex.needsUpdate = true;
      });
    }

    if (!this.materialInstance) {
      this.materialInstance = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uDEM: { value: this.demTexture },
          uNaturalTexture: { value: this.naturalTexture },
          uMode: { value: 0 },
          uElevationCategory: { value: 0 },
          uContinuousFilter: { value: false },
          uContinuousTargetElev: { value: 0.0 },
          uContinuousWindow: { value: 1800.0 },
          uMinElevation: { value: -9000.0 },
          uMaxElevation: { value: 10760.0 },
          uHighlightOutOfRange: { value: true },
          uPaletteId: { value: 0 },
          uSlopeMin: { value: 0.0 },
          uSlopeMax: { value: 90.0 },
          uRoughnessFilter: { value: -1 },
          uHillshadeAzimuth: { value: 315.0 * (Math.PI / 180.0) },
          uHillshadeAltitude: { value: 45.0 * (Math.PI / 180.0) },
          uOverlayOnNatural: { value: false },
          uBlendOpacity: { value: 1.0 },
          uTexelSize: { value: new THREE.Vector2(1.0 / 2000.0, 1.0 / 1000.0) },
          uSunDirection: { value: sunPosition.clone().normalize() },
          uEnableSunShade: { value: enableSunShade }
        }
      });
    }

    // Map config mode string to integer
    let modeInt = 0;
    if (config.mode === 'elevation') modeInt = 1;
    else if (config.mode === 'slope') modeInt = 2;
    else if (config.mode === 'roughness') modeInt = 3;
    else if (config.mode === 'hillshade') modeInt = 4;

    // Palette ID
    let palInt = 0;
    if (config.paletteId === 'turbo') palInt = 1;
    else if (config.paletteId === 'magma') palInt = 2;
    else if (config.paletteId === 'monochrome') palInt = 3;
    else if (config.paletteId === 'coolwarm') palInt = 4;

    // Slope limits
    let slopeMin = 0.0;
    let slopeMax = 90.0;
    if (config.slopeCategory === '0-5') {
      slopeMin = 0.0;
      slopeMax = 5.0;
    } else if (config.slopeCategory === '5-10') {
      slopeMin = 5.0;
      slopeMax = 10.0;
    } else if (config.slopeCategory === '10-15') {
      slopeMin = 10.0;
      slopeMax = 15.0;
    } else if (config.slopeCategory === '15+') {
      slopeMin = 15.0;
      slopeMax = 90.0;
    }

    // Roughness filter
    let roughFilter = -1;
    if (config.roughnessCategory === 'smooth') roughFilter = 0;
    else if (config.roughnessCategory === 'moderate') roughFilter = 1;
    else if (config.roughnessCategory === 'rough') roughFilter = 2;

    // Elevation category
    let elevCatInt = 0;
    if (config.elevationCategory === 'basins') elevCatInt = 1;
    else if (config.elevationCategory === 'lowlands') elevCatInt = 2;
    else if (config.elevationCategory === 'intermediate') elevCatInt = 3;
    else if (config.elevationCategory === 'highlands') elevCatInt = 4;

    // Continuous cursor color filter
    const isContinuous = typeof config.continuousTargetElev === 'number';

    // Update uniforms
    const u = this.materialInstance.uniforms;
    u.uDEM.value = this.demTexture;
    u.uNaturalTexture.value = this.naturalTexture;
    u.uMode.value = modeInt;
    u.uElevationCategory.value = elevCatInt;
    u.uContinuousFilter.value = isContinuous;
    u.uContinuousTargetElev.value = isContinuous ? (config.continuousTargetElev as number) : 0.0;
    u.uContinuousWindow.value = config.continuousWindowM || 1800.0;
    u.uMinElevation.value = config.minElevation;
    u.uMaxElevation.value = config.maxElevation;
    u.uHighlightOutOfRange.value = config.highlightOutOfRange;
    u.uPaletteId.value = palInt;
    u.uSlopeMin.value = slopeMin;
    u.uSlopeMax.value = slopeMax;
    u.uRoughnessFilter.value = roughFilter;
    u.uHillshadeAzimuth.value = (config.hillshadeAzimuth * Math.PI) / 180.0;
    u.uHillshadeAltitude.value = (config.hillshadeAltitude * Math.PI) / 180.0;
    u.uOverlayOnNatural.value = config.overlayOnNatural;
    u.uBlendOpacity.value = config.blendOpacity;
    u.uSunDirection.value.copy(sunPosition).normalize();
    u.uEnableSunShade.value = enableSunShade;

    return this.materialInstance;
  }
}

