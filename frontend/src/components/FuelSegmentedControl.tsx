import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { FuelType } from '../types';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

export const FuelSegmentedControl: React.FC = () => {
  const { selectedFuelType, setSelectedFuelType } = useStore();
  const { t } = useTranslation();

  const fuelOptions: { type: FuelType; label: string }[] = [
    { type: 'diesel', label: t('diesel') },
    { type: 'e5', label: t('superE5') },
    { type: 'e10', label: t('superE10') },
  ];

  return (
    <View style={styles.container}>
      {fuelOptions.map((option) => {
        const isSelected = selectedFuelType === option.type;
        return (
          <TouchableOpacity
            key={option.type}
            style={[styles.segment, isSelected && styles.segmentActive]}
            onPress={() => setSelectedFuelType(option.type)}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  segmentActive: { backgroundColor: COLORS.accent },
  segmentText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.background },
});
