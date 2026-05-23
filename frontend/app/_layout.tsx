import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../src/constants/theme';
import { useNotifications, initAndroidChannels } from '../src/hooks/useNotifications';

// Startup diagnostics — logs true/false only, never secret values
console.log('[FuelRadar] env check', {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || null,
  supabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  apiUrl: process.env.EXPO_PUBLIC_API_URL || null,
  platform: Platform.OS,
});

// Create Android notification channels as early as possible so local
// notifications work immediately (Android 8+ requires channels to exist first).
initAndroidChannels();

function NotificationSetup() {
  useNotifications();
  return null;
}

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <NotificationSetup />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="station/[id]" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card'
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card'
          }} 
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
