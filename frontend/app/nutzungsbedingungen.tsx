import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';

export default function NutzungsbedingungenScreen() {
  const router = useRouter();
  const { language } = useStore();

  const content = language === 'de' ? {
    title: 'Nutzungsbedingungen',
    sections: [
      {
        title: '1. Zweck der App',
        text: 'FuelRadar dient ausschließlich der Information von Verbrauchern über Kraftstoffpreise in Deutschland.',
      },
      {
        title: '2. Datenquelle',
        text: 'Die angezeigten Daten stammen von:\nTankerkönig / Markttransparenzstelle für Kraftstoffe (MTS-K)',
      },
      {
        title: '3. Haftungsausschluss',
        text: 'Alle Preise sind ohne Gewähr.\nPreise können sich jederzeit an der Tankstelle ändern.',
      },
      {
        title: '4. Nutzung',
        text: 'Die Nutzung erfolgt auf eigene Verantwortung.\nEine kommerzielle Weiterverwendung der Daten ist nicht gestattet.',
      },
      {
        title: '5. Verfügbarkeit',
        text: 'Wir garantieren keine permanente Verfügbarkeit oder Fehlerfreiheit der App.',
      },
      {
        title: '6. Änderungen',
        text: 'Die App und ihre Funktionen können jederzeit geändert werden.',
      },
    ],
    disclaimer: 'Kraftstoffpreisdaten Deutschland: Tankerkönig / MTS-K (CC BY 4.0).\nPreise können sich an der Tankstelle ändern. Keine Gewähr für Richtigkeit.',
  } : {
    title: 'Terms of Use',
    sections: [
      {
        title: '1. Purpose',
        text: 'FuelRadar provides fuel price information for consumers in Germany.',
      },
      {
        title: '2. Data Source',
        text: 'Fuel price data is provided by:\nTankerkönig / Market Transparency Unit for Fuels (MTS-K)',
      },
      {
        title: '3. Disclaimer',
        text: 'All prices are without guarantee.\nPrices may change at the station at any time.',
      },
      {
        title: '4. Usage',
        text: 'Use is at your own risk.\nCommercial reuse of data is not allowed.',
      },
      {
        title: '5. Availability',
        text: 'We do not guarantee uninterrupted or error-free operation.',
      },
      {
        title: '6. Changes',
        text: 'The app and its features may change at any time.',
      },
    ],
    disclaimer: 'Fuel price data Germany: Tankerkönig / MTS-K (CC BY 4.0).\nPrices may change at the station. No guarantee of accuracy.',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {content.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.text}</Text>
          </View>
        ))}

        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.accentBlue} />
          <Text style={styles.disclaimerText}>{content.disclaimer}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FuelRadar © 2025</Text>
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
  headerTitle: {
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentBlue + '15',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accentBlue + '30',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
