/**
 * Persistent State Management for Lunar Horizon & Celestial Ephemeris Tools
 * Preserves user settings, coordinates, timestamps, and last executed actions
 * across modal closures, navigation, and browser page refreshes.
 */

export type HorizonActionType = 'flyover' | 'orient-sun' | 'orient-earth' | null;

export interface HorizonPersistedState {
  selectedPresetId: string;
  siteName: string;
  lat: number;
  lng: number;
  dateTimeIso: string;
  lastAction: HorizonActionType;
  lastActionTimestamp: number | null;
  lastActionSummary?: string;
  activeFilterTab?: 'all' | 'horizon' | 'ephemeris';
}

const STORAGE_KEY = 'selene_horizon_ephemeris_state_v1';

export const DEFAULT_HORIZON_STATE: HorizonPersistedState = {
  selectedPresetId: 'apollo-11',
  siteName: 'Tranquility Base (Apollo 11)',
  lat: 0.6741,
  lng: 23.4730,
  dateTimeIso: '1969-07-20T20:17',
  lastAction: null,
  lastActionTimestamp: null,
  lastActionSummary: '',
  activeFilterTab: 'all'
};

export function getInitialHorizonState(): HorizonPersistedState {
  if (typeof window === 'undefined') return { ...DEFAULT_HORIZON_STATE };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HORIZON_STATE };
    const parsed = JSON.parse(raw);
    return {
      selectedPresetId: parsed.selectedPresetId || DEFAULT_HORIZON_STATE.selectedPresetId,
      siteName: parsed.siteName || DEFAULT_HORIZON_STATE.siteName,
      lat: typeof parsed.lat === 'number' && !isNaN(parsed.lat) ? parsed.lat : DEFAULT_HORIZON_STATE.lat,
      lng: typeof parsed.lng === 'number' && !isNaN(parsed.lng) ? parsed.lng : DEFAULT_HORIZON_STATE.lng,
      dateTimeIso: parsed.dateTimeIso || DEFAULT_HORIZON_STATE.dateTimeIso,
      lastAction: parsed.lastAction || null,
      lastActionTimestamp: parsed.lastActionTimestamp || null,
      lastActionSummary: parsed.lastActionSummary || '',
      activeFilterTab: parsed.activeFilterTab || 'all'
    };
  } catch (err) {
    console.warn('[HorizonStatePersistence] Failed to read from localStorage:', err);
    return { ...DEFAULT_HORIZON_STATE };
  }
}

export function saveHorizonState(partialState: Partial<HorizonPersistedState>): HorizonPersistedState {
  if (typeof window === 'undefined') return { ...DEFAULT_HORIZON_STATE, ...partialState };

  try {
    const current = getInitialHorizonState();
    const updated: HorizonPersistedState = {
      ...current,
      ...partialState
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[HorizonStatePersistence] Failed to save to localStorage:', err);
    return { ...DEFAULT_HORIZON_STATE, ...partialState };
  }
}
