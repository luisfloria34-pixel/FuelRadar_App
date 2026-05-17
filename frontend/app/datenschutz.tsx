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
import { useTranslation } from '../src/hooks/useTranslation';

export default function DatenschutzScreen() {
  const router = useRouter();
  const { language } = useTranslation();

  const content = language === 'de' ? {
    title: 'Datenschutzerklärung',
    sections: [
      {
        title: '1. Allgemeine Informationen',
        text: 'FuelRadar ist eine mobile Anwendung zur Anzeige von Kraftstoffpreisen in Deutschland. Der Schutz Ihrer personenbezogenen Daten ist uns wichtig.',
      },
      {
        title: '2. Verantwortlicher',
        text: 'Catalin Ionut Floria\n(Einzelunternehmer / FuelRadar)',
      },
      {
        title: '3. Erhobene Daten',
        text: 'Die App kann folgende Daten verarbeiten:\n\n• Standortdaten (nur mit Zustimmung des Nutzers)\n• Gerätespezifische Informationen (z. B. Betriebssystem)\n• Lokale App-Daten (Favoriten, Einstellungen)',
      },
      {
        title: '4. Verwendung der Daten',
        text: 'Die Daten werden ausschließlich verwendet für:\n\n• Anzeige von Tankstellen in Ihrer Nähe\n• Berechnung von Entfernungen\n• Speicherung von Favoriten und Einstellungen\n\nEs erfolgt keine Weitergabe an Dritte.',
      },
      {
        title: '5. Standortdaten',
        text: 'Standortdaten werden nur verwendet, wenn der Nutzer dies erlaubt. Diese werden nicht dauerhaft gespeichert.',
      },
      {
        title: '6. Push-Benachrichtigungen',
        text: 'Die App kann Push-Benachrichtigungen senden (z. B. Preisalarme). Diese können jederzeit deaktiviert werden.',
      },
      {
        title: '7. Datenspeicherung',
        text: 'Daten werden lokal auf dem Gerät gespeichert. Es erfolgt keine zentrale Speicherung personenbezogener Daten.',
      },
      {
        title: '8. Rechte des Nutzers',
        text: 'Sie haben jederzeit das Recht auf Auskunft, Berichtigung oder Löschung Ihrer Daten.',
      },
      {
        title: '9. Kontakt',
        text: 'E-Mail: natydesigner@outlook.com',
      },
      {
        title: '10. Änderungen',
        text: 'Diese Datenschutzerklärung kann bei Bedarf aktualisiert werden.',
      },
    ],
  } : {
    title: 'Privacy Policy',
    sections: [
      {
        title: '1. General Information',
        text: 'FuelRadar is a mobile application that displays fuel prices in Germany. We take your privacy seriously.',
      },
      {
        title: '2. Data Controller',
        text: 'Catalin Ionut Floria',
      },
      {
        title: '3. Data Collected',
        text: 'The app may process:\n\n• Location data (only with user permission)\n• Device information (e.g. OS version)\n• Local app data (favorites, settings)',
      },
      {
        title: '4. Use of Data',
        text: 'Data is used only to:\n\n• Show nearby fuel stations\n• Calculate distances\n• Save preferences and favorites\n\nNo data is shared with third parties.',
      },
      {
        title: '5. Location Data',
        text: 'Location is only used when permission is granted and is not stored permanently.',
      },
      {
        title: '6. Push Notifications',
        text: 'The app may send notifications (price alerts). These can be disabled anytime.',
      },
      {
        title: '7. Data Storage',
        text: 'All data is stored locally on the user\'s device.',
      },
      {
        title: '8. User Rights',
        text: 'Users may request deletion or information at any time.',
      },
      {
        title: '9. Contact',
        text: 'Email: natydesigner@outlook.com',
      },
      {
        title: '10. Changes',
        text: 'We may update this policy when necessary.',
      },
    ],
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>FuelRadar © {new Date().getFullYear()}</Text>
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
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
