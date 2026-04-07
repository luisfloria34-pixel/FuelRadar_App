import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { Station, FuelType } from '../types';
import { useStore } from '../store/useStore';

interface PremiumStationCardProps {
  station: Station;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

export const PremiumStationCard: React.FC<PremiumStationCardProps> = ({
  station,
  onPress,
  onFavoritePress,
  isFavorite = false,
}) => {
  const { selectedFuelType } = useStore();

  const getPrice = () => {
    return station[selectedFuelType];
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return price.toFixed(2).replace('.', ',') + ' €';
  };

  const formatDistance = (dist: number) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)} m`;
    }
    return `${dist.toFixed(1).replace('.', ',')} km entfernt`;
  };

  const getTimeAgo = () => {
    // Mock - in production this would use actual update time
    const mins = Math.floor(Math.random() * 10) + 1;
    return `Vor ${mins} Min aktualisiert`;
  };

  const getFuelLabel = () => {
    switch (selectedFuelType) {
      case 'diesel': return 'Diesel';
      case 'e5': return 'Super E5';
      case 'e10': return 'Super E10';
    }
  };

  const price = getPrice();

  return (
    <TouchableOpacity
      style={[styles.container, !station.is_open && styles.closed]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.brandContainer}>
          <Text style={styles.brand}>{station.brand || station.name}</Text>
          {!station.is_open && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>Geschlossen</Text>
            </View>
          )}
        </View>
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? COLORS.accentRed : COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Price */}
      <Text style={styles.price}>{formatPrice(price)}</Text>
      
      {/* Fuel Type */}
      <Text style={styles.fuelType}>{getFuelLabel()}</Text>

      {/* Meta Info */}
      <View style={styles.metaRow}>
        <Text style={styles.distance}>{formatDistance(station.dist)}</Text>
      </View>
      <Text style={styles.updateTime}>{getTimeAgo()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  closed: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brand: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closedBadge: {
    backgroundColor: COLORS.accentRed + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  closedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentRed,
  },
  favoriteButton: {
    padding: SPACING.xs,
  },
  price: {
    ...TYPOGRAPHY.priceLarge,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  fuelType: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  updateTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
