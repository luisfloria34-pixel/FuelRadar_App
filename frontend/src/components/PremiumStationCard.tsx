import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { Station } from '../types';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

interface PremiumStationCardProps {
  station: Station;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  rank?: number;
}

export const PremiumStationCard: React.FC<PremiumStationCardProps> = ({
  station,
  onPress,
  onFavoritePress,
  isFavorite = false,
  rank,
}) => {
  const { selectedFuelType } = useStore();
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const favAnim = useRef(new Animated.Value(1)).current;

  const price = station[selectedFuelType];

  const formatPriceParts = (p: number | null) => {
    if (!p) return null;
    const str = p.toFixed(3);
    const [euros, decimals] = str.split('.');
    return { euros, mainCents: decimals.slice(0, 2), superDigit: decimals.slice(2) };
  };

  const formatDistance = (dist: number) => {
    if (dist < 1) return `${Math.round(dist * 1000)} m`;
    return `${dist.toFixed(1).replace('.', ',')} km`;
  };

  const getFuelLabel = () => {
    if (selectedFuelType === 'diesel') return t('diesel');
    if (selectedFuelType === 'e5') return t('superE5');
    return t('superE10');
  };

  const getFuelColor = () => COLORS[selectedFuelType] || COLORS.accentGreen;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  const handleFavoritePress = () => {
    Animated.sequence([
      Animated.spring(favAnim, { toValue: 1.3, useNativeDriver: true, friction: 3 }),
      Animated.spring(favAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
    onFavoritePress?.();
  };

  const priceParts = formatPriceParts(price);
  const fuelColor = getFuelColor();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        testID={`premium-station-card-${station.id}`}
        style={[styles.container, !station.is_open && styles.closed]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Rank Badge */}
        {rank !== undefined && rank < 3 && (
          <View style={[
            styles.rankStrip,
            rank === 0 && styles.rankGold,
            rank === 1 && styles.rankSilver,
            rank === 2 && styles.rankBronze,
          ]}>
            <Ionicons
              name={rank === 0 ? 'trophy' : 'medal'}
              size={12}
              color={rank === 0 ? '#FFD700' : rank === 1 ? '#C0C0C0' : '#CD7F32'}
            />
            <Text style={styles.rankText}>
              {rank === 0 ? t('cheapest') : `${rank + 1}.`}
            </Text>
          </View>
        )}

        {/* Header: Brand + Favorite */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={[styles.fuelDot, { backgroundColor: fuelColor }]} />
            <Text style={styles.brand} numberOfLines={1}>{station.brand || station.name}</Text>
            {!station.is_open && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedText}>{t('closed')}</Text>
              </View>
            )}
          </View>
          {onFavoritePress && (
            <Animated.View style={{ transform: [{ scale: favAnim }] }}>
              <TouchableOpacity
                testID={`fav-btn-${station.id}`}
                onPress={handleFavoritePress}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFavorite ? COLORS.accentRed : COLORS.textMuted}
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          {priceParts ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceMain}>
                {priceParts.euros},{priceParts.mainCents}
              </Text>
              <Text style={[styles.priceSuper, { color: fuelColor }]}>
                {priceParts.superDigit}
              </Text>
              <Text style={styles.priceCurrency}>€</Text>
            </View>
          ) : (
            <Text style={styles.priceNA}>—</Text>
          )}
          <View style={[styles.fuelBadge, { backgroundColor: fuelColor + '18' }]}>
            <Text style={[styles.fuelBadgeText, { color: fuelColor }]}>{getFuelLabel()}</Text>
          </View>
        </View>

        {/* Meta: Distance + stable timestamp */}
        <View style={styles.metaBar}>
          <View style={styles.metaItem}>
            <Ionicons name="navigate-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.distanceText}>{formatDistance(station.dist)} {t('away')}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
            {/* Stable label — TankerKönig list API has no timestamp field */}
            <Text style={styles.timeText}>{t('updated')}</Text>
          </View>
          {station.is_open && (
            <>
              <View style={styles.metaDot} />
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{t('live')}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground, borderRadius: RADIUS.xl, padding: SPACING.lg,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  closed: { opacity: 0.5 },
  rankStrip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 2, paddingVertical: 4,
    borderRadius: RADIUS.md, marginBottom: SPACING.sm,
  },
  rankGold: { backgroundColor: 'rgba(255, 215, 0, 0.15)' },
  rankSilver: { backgroundColor: 'rgba(192, 192, 192, 0.15)' },
  rankBronze: { backgroundColor: 'rgba(205, 127, 50, 0.15)' },
  rankText: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginLeft: 5,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  fuelDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.sm },
  brand: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  closedBadge: {
    backgroundColor: COLORS.accentRed + '20', paddingHorizontal: SPACING.sm,
    paddingVertical: 3, borderRadius: RADIUS.sm, marginLeft: SPACING.sm,
  },
  closedText: { fontSize: 11, fontWeight: '700', color: COLORS.accentRed },
  priceSection: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.md },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start' },
  priceMain: { fontSize: 38, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -1.5, lineHeight: 42 },
  priceSuper: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  priceCurrency: { fontSize: 18, fontWeight: '400', color: COLORS.textSecondary, marginLeft: 3, marginTop: 4 },
  priceNA: { fontSize: 32, fontWeight: '500', color: COLORS.textMuted },
  fuelBadge: { paddingHorizontal: SPACING.sm + 4, paddingVertical: 6, borderRadius: RADIUS.md },
  fuelBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  metaBar: { flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.sm + 2, borderTopWidth: 1, borderTopColor: COLORS.border },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  distanceText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, marginLeft: 4 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.textMuted, marginHorizontal: SPACING.sm },
  timeText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accentGreen },
  liveText: { fontSize: 11, fontWeight: '700', color: COLORS.accentGreen, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
});
