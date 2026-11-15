import * as THREE from 'three';
import { BasemapType } from '../types/lunar';

// Standard Lunar Maria geographic center and radius approximation in degrees
const LUNAR_MARIA = [
  { name: 'Oceanus Procellarum', lat: 18, lng: -57, rx: 25, ry: 30, depth: 0.65 },
  { name: 'Mare Imbrium', lat: 32, lng: -15, rx: 17, ry: 17, depth: 0.72 },
  { name: 'Mare Serenitatis', lat: 28, lng: 17, rx: 11, ry: 11, depth: 0.70 },
  { name: 'Mare Tranquillitatis', lat: 8, lng: 31, rx: 13, ry: 12, depth: 0.68 },
  { name: 'Mare Crisium', lat: 17, lng: 59, rx: 8, ry: 9, depth: 0.75 },
  { name: 'Mare Fecunditatis', lat: -7, lng: 51, rx: 12, ry: 13, depth: 0.62 },
  { name: 'Mare Nectaris', lat: -15, lng: 35, rx: 7, ry: 7, depth: 0.66 },
  { name: 'Mare Nubium', lat: -21, lng: -16, rx: 11, ry: 10, depth: 0.64 },
  { name: 'Mare Humorum', lat: -24, lng: -38, rx: 6, ry: 6, depth: 0.70 },
  { name: 'Mare Frigoris', lat: 56, lng: 0, rx: 35, ry: 5, depth: 0.60 },
  { name: 'Mare Orientale', lat: -19, lng: -92, rx: 8, ry: 8, depth: 0.78 },
  { name: 'South Pole-Aitken Basin', lat: -53, lng: -169, rx: 28, ry: 24, depth: 0.85 },
  { name: 'Mare Moscoviense', lat: 27, lng: 147, rx: 6, ry: 6, depth: 0.68 },
  { name: 'Mare Smythii', lat: -1, lng: 87, rx: 6, ry: 6, depth: 0.65 },
  { name: 'Mare Marginis', lat: 13, lng: 86, rx: 7, ry: 7, depth: 0.60 },
];

// Major impact craters with bright ray systems and rims
const PROMINENT_CRATERS = [
  { name: 'Tycho', lat: -43.3, lng: -11.2, r: 2.2, rayLength: 45, brightness: 1.6 },
  { name: 'Copernicus', lat: 9.6, lng: -20.1, r: 2.5, rayLength: 30, brightness: 1.5 },
  { name: 'Kepler', lat: 8.1, lng: -38.0, r: 1.2, rayLength: 22, brightness: 1.4 },
  { name: 'Aristarchus', lat: 23.7, lng: -47.4, r: 1.3, rayLength: 18, brightness: 1.8 },
  { name: 'Jackson', lat: 22.4, lng: -163.1, r: 1.8, rayLength: 35, brightness: 1.5 },
  { name: 'Byrgius A', lat: -24.5, lng: -63.7, r: 0.9, rayLength: 20, brightness: 1.4 },
  { name: 'Stevinus A', lat: -31.8, lng: 51.6, r: 0.8, rayLength: 24, brightness: 1.4 },
  { name: 'Langrenus', lat: -8.9, lng: 61.1, r: 3.0, rayLength: 15, brightness: 1.2 },
  { name: 'Theophilus', lat: -11.4, lng: 26.4, r: 2.7, rayLength: 12, brightness: 1.2 },
  { name: 'Plato', lat: 51.6, lng: -9.3, r: 2.6, rayLength: 0, brightness: 0.5 }, // Dark flooded floor
  { name: 'Archimedes', lat: 29.7, lng: -4.0, r: 2.3, rayLength: 0, brightness: 0.7 },
  { name: 'Clavius', lat: -58.4, lng: -14.4, r: 5.5, rayLength: 0, brightness: 1.1 },
  { name: 'Shackleton', lat: -89.9, lng: 0.0, r: 1.0, rayLength: 5, brightness: 1.3 },
  { name: 'Von Kármán', lat: -44.8, lng: 176.2, r: 4.5, rayLength: 0, brightness: 0.7 },
];

/**
 * Creates high-detail procedural canvas textures for the 3D Lunar Globe.
 */
export class LunarTextureGenerator {
  private static cachedTextures: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Helper to convert (lat, lng) to pixel (x, y) on equirectangular canvas
   */
  private static geoToPixel(lat: number, lng: number, width: number, height: number): [number, number] {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  }

  /**
   * Generates Natural Surface visual mosaic texture (LROC WAC style)
   */
  public static getNaturalTexture(width: number = 2048, height: number = 1024): THREE.CanvasTexture {
    const key = `natural_${width}_${height}`;
    if (this.cachedTextures.has(key)) return this.cachedTextures.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 1. Base Lunar Highland regolith (light silvery gray with subtle variations)
    const baseGradient = ctx.createLinearGradient(0, 0, 0, height);
    baseGradient.addColorStop(0, '#a5a9b0');
    baseGradient.addColorStop(0.5, '#b4b8bf');
    baseGradient.addColorStop(1, '#9da2a8');
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. High-frequency fractal regolith noise & micro-roughness
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Render Lunar Maria (dark volcanic basalt plains)
    LUNAR_MARIA.forEach(maria => {
      const [cx, cy] = this.geoToPixel(maria.lat, maria.lng, width, height);
      const rx = (maria.rx / 360) * width;
      const ry = (maria.ry / 180) * height;

      // Handle wrapping across the 180° meridian if needed
      const offsets = [0, -width, width];
      offsets.forEach(offset => {
        const x = cx + offset;
        const grad = ctx.createRadialGradient(x, cy, rx * 0.1, x, cy, rx);
        const darkAlpha = maria.depth * 0.72;
        grad.addColorStop(0, `rgba(45, 48, 54, ${darkAlpha})`);
        grad.addColorStop(0.65, `rgba(55, 59, 65, ${darkAlpha * 0.85})`);
        grad.addColorStop(0.9, `rgba(80, 84, 90, ${darkAlpha * 0.3})`);
        grad.addColorStop(1, 'rgba(120, 125, 132, 0)');

        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });

    // 4. Subtle secondary maria patches for organic lunar landscape
    for (let i = 0; i < 40; i++) {
      const lat = 10 + (Math.random() - 0.5) * 50;
      const lng = -40 + (Math.random() - 0.5) * 70;
      const [px, py] = this.geoToPixel(lat, lng, width, height);
      const rad = (Math.random() * 20 + 10) * (width / 2048);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, rad);
      grad.addColorStop(0, 'rgba(40, 44, 48, 0.25)');
      grad.addColorStop(1, 'rgba(40, 44, 48, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Procedural scattered impact craters
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 450; i++) {
      const lat = (Math.random() * 170) - 85;
      const lng = (Math.random() * 360) - 180;
      const [px, py] = this.geoToPixel(lat, lng, width, height);
      const rad = Math.max(1.5, Math.pow(Math.random(), 3) * 16 * (width / 2048));

      // Crater interior shadow
      const craterGrad = ctx.createRadialGradient(px - rad * 0.25, py - rad * 0.25, rad * 0.1, px, py, rad);
      craterGrad.addColorStop(0, 'rgba(30, 32, 35, 0.45)');
      craterGrad.addColorStop(0.7, 'rgba(50, 52, 55, 0.2)');
      craterGrad.addColorStop(0.9, 'rgba(230, 235, 240, 0.5)'); // Bright rim
      craterGrad.addColorStop(1, 'rgba(200, 205, 210, 0)');

      ctx.fillStyle = craterGrad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Prominent rayed craters (Tycho, Copernicus, etc.)
    PROMINENT_CRATERS.forEach(crater => {
      const [px, py] = this.geoToPixel(crater.lat, crater.lng, width, height);
      const rPix = (crater.r / 360) * width;

      // Draw ejecta rays
      if (crater.rayLength > 0) {
        const rayPix = (crater.rayLength / 360) * width;
        const numRays = 18;
        for (let a = 0; a < numRays; a++) {
          const angle = (a / numRays) * Math.PI * 2 + (crater.lat * 0.1);
          const rayLen = rayPix * (0.6 + Math.random() * 0.8);
          const ex = px + Math.cos(angle) * rayLen;
          const ey = py + Math.sin(angle) * rayLen;

          const rayGrad = ctx.createLinearGradient(px, py, ex, ey);
          rayGrad.addColorStop(0, `rgba(250, 252, 255, ${0.45 * crater.brightness})`);
          rayGrad.addColorStop(0.4, `rgba(240, 245, 255, ${0.25 * crater.brightness})`);
          rayGrad.addColorStop(1, 'rgba(230, 235, 245, 0)');

          ctx.strokeStyle = rayGrad;
          ctx.lineWidth = Math.max(1, 2.5 * (width / 2048));
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }

      // Bright crater rim and central peak
      const rimGrad = ctx.createRadialGradient(px, py, rPix * 0.1, px, py, rPix * 1.5);
      rimGrad.addColorStop(0, crater.brightness < 0.8 ? 'rgba(35, 38, 42, 0.8)' : 'rgba(255, 255, 255, 0.85)');
      rimGrad.addColorStop(0.4, crater.brightness < 0.8 ? 'rgba(40, 44, 48, 0.6)' : 'rgba(245, 248, 255, 0.7)');
      rimGrad.addColorStop(0.85, 'rgba(210, 215, 225, 0.4)');
      rimGrad.addColorStop(1, 'rgba(180, 185, 190, 0)');

      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(px, py, rPix * 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set(key, texture);
    return texture;
  }

  /**
   * Generates LOLA Elevation / Topographic false-color map
   * Based on NASA LOLA color ramp (-9000m purple to +10760m white)
   */
  public static getTopographicTexture(width: number = 2048, height: number = 1024): THREE.CanvasTexture {
    const key = `topo_${width}_${height}`;
    if (this.cachedTextures.has(key)) return this.cachedTextures.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // LOLA Color Scale reference:
    // Purple / Dark Blue (-9km to -6km) -> SPA Basin
    // Cyan / Blue (-6km to -3km)
    // Green (-3km to 0km) -> Lowlands / Maria
    // Yellow / Orange (0km to +3km) -> Highlands
    // Red / Magenta (+3km to +6km) -> Mountains
    // White (+6km+) -> Highest peaks

    // Base background: Average highland elevation (Yellowish green / chartreuse ~ 0 to 1km)
    ctx.fillStyle = '#6ab04c';
    ctx.fillRect(0, 0, width, height);

    // Far side elevated highland plateau (+2km to +4km -> Orange / Red tint)
    const [farX, farY] = this.geoToPixel(10, 140, width, height);
    const farGrad = ctx.createRadialGradient(farX, farY, 20, farX, farY, width * 0.35);
    farGrad.addColorStop(0, '#eb4d4b');
    farGrad.addColorStop(0.5, '#f0932b');
    farGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = farGrad;
    ctx.fillRect(0, 0, width, height);

    // South Pole-Aitken Basin (Deepest region on Moon: -9000m to -6000m -> Deep Violet / Dark Blue)
    const [spaX, spaY] = this.geoToPixel(-53, -169, width, height);
    const spaRx = (34 / 360) * width;
    const spaRy = (28 / 180) * height;

    [-width, 0, width].forEach(ox => {
      const x = spaX + ox;
      const spaGrad = ctx.createRadialGradient(x, spaY, spaRx * 0.1, x, spaY, spaRx);
      spaGrad.addColorStop(0, '#2d0554'); // Ultra deep purple (-9km)
      spaGrad.addColorStop(0.4, '#130f40'); // Dark navy
      spaGrad.addColorStop(0.7, '#22a6b3'); // Teal (-4km)
      spaGrad.addColorStop(0.9, '#6ab04c'); // Green
      spaGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = spaGrad;
      ctx.beginPath();
      ctx.ellipse(x, spaY, spaRx, spaRy, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Maria Basins (Low elevation depressions: -3km to -1km -> Cyan / Cobalt Blue)
    LUNAR_MARIA.forEach(maria => {
      if (maria.name.includes('Aitken')) return;
      const [cx, cy] = this.geoToPixel(maria.lat, maria.lng, width, height);
      const rx = (maria.rx / 360) * width;
      const ry = (maria.ry / 180) * height;

      [-width, 0, width].forEach(ox => {
        const x = cx + ox;
        const grad = ctx.createRadialGradient(x, cy, rx * 0.1, x, cy, rx);
        grad.addColorStop(0, '#0984e3'); // Deep cyan blue (-3km)
        grad.addColorStop(0.5, '#00cec9'); // Cyan (-1.5km)
        grad.addColorStop(0.85, '#55efc4'); // Mint/Sea green (0km)
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Elevated Mountain Rims (Montes Apenninus, Montes Caucasus, Montes Taurus, etc.)
    const [apennineX, apennineY] = this.geoToPixel(20, -4, width, height);
    const mountainGrad = ctx.createRadialGradient(apennineX, apennineY, 5, apennineX, apennineY, 60);
    mountainGrad.addColorStop(0, '#ffffff'); // Highest ridge peak
    mountainGrad.addColorStop(0.3, '#d63031'); // High red (+4km)
    mountainGrad.addColorStop(0.7, '#f39c12'); // Orange (+2km)
    mountainGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = mountainGrad;
    ctx.beginPath();
    ctx.arc(apennineX, apennineY, 60, 0, Math.PI * 2);
    ctx.fill();

    // Crater rims with elevation highlights (Red/Orange rims, Blue/Cyan floors)
    PROMINENT_CRATERS.forEach(c => {
      const [cx, cy] = this.geoToPixel(c.lat, c.lng, width, height);
      const r = (c.r / 360) * width * 1.8;

      const cGrad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      cGrad.addColorStop(0, '#0984e3'); // Depressed floor
      cGrad.addColorStop(0.7, '#f1c40f'); // Rim slope
      cGrad.addColorStop(0.9, '#e74c3c'); // Elevated rim crest
      cGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Elevation contour subtle noise lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 200; i++) {
      const lat = (Math.random() * 160) - 80;
      const lng = (Math.random() * 360) - 180;
      const [px, py] = this.geoToPixel(lat, lng, width, height);
      ctx.beginPath();
      ctx.arc(px, py, Math.random() * 8 + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set(key, texture);
    return texture;
  }

  /**
   * Generates Shaded Relief / Hillshade texture (monochrome terrain contrast)
   */
  public static getShadedReliefTexture(width: number = 2048, height: number = 1024): THREE.CanvasTexture {
    const key = `relief_${width}_${height}`;
    if (this.cachedTextures.has(key)) return this.cachedTextures.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Neutral middle gray
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, width, height);

    // Simulated northwest oblique solar illumination (315° azimuth, 45° altitude)
    // Maria smooth plains with low variance
    LUNAR_MARIA.forEach(maria => {
      const [cx, cy] = this.geoToPixel(maria.lat, maria.lng, width, height);
      const rx = (maria.rx / 360) * width;
      const ry = (maria.ry / 180) * height;

      [-width, 0, width].forEach(ox => {
        const x = cx + ox;
        const grad = ctx.createRadialGradient(x, cy, 0, x, cy, rx);
        grad.addColorStop(0, '#666666');
        grad.addColorStop(0.8, '#737373');
        grad.addColorStop(1, '#808080');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Craters with illuminated western rims (+X / left) and shadowed eastern rims (+X / right)
    for (let i = 0; i < 600; i++) {
      const lat = (Math.random() * 170) - 85;
      const lng = (Math.random() * 360) - 180;
      const [px, py] = this.geoToPixel(lat, lng, width, height);
      const r = Math.max(2, Math.pow(Math.random(), 2.8) * 22 * (width / 2048));

      // Sunlit rim crest (top-left)
      const sunlitGrad = ctx.createRadialGradient(px - r * 0.4, py - r * 0.4, r * 0.1, px - r * 0.4, py - r * 0.4, r);
      sunlitGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      sunlitGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sunlitGrad;
      ctx.beginPath();
      ctx.arc(px, py, r * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Deep cast shadow inside opposite wall (bottom-right)
      const shadowGrad = ctx.createRadialGradient(px + r * 0.35, py + r * 0.35, r * 0.1, px + r * 0.35, py + r * 0.35, r);
      shadowGrad.addColorStop(0, 'rgba(20, 20, 20, 0.6)');
      shadowGrad.addColorStop(0.7, 'rgba(60, 60, 60, 0.3)');
      shadowGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Prominent craters hillshade
    PROMINENT_CRATERS.forEach(c => {
      const [px, py] = this.geoToPixel(c.lat, c.lng, width, height);
      const r = (c.r / 360) * width * 1.5;

      // Sunlit rim
      const sGrad = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 1, px, py, r * 1.3);
      sGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      sGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
      sGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(px, py, r * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Inner shadow
      const dGrad = ctx.createRadialGradient(px + r * 0.25, py + r * 0.25, 1, px, py, r * 0.9);
      dGrad.addColorStop(0, 'rgba(10, 10, 10, 0.85)');
      dGrad.addColorStop(0.7, 'rgba(40, 40, 40, 0.4)');
      dGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set(key, texture);
    return texture;
  }

  /**
   * Generates Bump / Displacement texture for real-time 3D crater depth
   */
  public static getBumpTexture(width: number = 2048, height: number = 1024): THREE.CanvasTexture {
    const key = `bump_${width}_${height}`;
    if (this.cachedTextures.has(key)) return this.cachedTextures.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Midpoint height (128 = 0m datum)
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, width, height);

    // Maria are depressed (darker gray = lower)
    LUNAR_MARIA.forEach(m => {
      const [cx, cy] = this.geoToPixel(m.lat, m.lng, width, height);
      const rx = (m.rx / 360) * width;
      const ry = (m.ry / 180) * height;
      [-width, 0, width].forEach(ox => {
        const x = cx + ox;
        const g = ctx.createRadialGradient(x, cy, 0, x, cy, rx);
        g.addColorStop(0, 'rgba(70, 70, 70, 0.7)');
        g.addColorStop(1, 'rgba(128, 128, 128, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Craters: deep dark centers with raised white rims
    for (let i = 0; i < 500; i++) {
      const lat = (Math.random() * 170) - 85;
      const lng = (Math.random() * 360) - 180;
      const [px, py] = this.geoToPixel(lat, lng, width, height);
      const r = Math.max(2, Math.pow(Math.random(), 3) * 20 * (width / 2048));

      // Raised rim (brighter than 128)
      ctx.fillStyle = 'rgba(210, 210, 210, 0.4)';
      ctx.beginPath();
      ctx.arc(px, py, r * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Deep crater bowl (darker than 128)
      const bowlGrad = ctx.createRadialGradient(px, py, 0, px, py, r);
      bowlGrad.addColorStop(0, 'rgba(30, 30, 30, 0.7)');
      bowlGrad.addColorStop(0.7, 'rgba(60, 60, 60, 0.5)');
      bowlGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
      ctx.fillStyle = bowlGrad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Prominent craters bump
    PROMINENT_CRATERS.forEach(c => {
      const [px, py] = this.geoToPixel(c.lat, c.lng, width, height);
      const r = (c.r / 360) * width * 1.2;

      // Rim
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(px, py, r * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Interior floor
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba(20, 20, 20, 0.85)');
      g.addColorStop(1, 'rgba(128, 128, 128, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.cachedTextures.set(key, texture);
    return texture;
  }

  /**
   * Helper to retrieve texture by basemap type
   */
  public static getTexture(type: BasemapType): THREE.CanvasTexture {
    switch (type) {
      case 'natural':
        return this.getNaturalTexture();
      case 'nasa-lola':
        return this.getNaturalTexture();
      case 'shaded-relief':
        return this.getShadedReliefTexture();
      default:
        return this.getNaturalTexture();
    }
  }
}

