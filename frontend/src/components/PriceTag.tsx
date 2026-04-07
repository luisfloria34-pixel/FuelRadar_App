import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { FuelType } from '../types';

interface PriceTagProps {
  price: number | null;
  fuelType: FuelType;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const fuelLabels: Record<FuelType, string> = {
  diesel: 'Diesel',
  e5: 'Super E5',
  e10: 'Super E10',
};

const fuelColors: Record<FuelType, string> = {
  diesel: COLORS.diesel,
  e5: COLORS.e5,
  e10: COLORS.e10,
};

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  fuelType,
  size = 'medium',
  showLabel = true,
}) => {
  const styles = getStyles(size, fuelType);

  if (price === null) {
    return (
      <View style={styles.container}>
        {showLabel && <Text style={styles.label}>{fuelLabels[fuelType]}</Text>}
        <Text style={styles.unavailable}>N/A</Text>
      </View>
    );
  }

  const [euros, cents] = price.toFixed(3).split('.');
  const mainCents = cents.slice(0, 2);
  const lastDigit = cents.slice(2);

  return (
    <View style={styles.container}>
      {showLabel && <Text style={styles.label}>{fuelLabels[fuelType]}</Text>}
      <View style={styles.priceRow}>
        <Text style={styles.euro}>{euros}</Text>
        <Text style={styles.comma}>,</Text>
        <Text style={styles.cents}>{mainCents}</Text>
        <Text style={styles.superscript}>{lastDigit}</Text>
        <Text style={styles.currency}>€</Text>
      </View>
    </View>
  );
};

const getStyles = (size: 'small' | 'medium' | 'large', fuelType: FuelType) => {
  const color = fuelColors[fuelType];
  
  const sizes = {
    small: { euro: 18, cents: 16, super: 10, label: 10 },
    medium: { euro: 28, cents: 24, super: 14, label: 12 },
    large: { euro: 42, cents: 36, super: 18, label: 14 },
  };

  const s = sizes[size];

  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    label: {
      fontSize: s.label,
      color: COLORS.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    euro: {
      fontSize: s.euro,
      fontWeight: '700',
      color: COLORS.textPrimary,
    },
    comma: {
      fontSize: s.euro,
      fontWeight: '700',
      color: COLORS.textPrimary,
    },
    cents: {
      fontSize: s.cents,
      fontWeight: '700',
      color: COLORS.textPrimary,
    },
    superscript: {
      fontSize: s.super,
      fontWeight: '600',
      color: color,
      marginTop: 2,
    },
    currency: {
      fontSize: s.super,
      fontWeight: '400',
      color: COLORS.textSecondary,
      marginLeft: 2,
      marginTop: 2,
    },
    unavailable: {
      fontSize: s.euro,
      fontWeight: '500',
      color: COLORS.textMuted,
    },
  });
};
