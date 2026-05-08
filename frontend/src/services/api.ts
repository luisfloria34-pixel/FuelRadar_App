// v3 — Supabase Edge Functions (fetch/GET) + FastAPI backend (fetch/REST)
import { Station, StationDetail } from '../types';
import { supabase, SUPABASE_FUNCTIONS_URL } from './supabase';

// ─── URL config ──────────────────────────────────────────────────────────────

// FastAPI backend (favorites, alerts, device registration).
// All calls are wrapped in try-catch by useStore so a missing URL is safe.
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL ?? null;

// ─── Edge-Function helpers (GET with query params) ───────────────────────────

type Params = Record<string, string | number | boolean | undefined | null>;

function qs(params: Params): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

async function edgeGet<T>(fn: string, params?: Params): Promise<T> {
  const url = `${SUPABASE_FUNCTIONS_URL}/${fn}${params ? qs(params) : ''}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

async function edgePost<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw error;
  return data as T;
}

// ─── Backend helpers (FastAPI REST) ──────────────────────────────────────────

async function backendFetch<T>(
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
  path: string,
  opts: { deviceId?: string; body?: Record<string, unknown> } = {},
): Promise<T> {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_API_URL not configured');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.deviceId ? { 'X-Device-UUID': opts.deviceId } : {}),
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // 204 No Content has no body
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as unknown as T);
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public interfaces ───────────────────────────────────────────────────────

export interface PriceHistoryEntry {
  price: number;
  recorded_at: string;
}

export interface NearbyStationsResponse {
  ok: boolean;
  stations: Station[];
  message?: string;
}

export interface StationDetailResponse {
  ok: boolean;
  station: StationDetail | null;
  message?: string;
}

// ─── API ────────────────────────────────────────────────────────────────────

export const fuelApi = {
  // ── Supabase Edge Functions ──────────────────────────────────────────────

  geocode: (query: string) =>
    edgeGet<any>('geocode', { q: query }),

  getNearbyStations: (
    lat: number,
    lng: number,
    rad = 5,
    fuelType = 'all',
    sort = 'dist',
  ): Promise<NearbyStationsResponse> =>
    edgeGet('stations-nearby', { lat, lng, rad, fuel_type: fuelType, sort }),

  getStationDetail: (stationId: string): Promise<StationDetailResponse> =>
    edgeGet('station-detail', { id: stationId }),

  getPrices: (ids: string[]) =>
    edgeGet<any>('stations-prices', { ids: ids.join(',') }),

  getPriceHistory: (stationId: string, fuelType = 'diesel', days = 7): Promise<PriceHistoryEntry[]> =>
    edgeGet('station-price-history', { station_id: stationId, fuel_type: fuelType, days }),

  healthCheck: () =>
    edgeGet<any>('health'),

  // ── FastAPI backend (favorites) ──────────────────────────────────────────

  getFavorites: (deviceId: string) =>
    backendFetch<any[]>('GET', `/api/v2/favorites/${deviceId}`),

  addFavorite: (
    deviceId: string,
    data: { station_id: string; station_name: string; station_brand: string; lat: number; lng: number },
  ) =>
    backendFetch<any>('POST', '/api/v2/favorites/', {
      deviceId,
      body: { ...data, device_uuid: deviceId },
    }),

  removeFavorite: (deviceId: string, stationId: string) =>
    backendFetch<void>('DELETE', `/api/v2/favorites/${stationId}`, { deviceId }),

  // ── FastAPI backend (alerts) ─────────────────────────────────────────────

  getAlerts: (deviceId: string) =>
    backendFetch<any[]>('GET', `/api/v2/alerts/${deviceId}`),

  createAlert: (
    deviceId: string,
    data: {
      alert_type?: string;
      fuel_type: string;
      threshold_price?: number;
      station_id?: string;
      station_name?: string;
      lat?: number;
      lng?: number;
      radius_km?: number;
    },
  ) =>
    backendFetch<any>('POST', '/api/v2/alerts/', {
      deviceId,
      body: { ...data, device_uuid: deviceId, alert_type: data.alert_type ?? 'fuel_threshold' },
    }),

  deleteAlert: (deviceId: string, alertId: number) =>
    backendFetch<void>('DELETE', `/api/v2/alerts/${alertId}`, { deviceId }),

  updateAlert: (deviceId: string, alertId: number, data: Record<string, unknown>) =>
    backendFetch<any>('PATCH', `/api/v2/alerts/${alertId}`, { deviceId, body: data }),

  // ── FastAPI backend (devices) ────────────────────────────────────────────

  registerDevice: (
    deviceId: string,
    pushToken?: string,
    platform?: string,
    locale?: string,
  ) =>
    backendFetch<any>('POST', '/api/v2/devices/', {
      body: {
        device_uuid: deviceId,
        expo_push_token: pushToken ?? null,
        platform: platform ?? null,
        locale: locale ?? null,
      },
    }),

  registerPushToken: (token: string, deviceId: string) =>
    edgePost<any>('push-tokens', { token, device_id: deviceId }),

  logSearch: (data: Record<string, unknown>) =>
    edgePost<any>('analytics/search', data),
};

export default fuelApi;
