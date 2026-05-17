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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { LocationPermissionModal } from '../src/components/LocationPermissionModal';
import { VehicleType, FuelPreference, ReferralSource } from '../src/types';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 3;
const CARD_W = (width - SPACING.lg * 2 - SPACING.md) / 2;

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

  console.log('[Onboarding] step:', step, '| vehicle:', selectedVehicle, '| fuel:', selectedFuel, '| referral:', selectedReferral);

  // ─── Option lists ────────────────────────────────────────────────────────────

  const vehicleOptions: { type: VehicleType; icon: string; label: string; disabled?: boolean }[] = [
    { type: 'small_car',   icon: 'car-hatchback',  label: t('vehicleSmallCar') },
    { type: 'sedan',       icon: 'car-limousine',  label: t('vehicleSedan') },
    { type: 'suv',         icon: 'car-estate',     label: t('vehicleSuv') },
    { type: 'van',         icon: 'van-utility',    label: t('vehicleVan') },
    { type: 'motorcycle',  icon: 'motorbike',      label: t('vehicleMotorcycle') },
    { type: 'electric',    icon: 'car-electric',   label: t('vehicleElectric'), disabled: true },
  ];

  const fuelOptions: { type: FuelPreference; label: string; color: string }[] = [
    { type: 'diesel',         label: t('diesel'),         color: COLORS.diesel },
    { type: 'e5',             label: t('superE5'),        color: COLORS.e5 },
    { type: 'e10',            label: t('superE10'),       color: COLORS.e10 },
    { type: 'super_plus',     label: t('fuelSuperPlus'),  color: '#F59E0B' },
    { type: 'premium_diesel', label: t('fuelPremiumDiesel'), color: '#94A3B8' },
    { type: 'lpg',            label: t('fuelLpg'),        color: '#F97316' },
    { type: 'cng',            label: t('fuelCng'),        color: '#22D3EE' },
    { type: 'hvo',            label: t('fuelHvo'),        color: '#4ADE80' },
    { type: 'adblue',         label: t('fuelAdblue'),     color: '#60A5FA' },
  ];

  const referralOptions: { type: ReferralSource; icon: string; label: string }[] = [
    { type: 'instagram', icon: '📸', label: t('referralInstagram') },
    { type: 'tiktok',    icon: '🎵', label: t('referralTiktok') },
    { type: 'friends',   icon: '👥', label: t('referralFriends') },
    { type: 'website',   icon: '🌐', label: t('referralWebsite') },
    { type: 'google',    icon: '🔍', label: t('referralGoogle') },
    { type: 'other',     icon: '✨', label: t('referralOther') },
  ];

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const canContinue = () => {
    if (step === 0) return selectedVehicle !== null;
    if (step === 1) return selectedFuel !== null;
    if (step === 2) return true; // referral is optional
    return false;
  };

  /** Save answers, mark onboarding done, go to main tabs */
  const finishOnboarding = async () => {
    if (selectedVehicle) await setVehicleType(selectedVehicle);
    if (selectedFuel)   await setFuelPreference(selectedFuel);
    if (selectedReferral) await setReferralSource(selectedReferral);

    await setHasSeenOnboarding(true);
    console.log('[Onboarding] completed — vehicle:', selectedVehicle, '| fuel:', selectedFuel, '| referral:', selectedReferral);
    router.replace('/(tabs)');
  };

  /** Skip entire onboarding — still marks it as seen */
  const handleSkipAll = async () => {
    console.log('[Onboarding] skipped entirely');
    await setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS - 1) {
      console.log('[Onboarding] advancing to step', step + 1);
      setStep(step + 1);
    } else {
      // Last step — show location modal, then finish
      setShowLocationModal(true);
    }
  };

  const handleSkipStep = () => {
    if (step < TOTAL_STEPS - 1) {
      console.log('[Onboarding] skipping step', step, '→', step + 1);
      setStep(step + 1);
    } else {
      setShowLocationModal(true);
    }
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
    await finishOnboarding();
  };

  const handleLocationDeny = async () => {
    setShowLocationModal(false);
    await setLocationPermissionStatus('denied');
    await finishOnboarding();
  };

  // ─── Titles ───────────────────────────────────────────────────────────────────

  const stepTitles = [t('onboardingVehicleTitle'), t('onboardingFuelTitle'), t('onboardingReferralTitle')];
  const stepSubtitles = [t('onboardingVehicleSubtitle'), t('onboardingFuelSubtitle'), t('onboardingReferralSubtitle')];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LocationPermissionModal
        visible={showLocationModal}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Progress bar ───────────────────────────────────────── */}
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.progressSeg, i <= step && styles.progressSegActive]} />
          ))}
        </View>

        {/* ── Skip all ───────────────────────────────────────────── */}
        <TouchableOpacity style={styles.skipAllBtn} onPress={handleSkipAll}>
          <Text style={styles.skipAllText}>{t('skip')}</Text>
        </TouchableOpacity>

        {/* ── Step header ────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.stepTitle}>{stepTitles[step]}</Text>
          <Text style={styles.stepSubtitle}>{stepSubtitles[step]}</Text>
        </View>

        {/* ── Option lists ───────────────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Step 0 — Vehicle ──────────────────────────────────── */}
          {step === 0 && (
            <View style={styles.grid}>
              {vehicleOptions.map((opt) => {
                const isSelected = selectedVehicle === opt.type;
                const iconColor = isSelected
                  ? COLORS.accentGreen
                  : opt.disabled
                  ? COLORS.textMuted
                  : COLORS.textSecondary;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.gridCard,
                      isSelected && styles.gridCardSelected,
                      opt.disabled && styles.gridCardDisabled,
                    ]}
                    onPress={() => {
                      if (opt.disabled) return;
                      console.log('[Onboarding] selected vehicle:', opt.type);
                      setSelectedVehicle(opt.type);
                    }}
                    activeOpacity={opt.disabled ? 1 : 0.7}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={38}
                      color={iconColor}
                      style={styles.vehicleIcon}
                    />
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

          {/* Step 1 — Fuel ─────────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.listCol}>
              {fuelOptions.map((opt) => {
                const isSelected = selectedFuel === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.listItem,
                      isSelected && { borderColor: opt.color, backgroundColor: opt.color + '12' },
                    ]}
                    onPress={() => {
                      console.log('[Onboarding] selected fuel:', opt.type);
                      setSelectedFuel(opt.type);
                    }}
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

          {/* Step 2 — Referral ─────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.grid}>
              {referralOptions.map((opt) => {
                const isSelected = selectedReferral === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => {
                      console.log('[Onboarding] selected referral:', opt.type);
                      setSelectedReferral(opt.type);
                    }}
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

        {/* ── Footer ─────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue() && styles.continueBtnDisabled]}
            onPress={handleContinue}
            activeOpacity={canContinue() ? 0.85 : 1}
            disabled={!canContinue()}
          >
            <Text style={[styles.continueBtnText, !canContinue() && styles.continueBtnTextDisabled]}>
              {step === TOTAL_STEPS - 1 ? t('finish') : t('continue')}
            </Text>
            {canContinue() && (
              <Ionicons
                name={step === TOTAL_STEPS - 1 ? 'checkmark' : 'arrow-forward'}
                size={20}
                color="#000"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipStepBtn} onPress={handleSkipStep}>
            <Text style={styles.skipStepText}>{t('skip_for_now')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },

  // Progress
  progressBar: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, gap: SPACING.xs },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  progressSegActive: { backgroundColor: COLORS.accentGreen },

  // Header
  skipAllBtn: { alignSelf: 'flex-end', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  skipAllText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  header: { paddingHorizontal: SPACING.lg, paddingTop: 4, paddingBottom: SPACING.lg },
  stepTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  stepSubtitle: { fontSize: 15, color: COLORS.textSecondary },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },

  // Grid layout (vehicle + referral)
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  gridCard: {
    width: CARD_W, backgroundColor: COLORS.cardBackground, borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, position: 'relative', ...SHADOWS.card,
  },
  gridCardSelected: { borderColor: COLORS.accentGreen, backgroundColor: COLORS.accentGreen + '10' },
  gridCardDisabled: { opacity: 0.4 },
  gridCardIcon: { fontSize: 32, marginBottom: SPACING.sm },
  vehicleIcon: { marginBottom: SPACING.sm },
  gridCardLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  gridCardLabelSelected: { color: COLORS.accentGreen },
  checkmark: { position: 'absolute', top: SPACING.sm, right: SPACING.sm },
  comingSoonBadge: { marginTop: 5, backgroundColor: COLORS.accentAmber + '25', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  comingSoonText: { fontSize: 10, fontWeight: '700', color: COLORS.accentAmber },

  // List layout (fuel)
  listCol: { gap: SPACING.sm },
  listItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.card,
  },
  fuelDot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.md },
  listItemLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },

  // Footer
  footer: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, paddingTop: SPACING.sm, gap: SPACING.sm },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accentGreen, borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md + 2, gap: SPACING.sm, ...SHADOWS.medium,
  },
  continueBtnDisabled: {
    backgroundColor: COLORS.cardBackground, borderWidth: 1, borderColor: COLORS.border,
  },
  continueBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
  continueBtnTextDisabled: { color: COLORS.textMuted },
  skipStepBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  skipStepText: { fontSize: 14, color: COLORS.textSecondary },
});
