import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { fuelApi } from '../../src/services/api';
import { FuelSelector } from '../../src/components/FuelSelector';
import { StationCard } from '../../src/components/StationCard';
import { Station, FuelType } from '../../src/types';

const { width, height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 52.520008,
  longitude: 13.404954,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function MapScreen() {
  const router = useRouter();
  const {
    location,
    setLocation,
    stations,
    setStations,
    selectedFuelType,
    selectedStation,
    setSelectedStation,
    isLoading,
    setIsLoading,
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
          // Use Berlin as default
          setLocation({ latitude: INITIAL_REGION.latitude, longitude: INITIAL_REGION.longitude });
          fetchStations(INITIAL_REGION.latitude, INITIAL_REGION.longitude);
        }
      } catch (error) {
        console.error('Location error:', error);
        setLocation({ latitude: INITIAL_REGION.latitude, longitude: INITIAL_REGION.longitude });
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

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return price.toFixed(3);
  };

  const sortedStations = getSortedStations();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Stations</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Fuel Type</Text>
          <FuelSelector />
          
          <Text style={[styles.filterLabel, { marginTop: SPACING.md }]}>Sort By</Text>
          <View style={styles.sortOptions}>
            <TouchableOpacity
              style={[styles.sortOption, sortBy === 'dist' && styles.sortOptionActive]}
              onPress={() => setSortBy('dist')}
            >
              <Ionicons 
                name="location" 
                size={16} 
                color={sortBy === 'dist' ? COLORS.accentGreen : COLORS.textSecondary} 
              />
              <Text style={[styles.sortOptionText, sortBy === 'dist' && styles.sortOptionTextActive]}>
                Distance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOption, sortBy === 'price' && styles.sortOptionActive]}
              onPress={() => setSortBy('price')}
            >
              <Ionicons 
                name="pricetag" 
                size={16} 
                color={sortBy === 'price' ? COLORS.accentGreen : COLORS.textSecondary} 
              />
              <Text style={[styles.sortOptionText, sortBy === 'price' && styles.sortOptionTextActive]}>
                Price
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Station Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {sortedStations.length} stations found
        </Text>
        {location && (
          <Text style={styles.locationText}>
            <Ionicons name="location" size={12} color={COLORS.accentGreen} />
            {' '}Near your location
          </Text>
        )}
      </View>

      {/* Loading */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentGreen} />
          <Text style={styles.loadingText}>Finding stations...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {sortedStations.map((station, index) => (
            <View key={station.id}>
              {/* Rank badge for price sort */}
              {sortBy === 'price' && index < 3 && (
                <View style={[
                  styles.rankBadge,
                  index === 0 && styles.rankBadgeGold,
                  index === 1 && styles.rankBadgeSilver,
                  index === 2 && styles.rankBadgeBronze,
                ]}>
                  <Ionicons 
                    name={index === 0 ? 'trophy' : 'medal'} 
                    size={12} 
                    color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} 
                  />
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
              )}
              <StationCard
                station={station}
                onPress={() => router.push(`/station/${station.id}`)}
                showAllPrices={true}
              />
            </View>
          ))}

          {sortedStations.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No stations found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or search in a different area
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPanel: {
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  },
  sortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
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
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  countText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.accentGreen,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.cardSecondary,
  },
  rankBadgeGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  rankBadgeSilver: {
    backgroundColor: 'rgba(192, 192, 192, 0.15)',
  },
  rankBadgeBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.15)',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
});
