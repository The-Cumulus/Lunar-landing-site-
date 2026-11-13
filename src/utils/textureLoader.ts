import * as THREE from 'three';
import { BasemapType } from '../types/lunar';
import { LunarTextureGenerator } from './proceduralTextures';

export class LunarTextureManager {
  private static loader = new THREE.TextureLoader();
  private static textureCache = new Map<string, THREE.Texture>();
  private static topoColorizedTexture: THREE.CanvasTexture | null = null;

  /**
   * Loads the real photographic NASA 8K Moon texture (/textures/moon_natural_8k.jpg)
   * Falls back to /textures/moon_natural_2k.jpg, then /textures/moon_natural.jpg.
   */
  public static getNaturalTexture(): THREE.Texture {
    const cacheKey = 'natural_photo';
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    const texture = this.loader.load(
      '/textures/moon_natural_8k.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = true;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback to 2k map, then 1k map
        console.warn('8K texture load failed, falling back to moon_natural_2k.jpg');
        this.loader.load(
          '/textures/moon_natural_2k.jpg',
          (fallbackTex) => {
            fallbackTex.colorSpace = THREE.SRGBColorSpace;
            fallbackTex.wrapS = THREE.RepeatWrapping;
            fallbackTex.wrapT = THREE.ClampToEdgeWrapping;
            fallbackTex.generateMipmaps = true;
            this.textureCache.set(cacheKey, fallbackTex);
          },
          undefined,
          () => {
            console.warn('Falling back to moon_natural.jpg');
            this.loader.load('/textures/moon_natural.jpg', (fallback1k) => {
              fallback1k.colorSpace = THREE.SRGBColorSpace;
              this.textureCache.set(cacheKey, fallback1k);
            });
          }
        );
      }
    );

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.textureCache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Loads the authentic Moon elevation bump map (/textures/moon_bump.jpg)
   */
  public static getBumpTexture(): THREE.Texture {
    const cacheKey = 'moon_bump';
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    const texture = this.loader.load(
      '/textures/moon_bump.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
      },
      undefined,
      () => {
        console.warn('Using procedural bump fallback');
      }
    );

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.textureCache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates LOLA Topographic False-Color Elevation Map
   * By colorizing the real Lunar elevation bump map into LOLA hypsometric palette:
   * Deep basins (-9km) -> Violet/Navy -> Blue/Teal -> Green (0m) -> Yellow -> Red -> White (+10.7km)
   */
  public static getTopographicTexture(): THREE.Texture {
    if (this.topoColorizedTexture) {
      return this.topoColorizedTexture;
    }

    // Load bump image to colorize it authentically
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/textures/moon_bump.jpg';

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Initial placeholder while image loads
    const initialTex = LunarTextureGenerator.getTopographicTexture(2048, 1024);

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.wrapS = THREE.RepeatWrapping;
    canvasTexture.wrapT = THREE.ClampToEdgeWrapping;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // LOLA Color Palette interpolation table (from 0 = lowest to 255 = highest)
      const colorStops = [
        { stop: 0.0, r: 45, g: 5, b: 84 },     // Deep SPA Basin (-9km) - Deep Purple
        { stop: 0.22, r: 9, g: 70, b: 180 },   // Deep Depressions (-6km) - Deep Blue
        { stop: 0.38, r: 0, g: 190, b: 210 },  // Basaltic Lowlands (-3km) - Cyan
        { stop: 0.50, r: 76, g: 175, b: 80 },  // Mean Lunar Datum (0m) - Green
        { stop: 0.68, r: 241, g: 196, b: 15 }, // Highlands (+2km) - Gold / Yellow
        { stop: 0.85, r: 235, g: 77, b: 75 },  // Mountain Massifs (+5km) - Red
        { stop: 1.0, r: 255, g: 255, b: 255 }  // Highest Rims (+10km) - White
      ];

      for (let i = 0; i < data.length; i += 4) {
        // Luminance from bump map
        const heightVal = data[i] / 255.0;

        // Interpolate across colorStops
        let r = 255, g = 255, b = 255;
        for (let s = 0; s < colorStops.length - 1; s++) {
          const s1 = colorStops[s];
          const s2 = colorStops[s + 1];
          if (heightVal >= s1.stop && heightVal <= s2.stop) {
            const factor = (heightVal - s1.stop) / (s2.stop - s1.stop);
            r = Math.round(s1.r + (s2.r - s1.r) * factor);
            g = Math.round(s1.g + (s2.g - s1.g) * factor);
            b = Math.round(s1.b + (s2.b - s1.b) * factor);
            break;
          }
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      ctx.putImageData(imgData, 0, 0);
      canvasTexture.needsUpdate = true;
    };

    img.onerror = () => {
      // Use procedural if load fails
      return initialTex;
    };

    this.topoColorizedTexture = canvasTexture;
    return canvasTexture;
  }

  /**
   * Returns texture for the specified basemap
   */
  public static getTexture(basemap: BasemapType): THREE.Texture {
    switch (basemap) {
      case 'natural':
        return this.getNaturalTexture();
      case 'topographic':
        return this.getTopographicTexture();
      case 'shaded-relief':
        return this.getBumpTexture();
      default:
        return this.getNaturalTexture();
    }
  }
}

