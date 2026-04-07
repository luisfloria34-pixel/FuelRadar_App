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
  // Geocode PLZ or city
  geocode: async (query: string): Promise<any> => {
    const response = await api.get('/geocode', { params: { q: query } });
    return response.data;
  },

  // Get nearby stations
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

  // Get station detail
  getStationDetail: async (stationId: string): Promise<StationDetailResponse> => {
    const response = await api.get(`/stations/${stationId}`);
    return response.data;
  },

  // Get prices for multiple stations
  getPrices: async (ids: string[]): Promise<any> => {
    const response = await api.get('/stations/prices/list', {
      params: { ids: ids.join(',') },
    });
    return response.data;
  },

  // Register push token
  registerPushToken: async (token: string, deviceId: string): Promise<any> => {
    const response = await api.post('/push-tokens', { token, device_id: deviceId });
    return response.data;
  },

  // Log search analytics
  logSearch: async (data: any): Promise<any> => {
    const response = await api.post('/analytics/search', data);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
