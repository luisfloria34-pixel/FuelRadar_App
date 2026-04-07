import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { FuelType } from '../types';
import { useStore } from '../store/useStore';

const fuelOptions: { type: FuelType; label: string; color: string }[] = [
  { type: 'diesel', label: 'Diesel', color: COLORS.diesel },
  { type: 'e5', label: 'E5', color: COLORS.e5 },
  { type: 'e10', label: 'E10', color: COLORS.e10 },
];

export const FuelSelector: React.FC = () => {
  const { selectedFuelType, setSelectedFuelType } = useStore();

  return (
    <View style={styles.container}>
      {fuelOptions.map((option) => (
        <TouchableOpacity
          key={option.type}
          style={[
            styles.option,
            selectedFuelType === option.type && {
              backgroundColor: option.color + '20',
              borderColor: option.color,
            },
          ]}
          onPress={() => setSelectedFuelType(option.type)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.label,
              selectedFuelType === option.type && { color: option.color },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
  },
  option: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
