import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';
import { FuelType } from '../src/types';
import { Language } from '../src/constants/translations';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    selectedFuelType,
    setSelectedFuelType,
    searchRadius,
    setSearchRadius,
    setHasSeenOnboarding,
    language,
    setLanguage,
    t,
  } = useStore();

  const fuelOptions: { type: FuelType; label: string; color: string }[] = [
    { type: 'diesel', label: 'Diesel', color: COLORS.diesel },
    { type: 'e5', label: 'Super E5', color: COLORS.e5 },
    { type: 'e10', label: 'Super E10', color: COLORS.e10 },
  ];

  const radiusOptions = [5, 10, 15, 25];

  const handleResetOnboarding = async () => {
    await setHasSeenOnboarding(false);
    Alert.alert('Erfolg', 'Das Onboarding wird beim nächsten Start erneut angezeigt.');
  };

  const handleLanguageChange = async (lang: Language) => {
    if (lang === language) return;
    await setLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="settings-back-btn"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Einstellungen</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPRACHE</Text>
          <View style={styles.card}>
            <View style={styles.languageRow}>
              <TouchableOpacity
                testID="lang-de-btn"
                style={[styles.langOption, language === 'de' && styles.langOptionActive]}
                onPress={() => handleLanguageChange('de')}
              >
                <Text style={styles.langFlag}>🇩🇪</Text>
                <Text style={[styles.langText, language === 'de' && styles.langTextActive]}>Deutsch</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="lang-en-btn"
                style={[styles.langOption, language === 'en' && styles.langOptionActive]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text style={styles.langFlag}>🇬🇧</Text>
                <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Fuel Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KRAFTSTOFF</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Bevorzugter Kraftstoff</Text>
            <View style={styles.optionsRow}>
              {fuelOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  testID={`fuel-pref-${option.type}`}
                  style={[
                    styles.fuelOption,
                    selectedFuelType === option.type && {
                      backgroundColor: option.color + '20',
                      borderColor: option.color,
                    },
                  ]}
                  onPress={() => setSelectedFuelType(option.type)}
                >
                  <Text style={[
                    styles.fuelOptionText,
                    selectedFuelType === option.type && { color: option.color },
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Search Radius */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUCHRADIUS</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Umkreis für die Tankstellensuche</Text>
            <View style={styles.optionsRow}>
              {radiusOptions.map((radius) => (
                <TouchableOpacity
                  key={radius}
                  testID={`radius-${radius}`}
                  style={[
                    styles.radiusOption,
                    searchRadius === radius && styles.radiusOptionActive,
                  ]}
                  onPress={() => setSearchRadius(radius)}
                >
                  <Text style={[
                    styles.radiusText,
                    searchRadius === radius && styles.radiusTextActive,
                  ]}>
                    {radius} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALLGEMEIN</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="flag"
              title="Land"
              subtitle="Deutschland"
            />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECHTLICHES</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="document-text"
              title="Nutzungsbedingungen"
              onPress={() => router.push('/nutzungsbedingungen')}
              showChevron
            />
            <SettingRow
              icon="shield-checkmark"
              title="Datenschutzerklärung"
              onPress={() => router.push('/datenschutz')}
              showChevron
            />
            <SettingRow
              icon="code"
              title="Datenquelle"
              subtitle="Tankerkönig / MTS-K (CC BY 4.0)"
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ÜBER DIE APP</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="information-circle"
              title="Version"
              subtitle="1.0.0"
            />
            <SettingRow
              icon="refresh"
              title="Onboarding zurücksetzen"
              subtitle="Begrüßung erneut anzeigen"
              onPress={handleResetOnboarding}
              showChevron
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.logoCircle}>
            <Ionicons name="location" size={24} color={COLORS.accentGreen} />
          </View>
          <Text style={styles.appName}>FuelRadar</Text>
          <Text style={styles.tagline}>Live Kraftstoffpreise in Deutschland</Text>
          <Text style={styles.copyright}>© 2026 FuelRadar</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  showChevron,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 50,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  languageRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  langOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langOptionActive: {
    backgroundColor: COLORS.accentGreen + '20',
    borderColor: COLORS.accentGreen,
  },
  langFlag: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  langText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  langTextActive: {
    color: COLORS.accentGreen,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  fuelOption: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fuelOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radiusOptionActive: {
    backgroundColor: COLORS.accentBlue + '20',
    borderColor: COLORS.accentBlue,
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  radiusTextActive: {
    color: COLORS.accentBlue,
  },
  settingsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accentGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  copyright: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});
