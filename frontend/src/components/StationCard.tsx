import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { Station, FuelType } from '../types';
import { PriceTag } from './PriceTag';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

interface StationCardProps {
  station: Station;
  onPress: () => void;
  showAllPrices?: boolean;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  onPress,
  showAllPrices = false,
}) => {
  const { selectedFuelType, isFavorite } = useStore();
  const { t } = useTranslation();
  const favorite = isFavorite(station.id);

  const getPrice = () => {
    return station[selectedFuelType];
  };

  const formatDistance = (dist: number) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)} m`;
    }
    return `${dist.toFixed(1).replace('.', ',')} km`;
  };

  return (
    <TouchableOpacity
      testID={`station-card-${station.id}`}
      style={[styles.container, !station.is_open && styles.closed]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Ionicons name="business" size={20} color={COLORS.accentBlue} />
          </View>
          <View style={styles.brandInfo}>
            <Text style={styles.brand} numberOfLines={1}>
              {station.brand || station.name}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {station.street} {station.house_number}
            </Text>
          </View>
        </View>
        {favorite && (
          <Ionicons name="heart" size={20} color={COLORS.accentRed} />
        )}
      </View>

      <View style={styles.content}>
        {showAllPrices ? (
          <View style={styles.allPrices}>
            <PriceTag price={station.diesel} fuelType="diesel" size="small" />
            <PriceTag price={station.e5} fuelType="e5" size="small" />
            <PriceTag price={station.e10} fuelType="e10" size="small" />
          </View>
        ) : (
          <PriceTag price={getPrice()} fuelType={selectedFuelType} size="medium" showLabel={false} />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Ionicons name="location" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{formatDistance(station.dist)}</Text>
        </View>
        <View style={[styles.statusBadge, station.is_open ? styles.open : styles.closedBadge]}>
          <Text style={[styles.statusText, station.is_open ? styles.openText : styles.closedText]}>
            {station.is_open ? t('open') : t('closed')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  closed: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.accentBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  brandInfo: {
    flex: 1,
  },
  brand: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  address: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  content: {
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  allPrices: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  open: {
    backgroundColor: COLORS.accentGreen + '15',
  },
  closedBadge: {
    backgroundColor: COLORS.accentRed + '15',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  openText: {
    color: COLORS.accentGreen,
  },
  closedText: {
    color: COLORS.accentRed,
  },
});
