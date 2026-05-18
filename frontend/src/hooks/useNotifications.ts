import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { fuelApi } from '../services/api';
import { useStore } from '../store/useStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionStatus;
}

export async function requestNotificationPermissions(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'denied';
  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === 'granted') return 'granted';
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PermissionStatus;
}

async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  // Use safe hardcoded strings — store may not be hydrated when this runs at startup.
  // These are only visible in Android OS notification settings.
  const { t } = useStore.getState();
  const channelName = t('priceAlerts') || 'Preisalarme';
  const channelDesc = t('androidChannelPriceAlertsDesc') || 'Benachrichtigungen wenn Kraftstoffpreise fallen';
  await Notifications.setNotificationChannelAsync('price-alerts', {
    name: channelName,
    description: channelDesc,
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#32D74B',
    sound: 'default',
  });
}

async function setupDefaultAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'FuelRadar',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

/**
 * Call once at app startup (before any notifications are scheduled).
 * Creates required Android notification channels so local demo notifications
 * work on Android 8+ even before the user registers for push.
 */
export async function initAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Promise.all([setupDefaultAndroidChannel(), setupAndroidChannel()]);
  } catch (err) {
    console.warn('[Notifications] Channel init failed (non-fatal):', err);
  }
}

// Modern Expo Go detection: appOwnership === 'expo' means running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export async function registerForPushNotifications(
  deviceId: string,
  locale: string = 'de'
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // Expo Go on Android SDK 53+ cannot get remote push tokens
  if (isExpoGo && Platform.OS === 'android') {
    console.warn(
      '[Notifications] Expo Go on Android SDK 53+ does not support remote push notifications. ' +
        'Use a Development Build or production build to test push notifications.'
    );
    return null;
  }

  const status = await requestNotificationPermissions();
  if (status !== 'granted') return null;

  await setupAndroidChannel();

  let token: string | null = null;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    token = tokenData.data;
  } catch (err) {
    // iOS Simulator and unsupported environments throw here — not a fatal error
    console.warn('[Notifications] Could not get push token (simulator or unsupported env):', err);
    return null;
  }

  if (!token) return null;

  // Register device + push token via Supabase Edge Functions
  try {
    await fuelApi.registerDevice(deviceId, token, Platform.OS, locale);
  } catch (err) {
    console.warn('[Notifications] Device registration failed (non-fatal):', err);
  }

  return token;
}

export function useNotifications() {
  const router = useRouter();
  const { deviceId, language } = useStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    registerForPushNotifications(deviceId, language);

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    // Called when user taps a notification — deep-link to relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, any>;
      if (data?.type === 'price_alert' || data?.type === 'station_change') {
        router.push('/(tabs)/alerts');
      } else if (data?.type === 'cheaper_nearby' || data?.type === 'weekly_report') {
        router.push('/(tabs)/map');
      } else if (data?.type === 'favorite_price_change' && data?.station_id) {
        router.push(`/station/${data.station_id}`);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [deviceId]);
}
