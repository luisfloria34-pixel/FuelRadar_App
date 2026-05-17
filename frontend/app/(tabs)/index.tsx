import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { fuelApi } from '../../src/services/api';
import { FuelSegmentedControl } from '../../src/components/FuelSegmentedControl';
import { PremiumStationCard } from '../../src/components/PremiumStationCard';
import { PLZSearchBar } from '../../src/components/PLZSearchBar';
import { RecommendationCard } from '../../src/components/RecommendationCard';
import { LocationPermissionModal } from '../../src/components/LocationPermissionModal';
import { Station } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const {
    location,
    setLocation,
    locationPermissionStatus,
    setLocationPermissionStatus,
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
  // useTranslation ensures re-render when language changes (t ref changes)
  const { t, language } = useTranslation();

  const h = new Date().getHours();
  const greeting = h >= 5 && h < 12
    ? t('goodMorning')
    : h < 18
      ? t('goodAfternoon')
      : t('goodEvening');

  const [refreshing, setRefreshing] = useState(false);
  const [cheapestStation, setCheapestStation] = useState<Station | null>(null);
  const [avgPrice, setAvgPrice] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationPermanentlyDenied, setLocationPermanentlyDenied] = useState(false);
  const locationResolveRef = useRef<((loc: { latitude: number; longitude: number } | null) => void) | null>(null);

  const getGPS = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch {
      return null;
    }
  };

  // Reconcile stored permission state with actual OS state each app launch
  const resolvePermissionStatus = useCallback(async () => {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') return 'granted' as const;
    if (!canAskAgain) return 'permanently_denied' as const;
    // If we stored 'granted' but OS says otherwise → user revoked in settings
    if (locationPermissionStatus === 'granted') return 'unknown' as const;
    return locationPermissionStatus;
  }, [locationPermissionStatus]);

  const requestLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    const resolved = await resolvePermissionStatus();

    if (resolved === 'granted') {
      const gps = await getGPS();
      if (gps) setLocation(gps);
      return gps;
    }

    if (resolved === 'denied') {
      setLocationDenied(true);
      return null;
    }

    const isPermanent = resolved === 'permanently_denied';
    setLocationPermanentlyDenied(isPermanent);
    return new Promise((resolve) => {
      locationResolveRef.current = resolve;
      setShowLocationModal(true);
    });
  };

  const handleLocationAllow = async () => {
    setShowLocationModal(false);
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      await setLocationPermissionStatus('granted');
      setLocationDenied(false);
      setLocationPermanentlyDenied(false);
      const gps = await getGPS();
      if (gps) setLocation(gps);
      locationResolveRef.current?.(gps);
      // Navigate to map so user sees their location immediately
      router.push('/(tabs)/map');
    } else {
      const permStatus = canAskAgain ? 'denied' : 'permanently_denied';
      await setLocationPermissionStatus(permStatus);
      setLocationPermanentlyDenied(!canAskAgain);
      setLocationDenied(true);
      locationResolveRef.current?.(null);
    }
  };

  const handleLocationDeny = async () => {
    setShowLocationModal(false);
    await setLocationPermissionStatus('denied');
    setLocationDenied(true);
    locationResolveRef.current?.(null);
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const fetchStations = useCallback(async (lat?: number, lng?: number, rad?: number) => {
    setIsLoading(true);
    try {
      // Berlin — used as display fallback only, never stored as "user location"
      const FALLBACK_LAT = 52.520008;
      const FALLBACK_LNG = 13.404954;

      let useLat: number;
      let useLng: number;

      if (lat !== undefined && lng !== undefined) {
        // Explicit PLZ/city search result
        useLat = lat;
        useLng = lng;
        setLocation({ latitude: lat, longitude: lng });
      } else if (location) {
        useLat = location.latitude;
        useLng = location.longitude;
      } else {
        // No location stored — request GPS permission
        try {
          const loc = await requestLocation();
          if (loc) {
            useLat = loc.latitude;
            useLng = loc.longitude;
            // setLocation is called inside requestLocation → handleLocationAllow
          } else {
            // Denied or GPS failed — use fallback for API only, do NOT store as user location
            useLat = FALLBACK_LAT;
            useLng = FALLBACK_LNG;
          }
        } catch {
          useLat = FALLBACK_LAT;
          useLng = FALLBACK_LNG;
        }
      }

      const radius = rad || searchRadius;
      const response = await fuelApi.getNearbyStations(
        useLat,
        useLng,
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
          const prices = sorted.map(s => s[selectedFuelType]).filter(p => p !== null) as number[];
          if (prices.length > 1) {
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            setAvgPrice(avg);
          }
        }
      }
    } catch (error) {
      // warn instead of error — avoids the red Expo dev overlay for network issues
      console.warn('[fetchStations]', error instanceof Error ? error.message : error);
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
      <LocationPermissionModal
        visible={showLocationModal}
        permanentlyDenied={locationPermanentlyDenied}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />

      {locationDenied && (
        <TouchableOpacity style={styles.deniedBanner} onPress={() => Linking.openSettings()}>
          <Ionicons name="location-outline" size={14} color="#F59E0B" />
          <Text style={styles.deniedText}>{t('locationDeniedBannerText')}</Text>
          <TouchableOpacity onPress={() => { setLocationDenied(false); fetchStations(); }}>
            <Ionicons name="refresh" size={14} color="#F59E0B" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

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
            <View style={styles.greetingContent}>
              <Ionicons name="car-sport-outline" size={16} color={COLORS.accentGreen} style={styles.greetingIcon} />
              <Text style={styles.greeting} testID="home-greeting">{greeting}</Text>
            </View>
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
              ? `${t('stationsIn')}\n${searchLocationName}`
              : t('homeTagline')}
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

        {/* Recommendation Card */}
        {cheapestStation && avgPrice > 0 && (
          <View style={styles.section}>
            <RecommendationCard
              cheapestStation={cheapestStation}
              averagePrice={avgPrice}
              onPress={() => router.push(`/station/${cheapestStation.id}`)}
            />
          </View>
        )}

        {/* Section Separator */}
        <View style={styles.sectionSeparator}>
          <View style={styles.separatorLine} />
        </View>

        {/* Nearby Stations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('cheapestNearYou')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.seeAllText}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>{t('searchingStations')}</Text>
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
          <Text style={styles.legalText}>{t('legalDisclaimer')}</Text>
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
  greetingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingIcon: {
    marginRight: 6,
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
    marginBottom: SPACING.xl,
  },
  sectionSeparator: {
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  separatorLine: {
    height: 1,
    backgroundColor: COLORS.border,
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
  deniedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  deniedText: {
    flex: 1,
    fontSize: 12,
    color: '#F59E0B',
  },
});
