import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Linking,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { fuelApi } from '../../src/services/api';
import { Station, FuelType } from '../../src/types';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnVlbHJhZGFyLTIwMjYiLCJhIjoiY21ucHR0d3IwZDNGMDA4ODJxc2Y1bnJtejFxbiJ9.gGr8WYRsqT0g8-D4J9nEdA';
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';
const RADIUS_OPTIONS = [2, 5, 10, 25];
const FUEL_OPTIONS: { type: FuelType; label: string }[] = [
  { type: 'diesel', label: 'Diesel' },
  { type: 'e5', label: 'E5' },
  { type: 'e10', label: 'E10' },
];

const DEFAULT_CENTER = { lat: 52.520008, lng: 13.404954 };

export default function MapScreen() {
  const router = useRouter();
  const {
    location,
    setLocation,
    stations,
    setStations,
    selectedFuelType,
    setSelectedFuelType,
    isLoading,
    setIsLoading,
    searchRadius,
    setSearchRadius,
    isFavorite,
    addFavorite,
    removeFavorite,
  } = useStore();

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const mapContainerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Find cheapest station price
  const getCheapestPrice = useCallback(() => {
    const openStations = stations.filter(s => s.is_open && s[selectedFuelType] != null);
    if (openStations.length === 0) return null;
    return Math.min(...openStations.map(s => s[selectedFuelType] as number));
  }, [stations, selectedFuelType]);

  // Fetch stations
  const fetchStations = useCallback(async (lat: number, lng: number, rad: number) => {
    setIsLoading(true);
    try {
      const response = await fuelApi.getNearbyStations(lat, lng, rad, 'all', 'dist');
      if (response.ok && response.stations) {
        setStations(response.stations);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Init location
  useEffect(() => {
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const center = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setMapCenter(center);
          setLocation({ latitude: center.lat, longitude: center.lng });
          fetchStations(center.lat, center.lng, searchRadius);
        } else {
          setLocation({ latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng });
          fetchStations(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, searchRadius);
        }
      } catch {
        setLocation({ latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng });
        fetchStations(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, searchRadius);
      }
    };
    init();
  }, []);

  // PLZ Search
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const result = await fuelApi.geocode(q);
      if (result.ok && result.results.length > 0) {
        const r = result.results[0];
        setMapCenter({ lat: r.lat, lng: r.lng });
        setLocation({ latitude: r.lat, longitude: r.lng });
        fetchStations(r.lat, r.lng, searchRadius);
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [r.lng, r.lat], zoom: 13, duration: 1500 });
        }
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchRadius]);

  // Radius change
  const handleRadiusChange = (r: number) => {
    setSearchRadius(r);
    fetchStations(mapCenter.lat, mapCenter.lng, r);
  };

  // Fuel type change
  const handleFuelChange = (f: FuelType) => {
    setSelectedFuelType(f);
  };

  // Select station
  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [station.lng, station.lat], zoom: 14, duration: 800 });
    }
  };

  // Close bottom sheet
  const handleCloseSheet = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setSelectedStation(null);
    });
  };

  // Navigate to station
  const handleNavigate = (station: Station) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${station.name}@${station.lat},${station.lng}`,
      android: `geo:0,0?q=${station.lat},${station.lng}(${station.name})`,
      default: `https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`,
    });
    Linking.openURL(url as string);
  };

  // Toggle favorite
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

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return price.toFixed(2).replace('.', ',') + ' €';
  };

  const formatDistance = (dist: number) => {
    if (dist < 1) return `${Math.round(dist * 1000)} m`;
    return `${dist.toFixed(1).replace('.', ',')} km`;
  };

  const cheapestPrice = getCheapestPrice();

  // Initialize mapbox-gl on web via CDN
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let map: any = null;

    const loadMapbox = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).maplibregl) {
          resolve();
          return;
        }

        // Add CSS
        if (!document.getElementById('mapbox-css')) {
          const link = document.createElement('link');
          link.id = 'mapbox-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
          document.head.appendChild(link);
        }

        // Add JS (MapLibre = open-source fork, identical API)
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    const initMap = async () => {
      try {
        await loadMapbox();
        const maplibregl = (window as any).maplibregl;
        if (!maplibregl) return;

        const container = mapContainerRef.current;
        if (!container) return;

        map = new maplibregl.Map({
          container,
          style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
          center: [mapCenter.lng, mapCenter.lat],
          zoom: 12,
          attributionControl: false,
        });

        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      } catch (e) {
        console.error('Map init error:', e);
      }
    };

    const timer = setTimeout(initMap, 200);
    return () => {
      clearTimeout(timer);
      if (map) map.remove();
    };
  }, []);

  // Update markers when stations/fuel changes
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapRef.current) return;
    const maplibregl = (window as any).maplibregl;
    if (!maplibregl) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const price = station[selectedFuelType];
      if (!price || !station.is_open) return;

      const isCheapest = price === cheapestPrice;
      const isSelected = selectedStation?.id === station.id;

      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.style.zIndex = isSelected ? '10' : isCheapest ? '5' : '1';

      const bg = isSelected ? '#FFFFFF' : isCheapest ? '#22C55E' : '#1C1C1E';
      const textColor = isSelected ? '#1C1C1E' : isCheapest ? '#FFFFFF' : '#FFFFFF';
      const shadow = isSelected ? '0 4px 16px rgba(0,0,0,0.5)' : isCheapest ? '0 2px 8px rgba(34,197,94,0.4)' : '0 1px 4px rgba(0,0,0,0.3)';
      const priceText = price.toFixed(2).replace('.', ',') + ' €';
      const fontSize = isSelected ? '14px' : '12px';
      const padding = isSelected ? '6px 14px' : '5px 10px';

      el.innerHTML = `
        <div style="
          background: ${bg};
          color: ${textColor};
          font-size: ${fontSize};
          font-weight: 700;
          padding: ${padding};
          border-radius: 20px;
          white-space: nowrap;
          box-shadow: ${shadow};
          border: ${isSelected ? '2px solid #22C55E' : 'none'};
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">${priceText}</div>
        <div style="
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${bg};
          margin: 0 auto;
        "></div>
      `;

      el.addEventListener('click', () => handleSelectStation(station));

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([station.lng, station.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [stations, selectedFuelType, cheapestPrice, selectedStation]);

  // Update map center when mapCenter changes
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapRef.current) return;
    mapRef.current.flyTo({ center: [mapCenter.lng, mapCenter.lat], zoom: 12, duration: 1500 });
  }, [mapCenter]);

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={styles.container}>
      {/* Map Container */}
      {Platform.OS === 'web' ? (
        <View
          ref={mapContainerRef}
          style={styles.mapContainer}
          testID="mapbox-container"
        />
      ) : (
        <View style={[styles.mapContainer, styles.nativeMapFallback]}>
          <Text style={styles.nativeMapText}>Karte lädt auf dem Gerät...</Text>
        </View>
      )}

      {/* Top Overlay */}
      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              testID="map-search-input"
              style={styles.searchInput}
              placeholder="PLZ oder Ort eingeben"
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            testID="map-search-btn"
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={COLORS.textPrimary} />
            ) : (
              <Ionicons name="options" size={20} color={COLORS.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Fuel Selector */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FUEL_OPTIONS.map(({ type, label }) => (
              <TouchableOpacity
                key={type}
                testID={`map-fuel-${type}`}
                style={[styles.filterPill, selectedFuelType === type && styles.filterPillActive]}
                onPress={() => handleFuelChange(type)}
              >
                <Text style={[styles.filterPillText, selectedFuelType === type && styles.filterPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Radius Selector */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                testID={`map-radius-${r}`}
                style={[styles.filterPill, searchRadius === r && styles.filterPillActive]}
                onPress={() => handleRadiusChange(r)}
              >
                <Text style={[styles.filterPillText, searchRadius === r && styles.filterPillTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color="#22C55E" />
            <Text style={styles.loadingText}>Lade Tankstellen...</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Bottom Sheet */}
      {selectedStation && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <TouchableOpacity style={styles.sheetHandle} onPress={handleCloseSheet}>
            <View style={styles.handleBar} />
          </TouchableOpacity>

          {/* Station Info */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetBrand}>{selectedStation.brand}</Text>
              <Text style={styles.sheetName} numberOfLines={1}>{selectedStation.name}</Text>
              <Text style={styles.sheetAddress} numberOfLines={1}>
                {selectedStation.street} {selectedStation.house_number}, {selectedStation.place}
              </Text>
            </View>
            <View style={styles.sheetMeta}>
              <View style={[styles.statusBadge, selectedStation.is_open ? styles.openBadge : styles.closedBadge]}>
                <Text style={[styles.statusText, selectedStation.is_open ? styles.openText : styles.closedText]}>
                  {selectedStation.is_open ? 'Geöffnet' : 'Geschlossen'}
                </Text>
              </View>
              <View style={styles.distRow}>
                <Ionicons name="navigate" size={14} color="#22C55E" />
                <Text style={styles.distText}>{formatDistance(selectedStation.dist)} entfernt</Text>
              </View>
            </View>
          </View>

          {/* Prices */}
          <View style={styles.priceRow}>
            {(['diesel', 'e5', 'e10'] as FuelType[]).map((ft) => {
              const isActive = selectedFuelType === ft;
              return (
                <View key={ft} style={[styles.priceCard, isActive && styles.priceCardActive]}>
                  <Text style={[styles.priceLabel, isActive && styles.priceLabelActive]}>
                    {ft === 'diesel' ? 'DIESEL' : ft === 'e5' ? 'SUPER E5' : 'SUPER E10'}
                  </Text>
                  <Text style={[styles.priceValue, isActive && styles.priceValueActive]}>
                    {formatPrice(selectedStation[ft])}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.sheetActions}>
            <TouchableOpacity
              testID="sheet-navigate-btn"
              style={styles.navigateBtn}
              onPress={() => handleNavigate(selectedStation)}
            >
              <Ionicons name="navigate" size={18} color="#0A0A0B" />
              <Text style={styles.navigateBtnText}>Navigation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="sheet-detail-btn"
              style={styles.detailBtn}
              onPress={() => router.push(`/station/${selectedStation.id}`)}
            >
              <Ionicons name="information-circle-outline" size={18} color="#22C55E" />
              <Text style={styles.detailBtnText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="sheet-fav-btn"
              style={styles.favBtn}
              onPress={() => handleFavoriteToggle(selectedStation)}
            >
              <Ionicons
                name={isFavorite(selectedStation.id) ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite(selectedStation.id) ? '#EF4444' : COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Station count badge */}
      {!selectedStation && stations.length > 0 && (
        <View style={styles.countBadge}>
          <Ionicons name="location" size={14} color="#22C55E" />
          <Text style={styles.countText}>{stations.filter(s => s.is_open).length} Tankstellen</Text>
        </View>
      )}
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  nativeMapFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeMapText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,22,26,0.92)',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm + 4 : SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(20,22,26,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterRow: {
    marginTop: SPACING.sm,
  },
  filterScroll: {
    gap: SPACING.xs,
  },
  filterPill: {
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(20,22,26,0.85)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  filterPillTextActive: {
    color: '#0A0A0B',
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(20,22,26,0.92)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: '#14161A',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.elevated,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3F47',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sheetInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  sheetBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22C55E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sheetName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  sheetAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sheetMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    marginBottom: 6,
  },
  openBadge: { backgroundColor: 'rgba(34,197,94,0.15)' },
  closedBadge: { backgroundColor: 'rgba(239,68,68,0.15)' },
  statusText: { fontSize: 12, fontWeight: '700' },
  openText: { color: '#22C55E' },
  closedText: { color: '#EF4444' },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  priceCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2A2F38',
  },
  priceCardActive: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: '#22C55E',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceLabelActive: {
    color: '#22C55E',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  priceValueActive: {
    color: '#22C55E',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.xl,
  },
  navigateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0A0B',
    marginLeft: SPACING.sm,
  },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  detailBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#22C55E',
    marginLeft: SPACING.sm,
  },
  favBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2F38',
  },
  countBadge: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,22,26,0.92)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
});
