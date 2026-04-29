import axios from 'axios';
import { Station, StationDetail } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const fuelApi = {
  geocode: async (query: string): Promise<any> => {
    const response = await api.get('/geocode', { params: { q: query } });
    return response.data;
  },

  getNearbyStations: async (
    lat: number,
    lng: number,
    rad: number = 5,
    fuelType: string = 'all',
    sort: string = 'dist'
  ): Promise<NearbyStationsResponse> => {
    const response = await api.get('/stations/nearby', {
      params: { lat, lng, rad, fuel_type: fuelType, sort },
    });
    return response.data;
  },

  getStationDetail: async (stationId: string): Promise<StationDetailResponse> => {
    const response = await api.get(`/stations/${stationId}`);
    return response.data;
  },

  getPrices: async (ids: string[]): Promise<any> => {
    const response = await api.get('/stations/prices/list', {
      params: { ids: ids.join(',') },
    });
    return response.data;
  },

  registerDevice: async (
    deviceUuid: string,
    pushToken?: string,
    platform?: string,
    locale: string = 'de'
  ): Promise<any> => {
    const response = await api.post('/v2/devices', {
      device_uuid: deviceUuid,
      expo_push_token: pushToken || null,
      platform: platform || null,
      locale,
    });
    return response.data;
  },

  // Favorites
  getFavorites: async (deviceUuid: string): Promise<any[]> => {
    const response = await api.get(`/v2/favorites/${deviceUuid}`);
    return response.data;
  },

  addFavorite: async (deviceUuid: string, data: {
    station_id: string;
    station_name: string;
    station_brand: string;
    street?: string;
    place?: string;
    lat: number;
    lng: number;
  }): Promise<any> => {
    const response = await api.post(`/v2/favorites/${deviceUuid}`, data);
    return response.data;
  },

  removeFavorite: async (deviceUuid: string, stationId: string): Promise<any> => {
    const response = await api.delete(`/v2/favorites/${deviceUuid}/${stationId}`);
    return response.data;
  },

  // Alerts
  getAlerts: async (deviceUuid: string): Promise<any[]> => {
    const response = await api.get(`/v2/alerts/${deviceUuid}`);
    return response.data;
  },

  createAlert: async (deviceUuid: string, data: {
    alert_type: string;
    fuel_type: string;
    threshold_price?: number;
    station_id?: string;
    station_name?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
  }): Promise<any> => {
    const response = await api.post(`/v2/alerts/${deviceUuid}`, data);
    return response.data;
  },

  updateAlert: async (deviceUuid: string, alertId: number, data: {
    threshold_price?: number;
    radius_km?: number;
    is_active?: boolean;
  }): Promise<any> => {
    const response = await api.patch(`/v2/alerts/${deviceUuid}/${alertId}`, data);
    return response.data;
  },

  deleteAlert: async (deviceUuid: string, alertId: number): Promise<any> => {
    const response = await api.delete(`/v2/alerts/${deviceUuid}/${alertId}`);
    return response.data;
  },

  healthCheck: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
