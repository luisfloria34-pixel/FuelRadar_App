import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';
import { useTranslation } from '../src/hooks/useTranslation';
import { VehicleType, FuelPreference, ReferralSource } from '../src/types';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 6; // 0=welcome 1=vehicle 2=fuel 3=referral 4=location 5=ready
const CARD_W = (width - SPACING.lg * 2 - SPACING.md) / 2;

const getGPS = (ms: number): Promise<Location.LocationObject | null> =>
  Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

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

  const [step, setStep] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedFuel, setSelectedFuel] = useState<FuelPreference | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<ReferralSource | null>(null);

  console.log('[Onboarding] step:', step, '| vehicle:', selectedVehicle, '| fuel:', selectedFuel, '| referral:', selectedReferral);

  // ─── Option lists ─────────────────────────────────────────────────────────────

  const vehicleOptions: { type: VehicleType; icon: string; label: string; disabled?: boolean }[] = [
    { type: 'small_car',   icon: 'car-hatchback', label: t('vehicleSmallCar') },
    { type: 'sedan',       icon: 'car-limousine', label: t('vehicleSedan') },
    { type: 'suv',         icon: 'car-estate',    label: t('vehicleSuv') },
    { type: 'van',         icon: 'van-utility',   label: t('vehicleVan') },
    { type: 'motorcycle',  icon: 'motorbike',     label: t('vehicleMotorcycle') },
    { type: 'electric',    icon: 'car-electric',  label: t('vehicleElectric'), disabled: true },
  ];

  const fuelOptions: { type: FuelPreference; label: string; color: string; disabled?: boolean }[] = [
    { type: 'diesel',         label: t('diesel'),           color: COLORS.diesel },
    { type: 'e5',             label: t('superE5'),          color: COLORS.e5 },
    { type: 'e10',            label: t('superE10'),         color: COLORS.e10 },
    { type: 'premium_diesel', label: t('fuelPremiumDiesel'), color: '#94A3B8', disabled: true },
    { type: 'super_plus',     label: t('fuelSuperPlus'),    color: '#F59E0B', disabled: true },
    { type: 'lpg',            label: t('fuelLpg'),          color: '#F97316', disabled: true },
    { type: 'cng',            label: t('fuelCng'),          color: '#22D3EE', disabled: true },
  ];

  const referralOptions: { type: ReferralSource; icon: string; label: string }[] = [
    { type: 'instagram', icon: '📸', label: t('referralInstagram') },
    { type: 'tiktok',    icon: '🎵', label: t('referralTiktok') },
    { type: 'friends',   icon: '👥', label: t('referralFriends') },
    { type: 'google',    icon: '🔍', label: t('referralGoogle') },
    { type: 'app_store', icon: '📱', label: t('referralAppStore') },
    { type: 'other',     icon: '✨', label: t('referralOther') },
  ];

  // ─── Navigation helpers ───────────────────────────────────────────────────────

  const canContinue = () => {
    if (step === 1) return selectedVehicle !== null;
    if (step === 2) return selectedFuel !== null;
    if (step === 4) return false; // location uses its own buttons
    return true; // steps 0, 3, 5
  };

  const finishOnboarding = async () => {
    if (selectedVehicle) await setVehicleType(selectedVehicle);
    if (selectedFuel) await setFuelPreference(selectedFuel);
    if (selectedReferral) await setReferralSource(selectedReferral);
    await setHasSeenOnboarding(true);
    console.log('[Onboarding] completed — navigating to app');
    router.replace('/(tabs)');
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      console.log('[Onboarding] advancing to step', step + 1);
      setStep(s => s + 1);
    } else {
      await finishOnboarding();
    }
  };

  const handleSkipStep = () => {
    if (step < TOTAL_STEPS - 1) {
      console.log('[Onboarding] skipping step', step);
      setStep(s => s + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleSkipAll = async () => {
    console.log('[Onboarding] skipped entirely');
    await setLocationPermissionStatus('denied');
    await setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  // ─── Location handlers ────────────────────────────────────────────────────────

  const handleLocationAllow = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        await setLocationPermissionStatus('granted');
        console.log('[Onboarding] saved location permission: granted');
        const pos = await getGPS(8000);
        if (pos) {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } else {
        await setLocationPermissionStatus('denied');
        console.log('[Onboarding] saved location permission: denied (OS denied)');
      }
    } catch {
      await setLocationPermissionStatus('denied');
      console.log('[Onboarding] saved location permission: denied (error)');
    } finally {
      setLocationLoading(false);
      setStep(5);
    }
  };

  const handleLocationDeny = async () => {
    await setLocationPermissionStatus('denied');
    console.log('[Onboarding] saved location permission: denied (user skipped)');
    setStep(5);
  };

  // ─── Step meta ────────────────────────────────────────────────────────────────

  const stepTitles = [
    'FuelRadar',
    t('onboardingVehicleTitle'),
    t('onboardingFuelTitle'),
    t('onboardingReferralTitle'),
    t('onboardingLocationTitle'),
    t('onboardingReadyTitle'),
  ];

  const stepSubtitles = [
    'Live Kraftstoffpreise in Deutschland',
    t('onboardingVehicleSubtitle'),
    t('onboardingFuelSubtitle'),
    t('onboardingReferralSubtitle'),
    t('onboardingLocationSubtitle'),
    t('onboardingReadySubtitle'),
  ];

  const isLocationStep = step === 4;
  const isReadyStep = step === 5;
  const isWelcomeStep = step === 0;
  const showSkipStep = step >= 1 && step <= 3;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Progress bar ─────────────────────────────────────────── */}
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.progressSeg, i <= step && styles.progressSegActive]} />
          ))}
        </View>

        {/* ── Skip all ─────────────────────────────────────────────── */}
        {!isReadyStep && (
          <TouchableOpacity style={styles.skipAllBtn} onPress={handleSkipAll}>
            <Text style={styles.skipAllText}>{t('skip')}</Text>
          </TouchableOpacity>
        )}

        {/* ── Step content ─────────────────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, (isWelcomeStep || isReadyStep) && styles.scrollContentCentered]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Step 0 — Welcome ──────────────────────────────────────── */}
          {step === 0 && (
            <View style={styles.welcomeWrap}>
              {/* Outer view carries the glow shadow; inner clips to rounded square */}
              <View style={styles.logoShadow}>
                <View style={styles.logoClip}>
                  <Image
                    source={require('../assets/images/logo.jpg')}
                    style={styles.logoImg}
                    resizeMode="cover"
                  />
                </View>
              </View>
              <Text style={styles.welcomeTitle}>FuelRadar</Text>
              <Text style={styles.welcomeSubtitle}>Live Kraftstoffpreise in Deutschland</Text>
            </View>
          )}

          {/* Steps 1–3: header shown above content ────────────────── */}
          {step >= 1 && step <= 3 && (
            <View style={styles.header}>
              <Text style={styles.stepTitle}>{stepTitles[step]}</Text>
              <Text style={styles.stepSubtitle}>{stepSubtitles[step]}</Text>
            </View>
          )}

          {/* Step 1 — Vehicle ──────────────────────────────────────── */}
          {step === 1 && (
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
                      setSelectedVehicle(opt.type);
                      setVehicleType(opt.type);
                      console.log('[Onboarding] saved vehicle:', opt.type);
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

          {/* Step 2 — Fuel ─────────────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.listCol}>
              {fuelOptions.map((opt) => {
                const isSelected = selectedFuel === opt.type;
                const isDisabled = opt.disabled;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.listItem,
                      isSelected && { borderColor: opt.color, backgroundColor: opt.color + '12' },
                      isDisabled && styles.listItemDisabled,
                    ]}
                    onPress={() => {
                      if (isDisabled) return;
                      setSelectedFuel(opt.type);
                      setFuelPreference(opt.type);
                      console.log('[Onboarding] saved fuel:', opt.type);
                    }}
                    activeOpacity={isDisabled ? 1 : 0.7}
                  >
                    <View style={[styles.fuelDot, { backgroundColor: isDisabled ? COLORS.textMuted : opt.color }]} />
                    <Text style={[
                      styles.listItemLabel,
                      isSelected && { color: opt.color },
                      isDisabled && styles.listItemLabelDisabled,
                    ]}>
                      {opt.label}
                    </Text>
                    {isDisabled ? (
                      <View style={styles.comingSoonPill}>
                        <Text style={styles.comingSoonText}>{t('comingSoon')}</Text>
                      </View>
                    ) : isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={opt.color} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
              {/* EV / Electric — coming soon */}
              <View style={[styles.listItem, styles.listItemDisabled]}>
                <View style={[styles.fuelDot, { backgroundColor: COLORS.textMuted }]} />
                <Text style={[styles.listItemLabel, styles.listItemLabelDisabled]}>
                  {t('fuelElectricEv')}
                </Text>
                <View style={styles.comingSoonPill}>
                  <Text style={styles.comingSoonText}>{t('comingSoon')}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Step 3 — Referral ─────────────────────────────────────── */}
          {step === 3 && (
            <View style={styles.grid}>
              {referralOptions.map((opt) => {
                const isSelected = selectedReferral === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                    onPress={() => {
                      setSelectedReferral(opt.type);
                      setReferralSource(opt.type);
                      console.log('[Onboarding] saved referral:', opt.type);
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

          {/* Step 4 — Location ─────────────────────────────────────── */}
          {step === 4 && (
            <View style={styles.locationWrap}>
              <View style={styles.locationIconWrap}>
                <Ionicons name="location" size={44} color={COLORS.accentGreen} />
              </View>
              <Text style={styles.stepTitle}>{stepTitles[4]}</Text>
              <Text style={[styles.stepSubtitle, styles.locationSubtitle]}>{stepSubtitles[4]}</Text>
              <Text style={styles.locationBody}>
                FuelRadar zeigt dir Tankstellen in deiner Nähe und die günstigsten Preise auf der Karte.
              </Text>
            </View>
          )}

          {/* Step 5 — Ready ────────────────────────────────────────── */}
          {step === 5 && (
            <View style={styles.readyWrap}>
              <View style={styles.readyIconWrap}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.accentGreen} />
              </View>
              <Text style={styles.readyTitle}>{stepTitles[5]}</Text>
              <Text style={styles.readySubtitle}>{stepSubtitles[5]}</Text>
            </View>
          )}

        </ScrollView>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <View style={styles.footer}>

          {/* Location step: custom buttons */}
          {isLocationStep && (
            <>
              <TouchableOpacity
                style={[styles.continueBtn, locationLoading && styles.continueBtnDisabled]}
                onPress={handleLocationAllow}
                activeOpacity={0.85}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Ionicons name="location" size={20} color="#000" />
                    <Text style={styles.continueBtnText}>{t('locationAllow')}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipStepBtn} onPress={handleLocationDeny} disabled={locationLoading}>
                <Text style={styles.skipStepText}>{t('locationNotNow')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* All other steps: standard continue button */}
          {!isLocationStep && (
            <>
              <TouchableOpacity
                style={[styles.continueBtn, !canContinue() && styles.continueBtnDisabled]}
                onPress={handleNext}
                activeOpacity={canContinue() ? 0.85 : 1}
                disabled={!canContinue()}
              >
                <Text style={[styles.continueBtnText, !canContinue() && styles.continueBtnTextDisabled]}>
                  {isReadyStep ? t('finish') : t('continue')}
                </Text>
                {canContinue() && (
                  <Ionicons
                    name={isReadyStep ? 'checkmark' : 'arrow-forward'}
                    size={20}
                    color={canContinue() ? '#000' : COLORS.textMuted}
                  />
                )}
              </TouchableOpacity>

              {showSkipStep && (
                <TouchableOpacity style={styles.skipStepBtn} onPress={handleSkipStep}>
                  <Text style={styles.skipStepText}>{t('skip_for_now')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

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

  // Skip all
  skipAllBtn: { alignSelf: 'flex-end', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  skipAllText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  scrollContentCentered: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },

  // Step header (steps 1–3)
  header: { paddingTop: 4, paddingBottom: SPACING.lg },
  stepTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  stepSubtitle: { fontSize: 15, color: COLORS.textSecondary },

  // Welcome step
  welcomeWrap: { alignItems: 'center', paddingVertical: SPACING.xl },
  logoShadow: {
    borderRadius: 30,
    shadowColor: COLORS.accentGreen,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    marginBottom: SPACING.xl,
  },
  logoClip: { width: 150, height: 150, borderRadius: 30, overflow: 'hidden' },
  logoImg: { width: 150, height: 150 },
  welcomeTitle: { fontSize: 34, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -1, marginBottom: SPACING.sm },
  welcomeSubtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },

  // Location step
  locationWrap: { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.lg },
  locationIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accentGreen + '18',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  locationSubtitle: { textAlign: 'center', marginBottom: SPACING.md },
  locationBody: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 20, paddingHorizontal: SPACING.md,
  },

  // Ready step
  readyWrap: { alignItems: 'center' },
  readyIconWrap: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: COLORS.accentGreen + '18',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.accentGreen,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  readyTitle: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: SPACING.sm },
  readySubtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },

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
  listItemDisabled: { opacity: 0.45 },
  listItemLabelDisabled: { color: COLORS.textMuted },
  comingSoonPill: {
    backgroundColor: COLORS.accentAmber + '22',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm,
  },

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
