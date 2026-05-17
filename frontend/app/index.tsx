import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';
import { useTranslation } from '../src/hooks/useTranslation';

// AsyncStorage key — must match ONBOARDING_KEY in useStore.ts
const ONBOARDING_KEY = '@fuelradar_onboarding';

export default function SplashScreen() {
  const router = useRouter();
  const { initializeApp } = useStore();
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    const boot = async () => {
      // Read onboarding state DIRECTLY from AsyncStorage — avoids store timing issues.
      // The store may not be hydrated yet when routing decisions are needed.
      const raw = await AsyncStorage.getItem(ONBOARDING_KEY).catch(() => null);
      const completed = raw === 'true';
      console.log('[Splash] onboardingCompleted raw value:', raw, '| resolved:', completed);

      // Hydrate the full store in parallel
      await initializeApp();

      // Minimum splash duration so logo is visible
      await new Promise<void>((r) => setTimeout(r, 1200));

      if (completed) {
        console.log('[Splash] → navigating to /(tabs)');
        router.replace('/(tabs)');
      } else {
        console.log('[Splash] → navigating to /onboarding (first install or reset)');
        router.replace('/onboarding');
      }
    };

    boot();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconWrapper}>
          <View style={styles.radarCircle1} />
          <View style={styles.radarCircle2} />
          <View style={styles.radarCircle3} />
          <View style={styles.pinContainer}>
            <Ionicons name="location" size={40} color={COLORS.accentGreen} />
          </View>
        </View>
        <Text style={styles.title}>FuelRadar</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.loadingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  logoContainer: { alignItems: 'center' },
  iconWrapper: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  radarCircle1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: COLORS.accentGreen + '30' },
  radarCircle2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderColor: COLORS.accentGreen + '50' },
  radarCircle3: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.accentGreen + '70' },
  pinContainer: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -1 },
  tagline: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.sm },
  footer: { position: 'absolute', bottom: 60 },
  loadingDots: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accentGreen, marginHorizontal: 4, opacity: 0.3 },
  dot1: { opacity: 1 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.3 },
});
