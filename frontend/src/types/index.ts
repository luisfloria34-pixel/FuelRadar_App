export interface Station {
  id: string;
  name: string;
  brand: string;
  street: string;
  house_number: string;
  post_code: string;
  place: string;
  lat: number;
  lng: number;
  diesel: number | null;
  e5: number | null;
  e10: number | null;
  is_open: boolean;
  dist: number;
}

export interface StationDetail extends Station {
  whole_day: boolean;
  opening_times: OpeningTime[];
  overrides: string[];
  state: string | null;
}

export interface OpeningTime {
  text: string;
  start: string;
  end: string;
}

export type FuelType = 'diesel' | 'e5' | 'e10';

export interface Alert {
  id: string;
  station_id?: string;
  station_name?: string;
  fuel_type: FuelType;
  threshold_price: number;
  is_active: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  station_id: string;
  station_name: string;
  station_brand: string;
  lat: number;
  lng: number;
  created_at: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}
