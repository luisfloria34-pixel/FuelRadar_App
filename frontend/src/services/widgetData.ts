/**
 * FuelRadar iOS Widget — shared data placeholder
 *
 * This module writes widget-relevant state to AsyncStorage.
 * When the iOS widget is implemented (see WIDGET_SETUP.md), the native
 * extension will read from an App Groups shared container instead.
 * Until then, this acts as a safe no-op placeholder that can be called
 * freely without affecting the rest of the app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const WIDGET_DATA_KEY = '@fuelradar_widget_data';

export interface WidgetData {
  preferredFuelType: string;
  cheapestStationName: string | null;
  cheapestPrice: number | null;
  distance: number | null;
  lastUpdated: string;
}

/**
 * Persist widget data to AsyncStorage.
 * The iOS WidgetKit extension will eventually read equivalent data
 * from an App Groups container written by the native bridge.
 */
export async function saveWidgetData(data: WidgetData): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[WidgetData] Failed to save widget data:', err);
  }
}

export async function loadWidgetData(): Promise<WidgetData | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return raw ? (JSON.parse(raw) as WidgetData) : null;
  } catch {
    return null;
  }
}
