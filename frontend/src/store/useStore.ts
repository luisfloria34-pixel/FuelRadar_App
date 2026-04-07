import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Station, FuelType, Alert, Favorite, Location } from '../types';
import { translations, Language, TranslationKey } from '../constants/translations';

interface AppState {
  // Language
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  
  // Location
  location: Location | null;
  setLocation: (location: Location) => void;
  
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

// Safe storage wrapper that handles web/native differences
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.log('Storage getItem error:', error);
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.log('Storage setItem error:', error);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    }
  },
};

export const useStore = create<AppState>((set, get) => ({
  // Language - German as default
  language: 'de' as Language,
  setLanguage: async (lang) => {
    set({ language: lang });
    await safeStorage.setItem(LANGUAGE_KEY, lang);
  },
  t: (key) => {
    const lang = get().language;
    return translations[lang][key] || translations.de[key] || key;
  },
  
  // Location
  location: null,
  setLocation: (location) => set({ location }),
  
  // Selected fuel type
  selectedFuelType: 'e10',
  setSelectedFuelType: (type) => set({ selectedFuelType: type }),
  
  // Stations
  stations: [],
  setStations: (stations) => set({ stations }),
  selectedStation: null,
  setSelectedStation: (station) => set({ selectedStation: station }),
  
  // Search query and location
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchLocationName: '',
  setSearchLocationName: (name) => set({ searchLocationName: name }),

  // Search radius
  searchRadius: 10,
  setSearchRadius: (radius) => set({ searchRadius: radius }),
  
  // Favorites
  favorites: [],
  loadFavorites: async () => {
    try {
      const stored = await safeStorage.getItem(FAVORITES_KEY);
      if (stored) {
        set({ favorites: JSON.parse(stored) });
      }
    } catch (error) {
      console.log('Error loading favorites:', error);
    }
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
  },
  removeFavorite: async (stationId) => {
    const updated = get().favorites.filter((f) => f.station_id !== stationId);
    set({ favorites: updated });
    await safeStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  },
  isFavorite: (stationId) => {
    return get().favorites.some((f) => f.station_id === stationId);
  },
  
  // Alerts
  alerts: [],
  loadAlerts: async () => {
    try {
      const stored = await safeStorage.getItem(ALERTS_KEY);
      if (stored) {
        set({ alerts: JSON.parse(stored) });
      }
    } catch (error) {
      console.log('Error loading alerts:', error);
    }
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
  },
  removeAlert: async (alertId) => {
    const updated = get().alerts.filter((a) => a.id !== alertId);
    set({ alerts: updated });
    await safeStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
  },
  toggleAlert: async (alertId) => {
    const updated = get().alerts.map((a) =>
      a.id === alertId ? { ...a, is_active: !a.is_active } : a
    );
    set({ alerts: updated });
    await safeStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
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
      if (stored) {
        set({ hasSeenOnboarding: JSON.parse(stored) });
      }
    } catch (error) {
      console.log('Error loading onboarding status:', error);
    }
  },
  
  // Loading state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  // Initialize app - load all stored data
  initializeApp: async () => {
    try {
      // Load language
      const storedLang = await safeStorage.getItem(LANGUAGE_KEY);
      if (storedLang && (storedLang === 'de' || storedLang === 'en')) {
        set({ language: storedLang as Language });
      }
      
      // Load other data
      await get().loadOnboardingStatus();
      await get().loadFavorites();
      await get().loadAlerts();
    } catch (error) {
      console.log('Error initializing app:', error);
    }
  },
}));
