import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { fuelApi } from '../../src/services/api';
import { FuelSegmentedControl } from '../../src/components/FuelSegmentedControl';
import { PremiumStationCard } from '../../src/components/PremiumStationCard';
import { Station } from '../../src/types';

const INITIAL_REGION = {
  latitude: 52.520008,
  longitude: 13.404954,
};

export default function MapScreen() {
  const router = useRouter();
  const {
    location,
    setLocation,
    stations,
    setStations,
    selectedFuelType,
    isLoading,
    setIsLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
  } = useStore();

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'dist' | 'price'>('dist');

  const fetchStations = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await fuelApi.getNearbyStations(lat, lng, 15, 'all', sortBy);
      if (response.ok && response.stations) {
        setStations(response.stations);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const newLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setLocation(newLocation);
          fetchStations(newLocation.latitude, newLocation.longitude);
        } else {
          setLocation(INITIAL_REGION);
          fetchStations(INITIAL_REGION.latitude, INITIAL_REGION.longitude);
        }
      } catch (error) {
        console.error('Location error:', error);
        setLocation(INITIAL_REGION);
        fetchStations(INITIAL_REGION.latitude, INITIAL_REGION.longitude);
      }
    };
    initLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchStations(location.latitude, location.longitude);
    }
  }, [sortBy]);

  const getSortedStations = () => {
    if (sortBy === 'price') {
      return [...stations]
        .filter((s) => s.is_open && s[selectedFuelType] !== null)
        .sort((a, b) => {
          const priceA = a[selectedFuelType] ?? 999;
          const priceB = b[selectedFuelType] ?? 999;
          return priceA - priceB;
        });
    }
    return stations;
  };

  const handleFavoriteToggle = async (station: Station) => {
    if (isFavorite(station.id)) {
      await removeFavorite(station.id);
    } else {
      await addFavorite({
        station_id: station.id,
        station_name: station.name,
        station_brand: station.brand,
        lat: station.lat,
        lng: station.lng,
      });
    }
  };

  const sortedStations = getSortedStations();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title} testID="map-title">Tankstellen</Text>
          <Text style={styles.subtitle}>in deiner Nähe</Text>
        </View>
        <TouchableOpacity
          testID="filter-toggle-btn"
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={20} color={showFilters ? COLORS.background : COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Kraftstoffart</Text>
          <FuelSegmentedControl />

          <Text style={[styles.filterLabel, { marginTop: SPACING.lg }]}>Sortierung</Text>
          <View style={styles.sortOptions}>
            <TouchableOpacity
              testID="sort-distance-btn"
              style={[styles.sortOption, sortBy === 'dist' && styles.sortOptionActive]}
              onPress={() => setSortBy('dist')}
            >
              <Ionicons
                name="location"
                size={16}
                color={sortBy === 'dist' ? COLORS.accentGreen : COLORS.textSecondary}
              />
              <Text style={[styles.sortOptionText, sortBy === 'dist' && styles.sortOptionTextActive]}>
                Entfernung
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="sort-price-btn"
              style={[styles.sortOption, sortBy === 'price' && styles.sortOptionActive]}
              onPress={() => setSortBy('price')}
            >
              <Ionicons
                name="pricetag"
                size={16}
                color={sortBy === 'price' ? COLORS.accentGreen : COLORS.textSecondary}
              />
              <Text style={[styles.sortOptionText, sortBy === 'price' && styles.sortOptionTextActive]}>
                Preis
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Station Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText} testID="station-count">
          {sortedStations.length} Tankstellen gefunden
        </Text>
        {location && (
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={12} color={COLORS.accentGreen} />
            <Text style={styles.locationText}>In deiner Nähe</Text>
          </View>
        )}
      </View>

      {/* Loading */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentGreen} />
          <Text style={styles.loadingText}>Suche Tankstellen...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {sortedStations.map((station, index) => (
            <View key={station.id}>
              {/* Ranking Badge */}
              {sortBy === 'price' && index < 3 && (
                <View style={[
                  styles.rankBadge,
                  index === 0 && styles.rankGold,
                  index === 1 && styles.rankSilver,
                  index === 2 && styles.rankBronze,
                ]}>
                  <Ionicons
                    name={index === 0 ? 'trophy' : 'medal'}
                    size={13}
                    color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                  />
                  <Text style={styles.rankText}>
                    {index === 0 ? 'Günstigster Preis' : index === 1 ? '2. Platz' : '3. Platz'}
                  </Text>
                </View>
              )}
              <PremiumStationCard
                station={station}
                onPress={() => router.push(`/station/${station.id}`)}
                onFavoritePress={() => handleFavoriteToggle(station)}
                isFavorite={isFavorite(station.id)}
              />
            </View>
          ))}

          {sortedStations.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search" size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Keine Tankstellen gefunden</Text>
              <Text style={styles.emptySubtitle}>
                Passe die Filter an oder suche in einer anderen Umgebung.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  filterPanel: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortOptionActive: {
    backgroundColor: COLORS.accentGreen + '20',
    borderColor: COLORS.accentGreen,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  sortOptionTextActive: {
    color: COLORS.accentGreen,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  countText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: COLORS.accentGreen,
    marginLeft: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  rankGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  rankSilver: {
    backgroundColor: 'rgba(192, 192, 192, 0.15)',
  },
  rankBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.15)',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 20,
  },
});
