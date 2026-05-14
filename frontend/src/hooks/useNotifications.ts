import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { fuelApi } from '../services/api';
import { useStore } from '../store/useStore';

// Show notifications while app is in foreground
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
  await Notifications.setNotificationChannelAsync('price-alerts', {
    name: 'Preisalarme',
    description: 'Benachrichtigungen wenn Kraftstoffpreise fallen',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#32D74B',
    sound: 'default',
  });
}

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export async function registerForPushNotifications(
  deviceId: string,
  locale: string = 'de'
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (isExpoGo) {
    console.warn('[Notifications] Push tokens not supported in Expo Go. Use an EAS development build or production build.');
    return null;
  }

  const status = await requestNotificationPermissions();
  if (status !== 'granted') return null;

  await setupAndroidChannel();

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = tokenData.data;
    await fuelApi.registerDevice(deviceId, token, Platform.OS, locale);
    return token;
  } catch (err) {
    console.warn('[Notifications] Push token error:', err);
    return null;
  }
}

export function useNotifications() {
  const router = useRouter();
  const { deviceId, language } = useStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    registerForPushNotifications(deviceId, language);

    // Called when a notification arrives while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // setNotificationHandler already shows the notification UI; nothing extra needed
    });

    // Called when user taps a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, any>;
      const navigableTypes = ['price_alert', 'station_change', 'cheaper_nearby'];
      if (navigableTypes.includes(data?.type)) {
        router.push('/(tabs)/alerts');
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [deviceId]);
}
