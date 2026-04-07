import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';

interface RecommendationCardProps {
  savings: string;
  distance: string;
  onPress: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  savings,
  distance,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="flame" size={24} color={COLORS.accentOrange} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Empfehlung für dich</Text>
          <Text style={styles.savings}>Spare {savings}</Text>
          <Text style={styles.subtitle}>Beste Tankstelle {distance} entfernt</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Anzeigen</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.accentOrange + '30',
    ...SHADOWS.card,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentOrange + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accentOrange,
    marginBottom: 4,
  },
  savings: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.background,
    marginRight: 4,
  },
});
