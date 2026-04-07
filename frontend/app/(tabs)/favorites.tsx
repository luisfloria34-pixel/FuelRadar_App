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
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { fuelApi } from '../../src/services/api';
import { Favorite } from '../../src/types';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, removeFavorite, selectedFuelType } = useStore();
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
        console.error('Error fetching prices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [favorites]);

  const handleRemoveFavorite = (stationId: string, stationName: string) => {
    Alert.alert(
      'Remove Favorite',
      `Remove ${stationName} from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFavorite(stationId),
        },
      ]
    );
  };

  const getPrice = (stationId: string) => {
    const stationPrices = prices[stationId];
    if (!stationPrices) return null;
    return stationPrices[selectedFuelType];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        {favorites.length > 0 && (
          <Text style={styles.count}>{favorites.length} stations</Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySubtitle}>
              Save your preferred stations for quick access to their current prices.
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/map')}
            >
              <Ionicons name="map-outline" size={20} color={COLORS.background} />
              <Text style={styles.exploreButtonText}>Explore Stations</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading && (
              <ActivityIndicator
                size="small"
                color={COLORS.accentGreen}
                style={styles.loader}
              />
            )}
            {favorites.map((favorite) => (
              <TouchableOpacity
                key={favorite.id}
                style={styles.favoriteCard}
                onPress={() => router.push(`/station/${favorite.station_id}`)}
                activeOpacity={0.7}
              >
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
                    style={styles.removeButton}
                    onPress={() => handleRemoveFavorite(favorite.station_id, favorite.station_name)}
                  >
                    <Ionicons name="heart" size={24} color={COLORS.accentRed} />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardContent}>
                  {prices[favorite.station_id] ? (
                    <View style={styles.priceRow}>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>Diesel</Text>
                        <Text style={styles.priceValue}>
                          {prices[favorite.station_id].diesel?.toFixed(3) || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>E5</Text>
                        <Text style={styles.priceValue}>
                          {prices[favorite.station_id].e5?.toFixed(3) || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>E10</Text>
                        <Text style={styles.priceValue}>
                          {prices[favorite.station_id].e10?.toFixed(3) || 'N/A'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.priceRow}>
                      <Text style={styles.loadingText}>Loading prices...</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  {prices[favorite.station_id] && (
                    <View
                      style={[
                        styles.statusBadge,
                        prices[favorite.station_id].status === 'open'
                          ? styles.openBadge
                          : styles.closedBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          prices[favorite.station_id].status === 'open'
                            ? styles.openText
                            : styles.closedText,
                        ]}
                      >
                        {prices[favorite.station_id].status === 'open' ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.viewDetails}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.accentBlue} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  count: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  loader: {
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentBlue,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
    marginLeft: SPACING.xs,
  },
  favoriteCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stationBrand: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  cardContent: {
    marginBottom: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  openBadge: {
    backgroundColor: 'rgba(50, 215, 75, 0.15)',
  },
  closedBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
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
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    color: COLORS.accentBlue,
    fontWeight: '500',
  },
});
