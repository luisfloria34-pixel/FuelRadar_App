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
  Platform,
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
import { QuickActionCard } from '../../src/components/QuickActionCard';
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
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [cheapestStation, setCheapestStation] = useState<Station | null>(null);
  const [worthTheDrive, setWorthTheDrive] = useState<Station | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'FuelRadar needs location access to find nearby stations.',
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

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    try {
      let currentLocation = location;

      if (!currentLocation) {
        currentLocation = await requestLocation();
        if (currentLocation) {
          setLocation(currentLocation);
        } else {
          // Use Berlin as default
          currentLocation = { latitude: 52.520008, longitude: 13.404954 };
          setLocation(currentLocation);
        }
      }

      const response = await fuelApi.getNearbyStations(
        currentLocation.latitude,
        currentLocation.longitude,
        10,
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
        }

        // Find "worth the drive" - cheap station that's 5-15km away
        const worthIt = sorted.find(
          (s) => s.dist >= 5 && s.dist <= 15 && s[selectedFuelType]
        );
        setWorthTheDrive(worthIt || null);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      Alert.alert('Error', 'Failed to fetch stations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [location, selectedFuelType]);

  useEffect(() => {
    fetchStations();
  }, []);

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

  const nearbyStations = stations.slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accentGreen}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.title}>Find Best Prices</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="person-circle-outline" size={32} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/map')}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <Text style={styles.searchText}>Search for a station...</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionCard
            icon="flash"
            title="Cheapest"
            subtitle="Near you"
            color={COLORS.accentGreen}
            onPress={() => {
              if (cheapestStation) {
                router.push(`/station/${cheapestStation.id}`);
              }
            }}
          />
          <QuickActionCard
            icon="map"
            title="Live Map"
            subtitle="Explore"
            color={COLORS.accentBlue}
            onPress={() => router.push('/(tabs)/map')}
          />
          <QuickActionCard
            icon="notifications"
            title="Alerts"
            subtitle="Set up"
            color={COLORS.accentOrange}
            onPress={() => router.push('/(tabs)/alerts')}
          />
        </View>

        {/* Fuel Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Type</Text>
          <FuelSelector />
        </View>

        {/* Cheapest Station Card */}
        {cheapestStation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best Price Now</Text>
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => router.push(`/station/${cheapestStation.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.featuredBadge}>
                <Ionicons name="trophy" size={14} color={COLORS.accentGreen} />
                <Text style={styles.featuredBadgeText}>Cheapest</Text>
              </View>
              <View style={styles.featuredContent}>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredBrand}>{cheapestStation.brand}</Text>
                  <Text style={styles.featuredAddress}>
                    {cheapestStation.street} {cheapestStation.house_number}
                  </Text>
                  <Text style={styles.featuredDistance}>
                    {cheapestStation.dist < 1
                      ? `${Math.round(cheapestStation.dist * 1000)} m`
                      : `${cheapestStation.dist.toFixed(1)} km`}
                  </Text>
                </View>
                <View style={styles.featuredPrice}>
                  <Text style={styles.featuredPriceValue}>
                    {cheapestStation[selectedFuelType]?.toFixed(3) || 'N/A'}
                  </Text>
                  <Text style={styles.featuredPriceUnit}>€/L</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Worth the Drive */}
        {worthTheDrive && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Worth the Drive</Text>
            <TouchableOpacity
              style={styles.worthCard}
              onPress={() => router.push(`/station/${worthTheDrive.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.worthIcon}>
                <Ionicons name="car" size={24} color={COLORS.accentBlue} />
              </View>
              <View style={styles.worthContent}>
                <Text style={styles.worthBrand}>{worthTheDrive.brand}</Text>
                <Text style={styles.worthSavings}>
                  Save more at {worthTheDrive.dist.toFixed(1)} km away
                </Text>
              </View>
              <View style={styles.worthPrice}>
                <Text style={styles.worthPriceValue}>
                  {worthTheDrive[selectedFuelType]?.toFixed(3)}
                </Text>
                <Text style={styles.worthPriceUnit}>€</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Nearby Stations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Stations</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.accentGreen} style={styles.loader} />
          ) : (
            nearbyStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onPress={() => router.push(`/station/${station.id}`)}
              />
            ))
          )}
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
    padding: SPACING.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    marginHorizontal: -SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.accentBlue,
    fontWeight: '500',
  },
  featuredCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accentGreen + '40',
    ...SHADOWS.medium,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentGreen + '20',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentGreen,
    marginLeft: 4,
  },
  featuredContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredInfo: {
    flex: 1,
  },
  featuredBrand: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  featuredAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  featuredDistance: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  featuredPrice: {
    alignItems: 'flex-end',
  },
  featuredPriceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accentGreen,
  },
  featuredPriceUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  worthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  worthIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentBlue + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  worthContent: {
    flex: 1,
  },
  worthBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  worthSavings: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  worthPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  worthPriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accentBlue,
  },
  worthPriceUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  loader: {
    marginVertical: SPACING.xl,
  },
});
