// Ambient declaration for CesiumJS loaded via CDN
declare const Cesium: any;

declare global {
  interface Window {
    Cesium: any;
    CESIUM_BASE_URL: string;
  }
}

export {};
