import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { fuelApi } from '../../src/services/api';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, removeFavorite, selectedFuelType } = useStore();
  const { t, language } = useTranslation();
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      if (favorites.length === 0) return;
      setLoading(true);
      try {
        const ids = favorites.map((f) => f.station_id);
        const response = await fuelApi.getPrices(ids);
        if (response.ok && response.prices) {
          setPrices(response.prices);
        }
      } catch (error) {
        console.warn('[Favorites] Error fetching prices:', error instanceof Error ? error.message : error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, [favorites]);

  const handleRemoveFavorite = (stationId: string, stationName: string) => {
    Alert.alert(
      t('removeFavorite'),
      `${stationName} ${t('removeFavoriteConfirm')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => removeFavorite(stationId),
        },
      ],
    );
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '—';
    return price.toFixed(2).replace('.', ',') + ' €';
  };

  const fuelLabels: Record<string, string> = {
    diesel: t('diesel'),
    e5: t('superE5'),
    e10: t('superE10'),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title} testID="favorites-title">{t('favorites')}</Text>
          <Text style={styles.subtitle}>
            {favorites.length > 0
              ? `${favorites.length} ${t('savedStations')}`
              : t('yourFavoriteStations')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={44} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t('noFavoritesYet')}</Text>
            <Text style={styles.emptySubtitle}>{t('saveFavoritesDescription')}</Text>
            <TouchableOpacity
              testID="explore-stations-btn"
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/map')}
              activeOpacity={0.8}
            >
              <Ionicons name="compass-outline" size={20} color={COLORS.background} />
              <Text style={styles.exploreButtonText}>{t('discoverStations')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading && (
              <ActivityIndicator size="small" color={COLORS.accentGreen} style={styles.loader} />
            )}
            {favorites.map((favorite) => {
              const stationPrices = prices[favorite.station_id];
              const isOpen = stationPrices?.status === 'open';

              return (
                <TouchableOpacity
                  key={favorite.id}
                  testID={`favorite-card-${favorite.id}`}
                  style={styles.favoriteCard}
                  onPress={() => router.push(`/station/${favorite.station_id}`)}
                  activeOpacity={0.7}
                >
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.brandIcon}>
                      <Ionicons name="business" size={20} color={COLORS.accentBlue} />
                    </View>
                    <View style={styles.stationInfo}>
                      <Text style={styles.stationName} numberOfLines={1}>
                        {favorite.station_name}
                      </Text>
                      <Text style={styles.stationBrand}>{favorite.station_brand}</Text>
                    </View>
                    <TouchableOpacity
                      testID={`remove-favorite-${favorite.id}`}
                      style={styles.removeButton}
                      onPress={() => handleRemoveFavorite(favorite.station_id, favorite.station_name)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="heart" size={24} color={COLORS.accentRed} />
                    </TouchableOpacity>
                  </View>

                  {/* Prices */}
                  <View style={styles.pricesContainer}>
                    {stationPrices ? (
                      <View style={styles.priceRow}>
                        {(['diesel', 'e5', 'e10'] as const).map((fuel) => (
                          <View
                            key={fuel}
                            style={[
                              styles.priceItem,
                              selectedFuelType === fuel && styles.priceItemHighlighted,
                            ]}
                          >
                            <Text style={styles.priceLabel}>{fuelLabels[fuel]}</Text>
                            <Text
                              style={[
                                styles.priceValue,
                                selectedFuelType === fuel && styles.priceValueHighlighted,
                              ]}
                            >
                              {formatPrice(stationPrices[fuel])}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.priceRow}>
                        <Text style={styles.loadingPriceText}>{t('loadingPricesShort')}</Text>
                      </View>
                    )}
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    {stationPrices && (
                      <View style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
                        <View style={[styles.statusDot, { backgroundColor: isOpen ? COLORS.accentGreen : COLORS.accentRed }]} />
                        <Text style={[styles.statusText, isOpen ? styles.openText : styles.closedText]}>
                          {isOpen ? t('open') : t('closed')}
                        </Text>
                      </View>
                    )}
                    <View style={styles.detailsLink}>
                      <Text style={styles.detailsText}>{t('details')}</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.accentGreen} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  title: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 2 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
  loader: { marginBottom: SPACING.md },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.cardBackground,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptySubtitle: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    paddingHorizontal: SPACING.xl, lineHeight: 21, marginBottom: SPACING.lg,
  },
  exploreButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accentGreen,
    paddingVertical: SPACING.sm + 4, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.xl,
  },
  exploreButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.background, marginLeft: SPACING.sm },
  favoriteCard: {
    backgroundColor: COLORS.cardBackground, borderRadius: RADIUS.xl, padding: SPACING.lg,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  brandIcon: {
    width: 44, height: 44, borderRadius: RADIUS.lg, backgroundColor: COLORS.accentBlue + '15',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  stationInfo: { flex: 1 },
  stationName: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  stationBrand: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  removeButton: { padding: SPACING.xs },
  pricesContainer: { marginBottom: SPACING.md },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.lg, padding: SPACING.md,
  },
  priceItem: { alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.md },
  priceItemHighlighted: { backgroundColor: COLORS.accentGreen + '15' },
  priceLabel: {
    fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  priceValue: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  priceValueHighlighted: { color: COLORS.accentGreen },
  loadingPriceText: { fontSize: 13, color: COLORS.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm + 2, paddingVertical: 5, borderRadius: RADIUS.md },
  openBadge: { backgroundColor: COLORS.accentGreen + '15' },
  closedBadge: { backgroundColor: COLORS.accentRed + '15' },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 5 },
  statusText: { fontSize: 12, fontWeight: '600' },
  openText: { color: COLORS.accentGreen },
  closedText: { color: COLORS.accentRed },
  detailsLink: { flexDirection: 'row', alignItems: 'center' },
  detailsText: { fontSize: 14, color: COLORS.accentGreen, fontWeight: '600', marginRight: 2 },
});
