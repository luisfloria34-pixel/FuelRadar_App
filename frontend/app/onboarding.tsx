import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { LocationPermissionModal } from '../src/components/LocationPermissionModal';
import { VehicleType, FuelPreference, ReferralSource } from '../src/types';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    setHasSeenOnboarding,
    setLocationPermissionStatus,
    setLocation,
    setVehicleType,
    setFuelPreference,
    setReferralSource,
  } = useStore();
  const { t } = useTranslation();

  const [step, setStep] = useState(0); // 0=vehicle, 1=fuel, 2=referral
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedFuel, setSelectedFuel] = useState<FuelPreference | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<ReferralSource | null>(null);

  // ─── Vehicle options ───────────────────────────────────────────────────────
  const vehicleOptions: { type: VehicleType; icon: string; label: string; disabled?: boolean }[] = [
    { type: 'small_car', icon: '🚗', label: t('vehicleSmallCar') },
    { type: 'sedan', icon: '🚙', label: t('vehicleSedan') },
    { type: 'suv', icon: '🚕', label: t('vehicleSuv') },
    { type: 'van', icon: '🚐', label: t('vehicleVan') },
    { type: 'motorcycle', icon: '🏍️', label: t('vehicleMotorcycle') },
    { type: 'electric', icon: '⚡', label: t('vehicleElectric'), disabled: true },
  ];

  // ─── Fuel options ─────────────────────────────────────────────────────────
  const fuelOptions: { type: FuelPreference; icon: string; label: string; color: string; disabled?: boolean }[] = [
    { type: 'diesel', icon: '⚫', label: t('diesel'), color: COLORS.diesel },
    { type: 'e5', icon: '🔵', label: t('superE5'), color: COLORS.e5 },
    { type: 'e10', icon: '🟢', label: t('superE10'), color: COLORS.e10 },
    { type: 'super_plus', icon: '🟡', label: t('fuelSuperPlus'), color: '#F59E0B' },
    { type: 'premium_diesel', icon: '⚪', label: t('fuelPremiumDiesel'), color: '#94A3B8' },
    { type: 'lpg', icon: '🔶', label: t('fuelLpg'), color: '#F97316' },
    { type: 'cng', icon: '💨', label: t('fuelCng'), color: '#22D3EE' },
    { type: 'hvo', icon: '🌿', label: t('fuelHvo'), color: '#4ADE80' },
    { type: 'adblue', icon: '💧', label: t('fuelAdblue'), color: '#60A5FA' },
  ];

  // ─── Referral options ─────────────────────────────────────────────────────
  const referralOptions: { type: ReferralSource; icon: string; label: string }[] = [
    { type: 'tiktok', icon: '🎵', label: t('referralTiktok') },
    { type: 'instagram', icon: '📸', label: t('referralInstagram') },
    { type: 'friends', icon: '👥', label: t('referralFriends') },
    { type: 'website', icon: '🌐', label: t('referralWebsite') },
    { type: 'google', icon: '🔍', label: t('referralGoogle') },
    { type: 'other', icon: '✨', label: t('referralOther') },
  ];

  const canContinue = () => {
    if (step === 0) return selectedVehicle !== null && selectedVehicle !== 'electric';
    if (step === 1) return selectedFuel !== null;
    if (step === 2) return selectedReferral !== null;
    return false;
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      // Save all preferences
      if (selectedVehicle) await setVehicleType(selectedVehicle);
      if (selectedFuel) await setFuelPreference(selectedFuel);
      if (selectedReferral) await setReferralSource(selectedReferral);
      // Show location modal
      setShowLocationModal(true);
    }
  };

  const handleSkip = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  const handleLocationAllow = async () => {
    setShowLocationModal(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        await setLocationPermissionStatus('granted');
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } catch {}
      } else {
        await setLocationPermissionStatus('denied');
      }
    } catch {}
    await setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  const handleLocationDeny = async () => {
    setShowLocationModal(false);
    await setLocationPermissionStatus('denied');
    await setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  // ─── Step titles & subtitles ──────────────────────────────────────────────
  const stepTitle = [
    t('onboardingVehicleTitle'),
    t('onboardingFuelTitle'),
    t('onboardingReferralTitle'),
  ][step];

  const stepSubtitle = [
    t('onboardingVehicleSubtitle'),
    t('onboardingFuelSubtitle'),
    t('onboardingReferralSubtitle'),
  ][step];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LocationPermissionModal
        visible={showLocationModal}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressSegment, i <= step && styles.progressSegmentActive]}
            />
          ))}
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('skip')}</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepTitle}>{stepTitle}</Text>
          <Text style={styles.stepSubtitle}>{stepSubtitle}</Text>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 0: Vehicle ─────────────────────────────────────────── */}
          {step === 0 && (
            <View style={styles.grid}>
              {vehicleOptions.map((opt) => {
                const isSelected = selectedVehicle === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.gridCard,
                      isSelected && styles.gridCardSelected,
                      opt.disabled && styles.gridCardDisabled,
                    ]}
                    onPress={() => !opt.disabled && setSelectedVehicle(opt.type)}
                    activeOpacity={opt.disabled ? 1 : 0.7}
                  >
                    <Text style={styles.gridCardIcon}>{opt.icon}</Text>
                    <Text style={[styles.gridCardLabel, isSelected && styles.gridCardLabelSelected]}>
                      {opt.label}
                    </Text>
                    {opt.disabled && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>{t('comingSoon')}</Text>
                      </View>
                    )}
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.accentGreen} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Step 1: Fuel ────────────────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.listColumn}>
              {fuelOptions.map((opt) => {
                const isSelected = selectedFuel === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.listItem,
                      isSelected && { borderColor: opt.color, backgroundColor: opt.color + '12' },
                    ]}
                    onPress={() => setSelectedFuel(opt.type)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.fuelDot, { backgroundColor: opt.color }]} />
                    <Text style={[styles.listItemLabel, isSelected && { color: opt.color }]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={opt.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Step 2: Referral ────────────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.grid}>
              {referralOptions.map((opt) => {
                const isSelected = selectedReferral === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => setSelectedReferral(opt.type)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.gridCardIcon}>{opt.icon}</Text>
                    <Text style={[styles.gridCardLabel, isSelected && styles.gridCardLabelSelected]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.accentGreen} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Footer button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue() && styles.continueButtonDisabled]}
            onPress={handleNext}
            activeOpacity={canContinue() ? 0.8 : 1}
            disabled={!canContinue()}
          >
            <Text style={[styles.continueText, !canContinue() && styles.continueTextDisabled]}>
              {step === TOTAL_STEPS - 1 ? t('finish') : t('continue')}
            </Text>
            <Ionicons
              name={step === TOTAL_STEPS - 1 ? 'checkmark' : 'arrow-forward'}
              size={20}
              color={canContinue() ? '#000' : COLORS.textMuted}
            />
          </TouchableOpacity>

          {!canContinue() && (
            <TouchableOpacity style={styles.skipStepButton} onPress={() => {
              if (step < TOTAL_STEPS - 1) setStep(step + 1);
              else handleSkip();
            }}>
              <Text style={styles.skipStepText}>{t('skip_for_now')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const CARD_W = (width - SPACING.lg * 2 - SPACING.md) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },

  // Progress
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  progressSegmentActive: { backgroundColor: COLORS.accentGreen },

  // Skip
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  skipText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },

  // Header
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  stepSubtitle: { fontSize: 15, color: COLORS.textSecondary },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // Grid (vehicle + referral)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  gridCard: {
    width: CARD_W,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.card,
  },
  gridCardSelected: {
    borderColor: COLORS.accentGreen,
    backgroundColor: COLORS.accentGreen + '10',
  },
  gridCardDisabled: { opacity: 0.45 },
  gridCardIcon: { fontSize: 34, marginBottom: SPACING.sm },
  gridCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  gridCardLabelSelected: { color: COLORS.accentGreen },
  checkmark: { position: 'absolute', top: SPACING.sm, right: SPACING.sm },
  comingSoonBadge: {
    marginTop: 6,
    backgroundColor: COLORS.accentAmber + '25',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  comingSoonText: { fontSize: 10, fontWeight: '700', color: COLORS.accentAmber },

  // List (fuel)
  listColumn: { gap: SPACING.sm },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  fuelDot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.md },
  listItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Footer
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentGreen,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  continueText: { fontSize: 17, fontWeight: '700', color: '#000' },
  continueTextDisabled: { color: COLORS.textMuted },
  skipStepButton: { alignItems: 'center', paddingVertical: SPACING.sm },
  skipStepText: { fontSize: 14, color: COLORS.textSecondary },
});
