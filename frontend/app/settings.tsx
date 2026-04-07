import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';
import { FuelType } from '../src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    selectedFuelType,
    setSelectedFuelType,
    searchRadius,
    setSearchRadius,
    setHasSeenOnboarding,
  } = useStore();

  const fuelOptions: { type: FuelType; label: string }[] = [
    { type: 'diesel', label: 'Diesel' },
    { type: 'e5', label: 'Super E5' },
    { type: 'e10', label: 'Super E10' },
  ];

  const radiusOptions = [5, 10, 15, 25];

  const handleResetOnboarding = async () => {
    await setHasSeenOnboarding(false);
    Alert.alert('Success', 'Onboarding has been reset. Restart the app to see it again.');
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color={COLORS.textSecondary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (
        onPress && <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Fuel Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Preferences</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Default Fuel Type</Text>
            <View style={styles.fuelOptions}>
              {fuelOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.fuelOption,
                    selectedFuelType === option.type && styles.fuelOptionActive,
                  ]}
                  onPress={() => setSelectedFuelType(option.type)}
                >
                  <Text
                    style={[
                      styles.fuelOptionText,
                      selectedFuelType === option.type && styles.fuelOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Search Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Settings</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Search Radius</Text>
            <View style={styles.radiusOptions}>
              {radiusOptions.map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.radiusOption,
                    searchRadius === radius && styles.radiusOptionActive,
                  ]}
                  onPress={() => setSearchRadius(radius)}
                >
                  <Text
                    style={[
                      styles.radiusOptionText,
                      searchRadius === radius && styles.radiusOptionTextActive,
                    ]}
                  >
                    {radius} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="flag"
              title="Country"
              subtitle="Germany"
            />
            <SettingItem
              icon="language"
              title="Language"
              subtitle="English"
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="information-circle"
              title="Version"
              subtitle="1.0.0"
            />
            <SettingItem
              icon="document-text"
              title="Terms of Service"
              onPress={() => Linking.openURL('https://creativecommons.tankerkoenig.de/')}
            />
            <SettingItem
              icon="shield-checkmark"
              title="Privacy Policy"
              onPress={() => Linking.openURL('https://creativecommons.tankerkoenig.de/')}
            />
            <SettingItem
              icon="code"
              title="Data Source"
              subtitle="Tankerkönig API"
              onPress={() => Linking.openURL('https://creativecommons.tankerkoenig.de/')}
            />
          </View>
        </View>

        {/* Debug */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="refresh"
              title="Reset Onboarding"
              subtitle="Show welcome screens again"
              onPress={handleResetOnboarding}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={styles.logoContainer}>
            <Ionicons name="location" size={24} color={COLORS.accentGreen} />
          </View>
          <Text style={styles.appName}>FuelRadar</Text>
          <Text style={styles.appTagline}>Live fuel prices in Germany</Text>
          <Text style={styles.copyright}>© 2025 FuelRadar</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 50,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  fuelOptions: {
    flexDirection: 'row',
  },
  fuelOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  fuelOptionActive: {
    backgroundColor: COLORS.accentGreen + '20',
    borderColor: COLORS.accentGreen,
  },
  fuelOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  fuelOptionTextActive: {
    color: COLORS.accentGreen,
  },
  radiusOptions: {
    flexDirection: 'row',
  },
  radiusOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  radiusOptionActive: {
    backgroundColor: COLORS.accentBlue + '20',
    borderColor: COLORS.accentBlue,
  },
  radiusOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  radiusOptionTextActive: {
    color: COLORS.accentBlue,
  },
  settingsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
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
    color: COLORS.textPrimary,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  logoContainer: {
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
  appTagline: {
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
