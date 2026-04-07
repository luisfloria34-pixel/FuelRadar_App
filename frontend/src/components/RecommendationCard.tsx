import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { Station } from '../types';
import { useStore } from '../store/useStore';

interface RecommendationCardProps {
  cheapestStation: Station;
  averagePrice: number;
  onPress: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  cheapestStation,
  averagePrice,
  onPress,
}) => {
  const { selectedFuelType } = useStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const price = cheapestStation[selectedFuelType];
  const savings = price ? (averagePrice - price) : 0;
  const savingsPercent = averagePrice > 0 ? ((savings / averagePrice) * 100).toFixed(0) : '0';

  const formatPrice = (p: number | null) => {
    if (!p) return '—';
    return p.toFixed(2).replace('.', ',');
  };

  const formatDistance = (dist: number) => {
    if (dist < 1) return `${Math.round(dist * 1000)} m`;
    return `${dist.toFixed(1).replace('.', ',')} km`;
  };

  const fuelLabel = selectedFuelType === 'diesel' ? 'Diesel' : selectedFuelType === 'e5' ? 'Super E5' : 'Super E10';

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        testID="recommendation-card"
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Live Badge */}
        <View style={styles.liveBadge}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.liveText}>LIVE-EMPFEHLUNG</Text>
        </View>

        {/* Content */}
        <View style={styles.body}>
          <View style={styles.leftCol}>
            <Text style={styles.brandName}>{cheapestStation.brand}</Text>
            <Text style={styles.priceValue}>{formatPrice(price)} €</Text>
            <Text style={styles.fuelType}>{fuelLabel}</Text>
          </View>

          <View style={styles.rightCol}>
            <View style={styles.savingsBox}>
              <Ionicons name="trending-down" size={16} color={COLORS.accentGreen} />
              <Text style={styles.savingsValue}>
                -{savings.toFixed(2).replace('.', ',')} €/L
              </Text>
            </View>
            <Text style={styles.savingsPercent}>{savingsPercent}% günstiger</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.distRow}>
            <Ionicons name="navigate-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.distText}>{formatDistance(cheapestStation.dist)} entfernt</Text>
          </View>
          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>Anzeigen</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.accentGreen} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.accentGreen + '35',
    ...SHADOWS.elevated,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentGreen,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentGreen,
    letterSpacing: 1,
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  leftCol: {},
  brandName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -1,
    lineHeight: 38,
  },
  fuelType: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  savingsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentGreen + '18',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginBottom: 4,
  },
  savingsValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accentGreen,
    marginLeft: 4,
  },
  savingsPercent: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accentGreen,
    marginRight: 2,
  },
});
