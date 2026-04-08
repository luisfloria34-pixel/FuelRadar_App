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
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { fuelApi } from '../../src/services/api';
import { Station, FuelType } from '../../src/types';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnVlbHJhZGFyLTIwMjYiLCJhIjoiY21ucHR0d3IwZDNGMDA4ODJxc2Y1bnJtejFxbiJ9.gGr8WYRsqT0g8-D4J9nEdA';
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
  const [mapReady, setMapReady] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const mapContainerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const getCheapestPrice = useCallback(() => {
    const openStations = stations.filter(s => s.is_open && s[selectedFuelType] != null);
    if (openStations.length === 0) return null;
    return Math.min(...openStations.map(s => s[selectedFuelType] as number));
  }, [stations, selectedFuelType]);

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
        } else if (location) {
          const center = { lat: location.latitude, lng: location.longitude };
          setMapCenter(center);
          fetchStations(center.lat, center.lng, searchRadius);
        } else {
          setLocation({ latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng });
          fetchStations(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, searchRadius);
        }
      } catch {
        if (location) {
          fetchStations(location.latitude, location.longitude, searchRadius);
        } else {
          setLocation({ latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng });
          fetchStations(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, searchRadius);
        }
      }
    };
    init();
  }, []);

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

  const handleRadiusChange = (r: number) => {
    setSearchRadius(r);
    setSelectedStation(null);
    fetchStations(mapCenter.lat, mapCenter.lng, r);
  };

  const handleFuelChange = (f: FuelType) => {
    setSelectedFuelType(f);
  };

  const handleSelectStation = useCallback((station: Station) => {
    setSelectedStation(station);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [station.lng, station.lat], zoom: 14, duration: 800 });
    }
  }, []);

  const handleCloseSheet = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setSelectedStation(null);
    });
  };

  const handleNavigate = (station: Station) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${station.name}@${station.lat},${station.lng}`,
      android: `geo:0,0?q=${station.lat},${station.lng}(${station.name})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`,
    });
    Linking.openURL(url as string);
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

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return price.toFixed(2).replace('.', ',') + ' \u20AC';
  };

  const formatDistance = (dist: number) => {
    if (dist < 1) return `${Math.round(dist * 1000)} m`;
    return `${dist.toFixed(1).replace('.', ',')} km`;
  };

  const cheapestPrice = getCheapestPrice();

  // ─── Web: Load Mapbox GL JS via CDN ───
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let map: any = null;

    const loadMapboxGL = () => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).mapboxgl) {
          resolve();
          return;
        }

        // Add CSS
        if (!document.getElementById('mapbox-css')) {
          const link = document.createElement('link');
          link.id = 'mapbox-css';
          link.rel = 'stylesheet';
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.3/mapbox-gl.css';
          document.head.appendChild(link);
        }

        // Add JS
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.9.3/mapbox-gl.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Mapbox GL JS'));
        document.head.appendChild(script);
      });
    };

    const initMap = async () => {
      try {
        await loadMapboxGL();
        const mapboxgl = (window as any).mapboxgl;
        if (!mapboxgl) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Get the DOM node by nativeID
        const container = document.getElementById('mapbox-map-container');
        if (!container) {
          console.error('Map container not found');
          return;
        }

        // Ensure container has proper dimensions for Mapbox
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';

        map = new mapboxgl.Map({
          container,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [mapCenter.lng, mapCenter.lat],
          zoom: 12,
          attributionControl: false,
          pitchWithRotate: false,
        });

        mapRef.current = map;

        map.on('load', () => {
          setMapReady(true);
        });

        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'bottom-right'
        );

        // Close bottom sheet when clicking on empty map area
        map.on('click', (e: any) => {
          // Only close if clicking on the map itself, not a marker
          if (e.originalEvent?.target?.closest?.('.fuel-marker')) return;
          handleCloseSheet();
        });
      } catch (e) {
        console.error('Map init error:', e);
      }
    };

    const timer = setTimeout(initMap, 300);
    return () => {
      clearTimeout(timer);
      if (map) map.remove();
    };
  }, []);

  // ─── Update markers when stations/fuel/selection changes ───
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapRef.current) return;
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Compute cheapest price directly inside effect
    const openWithPrice = stations.filter(s => s.is_open && s[selectedFuelType] != null);
    const cheapest = openWithPrice.length > 0
      ? Math.min(...openWithPrice.map(s => s[selectedFuelType] as number))
      : null;

    stations.forEach((station) => {
      const price = station[selectedFuelType];
      if (price == null || !station.is_open) return;

      const isCheapest = price === cheapest;
      const isSelected = selectedStation?.id === station.id;

      const el = document.createElement('div');
      el.className = 'fuel-marker';
      el.style.cursor = 'pointer';
      el.style.zIndex = isSelected ? '20' : isCheapest ? '10' : '1';
      el.style.filter = isSelected ? 'drop-shadow(0 0 12px rgba(34,197,94,0.6))' : 'none';

      const priceText = price.toFixed(2).replace('.', ',') + ' \u20AC';

      // Marker pill colors
      let bg: string, textColor: string, borderStyle: string, shadowStyle: string;
      if (isSelected) {
        bg = '#FFFFFF';
        textColor = '#0A0A0B';
        borderStyle = '2px solid #22C55E';
        shadowStyle = '0 4px 20px rgba(34,197,94,0.5)';
      } else if (isCheapest) {
        bg = '#22C55E';
        textColor = '#FFFFFF';
        borderStyle = 'none';
        shadowStyle = '0 2px 12px rgba(34,197,94,0.5)';
      } else {
        bg = '#2A2F38';
        textColor = '#FFFFFF';
        borderStyle = '1px solid #3A3F48';
        shadowStyle = '0 2px 8px rgba(0,0,0,0.4)';
      }

      const arrowColor = isSelected ? '#FFFFFF' : isCheapest ? '#22C55E' : '#2A2F38';
      const fontSize = isSelected ? '14px' : '13px';
      const padding = isSelected ? '6px 14px' : '5px 12px';

      el.innerHTML = `
        <div style="
          background: ${bg};
          color: ${textColor};
          font-size: ${fontSize};
          font-weight: 700;
          padding: ${padding};
          border-radius: 20px;
          white-space: nowrap;
          box-shadow: ${shadowStyle};
          border: ${borderStyle};
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', sans-serif;
          letter-spacing: 0.3px;
        ">${priceText}</div>
        <div style="
          width: 0; height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 7px solid ${arrowColor};
          margin: -1px auto 0 auto;
        "></div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectStation(station);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom', offset: [0, 0] })
        .setLngLat([station.lng, station.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [stations, selectedFuelType, selectedStation, handleSelectStation, mapReady]);

  // ─── Update map center when mapCenter changes ───
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
          style={styles.mapContainer}
          testID="mapbox-container"
          nativeID="mapbox-map-container"
        />
      ) : (
        <View style={[styles.mapContainer, styles.nativeMapFallback]}>
          <Ionicons name="map" size={48} color={COLORS.textMuted} />
          <Text style={styles.nativeMapText}>Karte wird in der App geladen</Text>
          <Text style={styles.nativeMapSubtext}>Verwende die Expo Go App</Text>
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
          <TouchableOpacity style={styles.sheetHandle} onPress={handleCloseSheet} activeOpacity={0.7}>
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
                  {selectedStation.is_open ? 'Ge\u00F6ffnet' : 'Geschlossen'}
                </Text>
              </View>
              <View style={styles.distRow}>
                <Ionicons name="location" size={14} color="#FF453A" />
                <Text style={styles.distText}>{formatDistance(selectedStation.dist)} entfernt</Text>
              </View>
            </View>
          </View>

          {/* Prices */}
          <View style={styles.priceRow}>
            {(['diesel', 'e5', 'e10'] as FuelType[]).map((ft) => {
              const isActive = selectedFuelType === ft;
              return (
                <TouchableOpacity
                  key={ft}
                  testID={`sheet-price-${ft}`}
                  style={[styles.priceCard, isActive && styles.priceCardActive]}
                  onPress={() => setSelectedFuelType(ft)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.priceLabel, isActive && styles.priceLabelActive]}>
                    {ft === 'diesel' ? 'DIESEL' : ft === 'e5' ? 'SUPER E5' : 'SUPER E10'}
                  </Text>
                  <Text style={[styles.priceValue, isActive && styles.priceValueActive]}>
                    {formatPrice(selectedStation[ft])}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.sheetActions}>
            <TouchableOpacity
              testID="sheet-navigate-btn"
              style={styles.navigateBtn}
              onPress={() => handleNavigate(selectedStation)}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={18} color="#0A0A0B" />
              <Text style={styles.navigateBtnText}>Navigation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="sheet-detail-btn"
              style={styles.detailBtn}
              onPress={() => router.push(`/station/${selectedStation.id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle-outline" size={18} color="#22C55E" />
              <Text style={styles.detailBtnText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="sheet-fav-btn"
              style={[styles.favBtn, isFavorite(selectedStation.id) && styles.favBtnActive]}
              onPress={() => handleFavoriteToggle(selectedStation)}
              activeOpacity={0.7}
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
      {!selectedStation && stations.length > 0 && !isLoading && (
        <View style={styles.countBadge}>
          <Ionicons name="location" size={14} color="#22C55E" />
          <Text style={styles.countText}>{stations.filter(s => s.is_open).length} Tankstellen</Text>
        </View>
      )}
    </View>
  );
}

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
    gap: 12,
  },
  nativeMapText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  nativeMapSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
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
    borderWidth: 1,
    borderColor: COLORS.border,
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
    zIndex: 20,
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
    backgroundColor: 'rgba(34,197,94,0.08)',
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
  favBtnActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
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
    zIndex: 15,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
});
