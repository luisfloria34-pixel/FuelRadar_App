import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Station, FuelType, FuelPreference, VehicleType, ReferralSource, Alert, Favorite, Location } from '../types';
import { translations, Language, TranslationKey } from '../constants/translations';
import { fuelApi } from '../services/api';

interface AppState {
  // Language
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;

  // Device
  deviceId: string | null;
  loadDeviceId: () => Promise<string>;

  // Location
  location: Location | null;
  setLocation: (location: Location) => void;

  // Location permission
  locationPermissionStatus: 'unknown' | 'granted' | 'denied' | 'permanently_denied';
  setLocationPermissionStatus: (status: 'unknown' | 'granted' | 'denied' | 'permanently_denied') => Promise<void>;

  // Selected fuel type
  selectedFuelType: FuelType;
  setSelectedFuelType: (type: FuelType) => void;

  // Stations
  stations: Station[];
  setStations: (stations: Station[]) => void;
  selectedStation: Station | null;
  setSelectedStation: (station: Station | null) => void;

  // Search radius
  searchRadius: number;
  setSearchRadius: (radius: number) => void;

  // Search query and location
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchLocationName: string;
  setSearchLocationName: (name: string) => void;

  // Favorites
  favorites: Favorite[];
  loadFavorites: () => Promise<void>;
  addFavorite: (favorite: Omit<Favorite, 'id' | 'created_at'>) => Promise<void>;
  removeFavorite: (stationId: string) => Promise<void>;
  isFavorite: (stationId: string) => boolean;

  // Alerts
  alerts: Alert[];
  loadAlerts: () => Promise<void>;
  addAlert: (alert: Omit<Alert, 'id' | 'created_at'>) => Promise<void>;
  removeAlert: (alertId: string) => Promise<void>;
  toggleAlert: (alertId: string) => Promise<void>;

  // Onboarding
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => Promise<void>;
  loadOnboardingStatus: () => Promise<void>;

  // Onboarding preferences
  vehicleType: VehicleType | null;
  setVehicleType: (type: VehicleType) => Promise<void>;
  fuelPreference: FuelPreference | null;
  setFuelPreference: (pref: FuelPreference) => Promise<void>;
  referralSource: ReferralSource | null;
  setReferralSource: (source: ReferralSource) => Promise<void>;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Init
  initializeApp: () => Promise<void>;
}

const FAVORITES_KEY = '@fuelradar_favorites';
const ALERTS_KEY = '@fuelradar_alerts';
const ONBOARDING_KEY = '@fuelradar_onboarding';
const LANGUAGE_KEY = '@fuelradar_language';
const LOCATION_KEY = '@fuelradar_location';
const LOCATION_PERMISSION_KEY = '@fuelradar_location_permission';
const DEVICE_ID_KEY = '@fuelradar_device_id';
const VEHICLE_TYPE_KEY = '@fuelradar_vehicle_type';
const FUEL_PREFERENCE_KEY = '@fuelradar_fuel_preference';
const REFERRAL_SOURCE_KEY = '@fuelradar_referral_source';

const generateUUID = (): string => {
  const chars = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) uuid += '-';
    if (i === 12) { uuid += '4'; continue; }
    if (i === 16) { uuid += chars[(Math.random() * 4 | 0) + 8]; continue; }
    uuid += chars[Math.random() * 16 | 0];
  }
  return uuid;
};

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return localStorage.getItem(key);
      return await AsyncStorage.getItem(key);
    } catch {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
      await AsyncStorage.setItem(key, value);
    } catch {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    }
  },
};

export const useStore = create<AppState>((set, get) => ({
  language: 'en' as Language,
  setLanguage: async (lang) => {
    set({ language: lang });
    await safeStorage.setItem(LANGUAGE_KEY, lang);
  },
  t: (key) => {
    const lang = get().language;
    return translations[lang][key] || translations.de[key] || key;
  },

  // Device
  deviceId: null,
  loadDeviceId: async () => {
    let id = await safeStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateUUID();
      await safeStorage.setItem(DEVICE_ID_KEY, id);
    }
    set({ deviceId: id });
    return id;
  },

  // Location
  location: null,
  setLocation: (location) => {
    set({ location });
    safeStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  },

  locationPermissionStatus: 'unknown',
  setLocationPermissionStatus: async (status) => {
    set({ locationPermissionStatus: status });
    await safeStorage.setItem(LOCATION_PERMISSION_KEY, status);
  },

  selectedFuelType: 'e10',
  setSelectedFuelType: (type) => set({ selectedFuelType: type }),

  stations: [],
  setStations: (stations) => set({ stations }),
  selectedStation: null,
  setSelectedStation: (station) => set({ selectedStation: station }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchLocationName: '',
  setSearchLocationName: (name) => set({ searchLocationName: name }),

  searchRadius: 10,
  setSearchRadius: (radius) => set({ searchRadius: radius }),

  // Favorites
  favorites: [],
  loadFavorites: async () => {
    const deviceId = get().deviceId;
    if (deviceId) {
      try {
        const backendFavorites = await fuelApi.getFavorites(deviceId);
        if (Array.isArray(backendFavorites)) {
          const mapped: Favorite[] = backendFavorites.map((f: any) => ({
            id: String(f.id),
            station_id: f.station_id,
            station_name: f.station_name,
            station_brand: f.station_brand,
            lat: f.lat,
            lng: f.lng,
            created_at: f.created_at,
          }));
          set({ favorites: mapped });
          await safeStorage.setItem(FAVORITES_KEY, JSON.stringify(mapped));
          return;
        }
      } catch {
        // fall through to local storage
      }
    }
    try {
      const stored = await safeStorage.getItem(FAVORITES_KEY);
      if (stored) set({ favorites: JSON.parse(stored) });
    } catch {}
  },
  addFavorite: async (favorite) => {
    const newFavorite: Favorite = {
      ...favorite,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    const updated = [...get().favorites, newFavorite];
    set({ favorites: updated });
    await safeStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));

    const deviceId = get().deviceId;
    if (deviceId) {
      try {
        const resp = await fuelApi.addFavorite(deviceId, {
          station_id: favorite.station_id,
          station_name: favorite.station_name,
          station_brand: favorite.station_brand,
          lat: favorite.lat,
          lng: favorite.lng,
        });
        if (resp?.id) {
          const synced = get().favorites.map((f) =>
            f.station_id === favorite.station_id ? { ...f, id: String(resp.id) } : f
          );
          set({ favorites: synced });
          await safeStorage.setItem(FAVORITES_KEY, JSON.stringify(synced));
        }
      } catch {}
    }
  },
  removeFavorite: async (stationId) => {
    const updated = get().favorites.filter((f) => f.station_id !== stationId);
    set({ favorites: updated });
    await safeStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));

    const deviceId = get().deviceId;
    if (deviceId) {
      try { await fuelApi.removeFavorite(deviceId, stationId); } catch {}
    }
  },
  isFavorite: (stationId) => get().favorites.some((f) => f.station_id === stationId),

  // Alerts
  alerts: [],
  loadAlerts: async () => {
    const deviceId = get().deviceId;
    if (deviceId) {
      try {
        const backendAlerts = await fuelApi.getAlerts(deviceId);
        if (Array.isArray(backendAlerts)) {
          const mapped: Alert[] = backendAlerts.map((a: any) => ({
            id: String(a.id),
            alert_type: a.alert_type,
            fuel_type: a.fuel_type,
            threshold_price: a.threshold_price ?? 0,
            station_id: a.station_id,
            station_name: a.station_name,
            lat: a.lat,
            lng: a.lng,
            is_active: a.is_active,
            created_at: a.created_at,
          }));
          set({ alerts: mapped });
          await safeStorage.setItem(ALERTS_KEY, JSON.stringify(mapped));
          return;
        }
      } catch {
        // fall through to local storage
      }
    }
    try {
      const stored = await safeStorage.getItem(ALERTS_KEY);
      if (stored) set({ alerts: JSON.parse(stored) });
    } catch {}
  },
  addAlert: async (alert) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    const updated = [...get().alerts, newAlert];
    set({ alerts: updated });
    await safeStorage.setItem(ALERTS_KEY, JSON.stringify(updated));

    const deviceId = get().deviceId;
    const location = get().location;
    if (deviceId) {
      try {
        const resp = await fuelApi.createAlert(deviceId, {
          alert_type: alert.alert_type || 'fuel_threshold',
          fuel_type: alert.fuel_type,
          threshold_price: alert.threshold_price,
          station_id: alert.station_id,
          station_name: alert.station_name,
          lat: alert.lat ?? location?.latitude,
          lng: alert.lng ?? location?.longitude,
          radius_km: 10,
        });
        if (resp?.id) {
          const synced = get().alerts.map((a) =>
            a.id === newAlert.id ? { ...a, id: String(resp.id) } : a
          );
          set({ alerts: synced });
          await safeStorage.setItem(ALERTS_KEY, JSON.stringify(synced));
        }
      } catch {}
    }
  },
  removeAlert: async (alertId) => {
    const updated = get().alerts.filter((a) => a.id !== alertId);
    set({ alerts: updated });
    await safeStorage.setItem(ALERTS_KEY, JSON.stringify(updated));

    const deviceId = get().deviceId;
    if (deviceId) {
      const numericId = parseInt(alertId, 10);
      if (!isNaN(numericId)) {
        try { await fuelApi.deleteAlert(deviceId, numericId); } catch {}
      }
    }
  },
  toggleAlert: async (alertId) => {
    const alert = get().alerts.find((a) => a.id === alertId);
    const updated = get().alerts.map((a) =>
      a.id === alertId ? { ...a, is_active: !a.is_active } : a
    );
    set({ alerts: updated });
    await safeStorage.setItem(ALERTS_KEY, JSON.stringify(updated));

    const deviceId = get().deviceId;
    if (deviceId && alert) {
      const numericId = parseInt(alertId, 10);
      if (!isNaN(numericId)) {
        try { await fuelApi.updateAlert(deviceId, numericId, { is_active: !alert.is_active }); } catch {}
      }
    }
  },

  // Onboarding
  hasSeenOnboarding: false,
  setHasSeenOnboarding: async (seen) => {
    set({ hasSeenOnboarding: seen });
    await safeStorage.setItem(ONBOARDING_KEY, JSON.stringify(seen));
  },
  loadOnboardingStatus: async () => {
    try {
      const stored = await safeStorage.getItem(ONBOARDING_KEY);
      if (stored) set({ hasSeenOnboarding: JSON.parse(stored) });
    } catch {}
  },

  // Onboarding preferences
  vehicleType: null,
  setVehicleType: async (type) => {
    set({ vehicleType: type });
    await safeStorage.setItem(VEHICLE_TYPE_KEY, type);
  },
  fuelPreference: null,
  setFuelPreference: async (pref) => {
    set({ fuelPreference: pref });
    await safeStorage.setItem(FUEL_PREFERENCE_KEY, pref);
    // Map extended preference to the API-supported fuel type
    const fuelMap: Record<string, FuelType> = {
      diesel: 'diesel', premium_diesel: 'diesel',
      e5: 'e5', super_plus: 'e5',
      e10: 'e10', lpg: 'e10', cng: 'e10', hvo: 'diesel', adblue: 'diesel',
    };
    const mapped = fuelMap[pref];
    if (mapped) set({ selectedFuelType: mapped });
  },
  referralSource: null,
  setReferralSource: async (source) => {
    set({ referralSource: source });
    await safeStorage.setItem(REFERRAL_SOURCE_KEY, source);
  },

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  initializeApp: async () => {
    try {
      const [storedLang, storedLocation, storedPermission, storedVehicle, storedFuelPref, storedReferral] = await Promise.all([
        safeStorage.getItem(LANGUAGE_KEY),
        safeStorage.getItem(LOCATION_KEY),
        safeStorage.getItem(LOCATION_PERMISSION_KEY),
        safeStorage.getItem(VEHICLE_TYPE_KEY),
        safeStorage.getItem(FUEL_PREFERENCE_KEY),
        safeStorage.getItem(REFERRAL_SOURCE_KEY),
      ]);

      if (storedLang && (storedLang === 'de' || storedLang === 'en')) {
        set({ language: storedLang as Language });
      }
      if (storedLocation) {
        try { set({ location: JSON.parse(storedLocation) }); } catch {}
      }
      if (storedPermission) {
        set({ locationPermissionStatus: storedPermission as any });
      }
      if (storedVehicle) set({ vehicleType: storedVehicle as any });
      if (storedFuelPref) set({ fuelPreference: storedFuelPref as any });
      if (storedReferral) set({ referralSource: storedReferral as any });

      // Load or generate device UUID then register with backend
      const deviceId = await get().loadDeviceId();
      try {
        await fuelApi.registerDevice(deviceId, undefined, Platform.OS, get().language);
      } catch {}

      await get().loadOnboardingStatus();
      await get().loadFavorites();
      await get().loadAlerts();
    } catch (error) {
      console.warn('[initializeApp]', error instanceof Error ? error.message : error);
    }
  },
}));
