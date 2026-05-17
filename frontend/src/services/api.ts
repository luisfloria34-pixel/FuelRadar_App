// FuelRadar API — all calls go through Supabase Edge Functions.
// No separate FastAPI backend required.

import { Station, StationDetail } from '../types';
import { SUPABASE_FUNCTIONS_URL } from './supabase';

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ─── Exported flag so UI components can show "backend not configured" banners ──
export const IS_BACKEND_CONFIGURED =
  !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!SUPABASE_ANON_KEY;

// ─── Query-string helper ───────────────────────────────────────────────────────

type Params = Record<string, string | number | boolean | undefined | null>;

function qs(params: Params): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

// ─── Universal Edge Function fetch ────────────────────────────────────────────
// All requests carry the anon key for Supabase auth.
// Edge Functions use the service-role key internally to bypass RLS.

async function edgeFetch<T>(
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
  fn: string,
  opts: { params?: Params; body?: Record<string, unknown> } = {},
): Promise<T> {
  const url = `${SUPABASE_FUNCTIONS_URL}/${fn}${opts.params ? qs(opts.params) : ''}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? ': ' + text.slice(0, 200) : ''}`);
    }

    const text = await res.text();
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  } finally {
    clearTimeout(timer);
  }
}

// Shorthand helpers
const edgeGet  = <T>(fn: string, params?: Params) => edgeFetch<T>('GET', fn, { params });
const edgePost = <T>(fn: string, body: Record<string, unknown>) => edgeFetch<T>('POST', fn, { body });
const edgePatch = <T>(fn: string, params: Params, body: Record<string, unknown>) =>
  edgeFetch<T>('PATCH', fn, { params, body });
const edgeDel  = <T>(fn: string, params: Params) => edgeFetch<T>('DELETE', fn, { params });

// ─── Response shapes ──────────────────────────────────────────────────────────

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

// ─── API surface ──────────────────────────────────────────────────────────────

export const fuelApi = {

  // ── Station data (Tankerkönig proxy via Edge Functions) ──────────────────

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

  // ── Favorites (Supabase DB via favorites Edge Function) ──────────────────

  getFavorites: (deviceId: string) =>
    edgeGet<any[]>('favorites', { device_uuid: deviceId }),

  addFavorite: (
    deviceId: string,
    data: { station_id: string; station_name: string; station_brand: string; lat: number; lng: number },
  ) =>
    edgeFetch<any>('POST', 'favorites', {
      params: { device_uuid: deviceId },
      body: data,
    }),

  removeFavorite: (deviceId: string, stationId: string) =>
    edgeDel<any>('favorites', { device_uuid: deviceId, station_id: stationId }),

  // ── Alerts (Supabase DB via alerts Edge Function) ────────────────────────

  getAlerts: (deviceId: string) =>
    edgeGet<any[]>('alerts', { device_uuid: deviceId }),

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
    edgeFetch<any>('POST', 'alerts', {
      params: { device_uuid: deviceId },
      body: { alert_type: 'fuel_threshold', ...data },
    }),

  deleteAlert: (deviceId: string, alertId: number) =>
    edgeDel<any>('alerts', { device_uuid: deviceId, alert_id: alertId }),

  updateAlert: (deviceId: string, alertId: number, data: Record<string, unknown>) =>
    edgePatch<any>('alerts', { device_uuid: deviceId, alert_id: alertId }, data),

  // ── Device registration (Supabase DB via devices Edge Function) ──────────

  registerDevice: (
    deviceId: string,
    pushToken?: string,
    platform?: string,
    locale?: string,
  ) =>
    edgeFetch<any>('POST', 'devices', {
      body: {
        device_uuid: deviceId,
        ...(pushToken ? { expo_push_token: pushToken } : {}),
        platform: platform ?? null,
        locale: locale ?? 'en',
      },
    }),

  // ── Push token (separate edge function for explicit token updates) ────────

  registerPushToken: (token: string, deviceId: string) =>
    edgePost<any>('push-tokens', { token, device_id: deviceId }),

  // ── Analytics ────────────────────────────────────────────────────────────

  logSearch: (data: Record<string, unknown>) =>
    edgePost<any>('analytics-search', data),
};

export default fuelApi;
