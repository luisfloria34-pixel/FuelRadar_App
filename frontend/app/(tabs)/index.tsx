import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
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
import { PLZSearchBar } from '../../src/components/PLZSearchBar';
import { RecommendationCard } from '../../src/components/RecommendationCard';
import { Station } from '../../src/types';

export default function HomeScreen() {
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
    initializeApp,
    searchRadius,
    searchLocationName,
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const [cheapestStation, setCheapestStation] = useState<Station | null>(null);
  const [savings, setSavings] = useState<string>('0,08 €/L');

  useEffect(() => {
    initializeApp();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Standort benötigt',
          'FuelRadar benötigt deinen Standort, um Tankstellen in deiner Nähe zu finden.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } catch (error) {
      console.error('Location error:', error);
      return null;
    }
  };

  const fetchStations = useCallback(async (lat?: number, lng?: number, rad?: number) => {
    setIsLoading(true);
    try {
      let currentLocation = location;

      if (lat && lng) {
        currentLocation = { latitude: lat, longitude: lng };
        setLocation(currentLocation);
      } else if (!currentLocation) {
        currentLocation = await requestLocation();
        if (currentLocation) {
          setLocation(currentLocation);
        } else {
          currentLocation = { latitude: 52.520008, longitude: 13.404954 };
          setLocation(currentLocation);
        }
      }

      const radius = rad || searchRadius;
      const response = await fuelApi.getNearbyStations(
        currentLocation.latitude,
        currentLocation.longitude,
        radius,
        'all',
        'dist'
      );

      if (response.ok && response.stations) {
        setStations(response.stations);

        // Find cheapest station
        const openStations = response.stations.filter((s) => s.is_open);
        const sorted = [...openStations].sort((a, b) => {
          const priceA = a[selectedFuelType] ?? 999;
          const priceB = b[selectedFuelType] ?? 999;
          return priceA - priceB;
        });

        if (sorted.length > 0) {
          setCheapestStation(sorted[0]);
          
          // Calculate savings compared to average
          const prices = sorted.map(s => s[selectedFuelType]).filter(p => p !== null) as number[];
          if (prices.length > 1) {
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            const savingsAmount = avg - prices[0];
            setSavings(`${savingsAmount.toFixed(2).replace('.', ',')} €/L`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [location, selectedFuelType, searchRadius]);

  useEffect(() => {
    fetchStations();
  }, []);

  const handlePLZSearch = useCallback((lat: number, lng: number, radius: number, locationName: string) => {
    fetchStations(lat, lng, radius);
  }, [fetchStations]);

  useEffect(() => {
    if (stations.length > 0) {
      const openStations = stations.filter((s) => s.is_open);
      const sorted = [...openStations].sort((a, b) => {
        const priceA = a[selectedFuelType] ?? 999;
        const priceB = b[selectedFuelType] ?? 999;
        return priceA - priceB;
      });

      if (sorted.length > 0) {
        setCheapestStation(sorted[0]);
      }
    }
  }, [selectedFuelType, stations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStations();
    setRefreshing(false);
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

  const nearbyStations = stations.slice(0, 6);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting} testID="home-greeting">Guten Tag 👋</Text>
            <TouchableOpacity
              testID="settings-btn"
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>
            {searchLocationName
              ? `Tankstellen in\n${searchLocationName}`
              : 'Finde die günstigsten Spritpreise\nin deiner Nähe'}
          </Text>
        </View>

        {/* PLZ Search + Radius */}
        <View style={styles.section}>
          <PLZSearchBar onSearchComplete={handlePLZSearch} />
        </View>

        {/* Fuel Selector */}
        <View style={styles.section}>
          <FuelSegmentedControl />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Recommendation Card */}
        {cheapestStation && (
          <View style={styles.section}>
            <RecommendationCard
              savings={savings}
              distance={`${cheapestStation.dist.toFixed(1).replace('.', ',')} km`}
              onPress={() => router.push(`/station/${cheapestStation.id}`)}
            />
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Nearby Stations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Günstigste in deiner Nähe</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.seeAllText}>Alle</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Suche Tankstellen...</Text>
            </View>
          ) : (
            nearbyStations.map((station) => (
              <PremiumStationCard
                key={station.id}
                station={station}
                onPress={() => router.push(`/station/${station.id}`)}
                onFavoritePress={() => handleFavoriteToggle(station)}
                isFavorite={isFavorite(station.id)}
              />
            ))
          )}
        </View>

        {/* Legal Footer */}
        <View style={styles.legalFooter}>
          <Text style={styles.legalText}>
            Daten: Tankerkönig / MTS-K (CC BY 4.0){'\n'}
            Preise können sich ändern. Keine Gewähr.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  header: {
    paddingTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    lineHeight: 34,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  legalFooter: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
