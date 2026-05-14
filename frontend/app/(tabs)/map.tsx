import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { fuelApi } from '../../src/services/api';
import { Station, FuelType } from '../../src/types';
import MapRenderer from '../../src/components/MapRenderer';
import { LocationPermissionModal } from '../../src/components/LocationPermissionModal';

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
    location, setLocation,
    locationPermissionStatus, setLocationPermissionStatus,
    stations, setStations,
    selectedFuelType, setSelectedFuelType,
    isLoading, setIsLoading,
    searchRadius, setSearchRadius,
    isFavorite, addFavorite, removeFavorite,
  } = useStore();

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationPermanentlyDenied, setLocationPermanentlyDenied] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<any>(null);
  // Use refs for searchRadius / location inside async callbacks to avoid stale closures
  const searchRadiusRef = useRef(searchRadius);
  const locationRef = useRef(location);
  useEffect(() => { searchRadiusRef.current = searchRadius; }, [searchRadius]);
  useEffect(() => { locationRef.current = location; }, [location]);

  const cheapestPrice = useMemo(() => {
    const open = stations.filter(s => s.is_open && s[selectedFuelType] != null);
    if (open.length === 0) return null;
    return Math.min(...open.map(s => s[selectedFuelType] as number));
  }, [stations, selectedFuelType]);

  const fetchStations = useCallback(async (lat: number, lng: number, rad: number) => {
    setIsLoading(true);
    try {
      const response = await fuelApi.getNearbyStations(lat, lng, rad, 'all', 'dist');
      if (response.ok && response.stations) setStations(response.stations);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLocationAndStations = useCallback(async (granted: boolean) => {
    const rad = searchRadiusRef.current;
    const cached = locationRef.current;

    // Show cached location on map immediately while GPS loads
    if (cached) {
      const c = { lat: cached.latitude, lng: cached.longitude };
      setMapCenter(c);
      fetchStations(c.lat, c.lng, rad);
    }

    if (granted) {
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(c);
        setLocation({ latitude: c.lat, longitude: c.lng });
        fetchStations(c.lat, c.lng, rad);
        setLocationDenied(false);
        // Animate map to real GPS position
        flyTo(c, 13);
        return;
      } catch {}
    }

    setLocationDenied(!granted);
    if (!cached) {
      setLocation({ latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng });
      fetchStations(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, rad);
    }
  }, [fetchStations]);

  const handleLocationAllow = async () => {
    setShowLocationModal(false);
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      await setLocationPermissionStatus('granted');
      setLocationPermanentlyDenied(false);
      await loadLocationAndStations(true);
    } else {
      const permStatus = canAskAgain ? 'denied' : 'permanently_denied';
      await setLocationPermissionStatus(permStatus);
      setLocationPermanentlyDenied(!canAskAgain);
      await loadLocationAndStations(false);
    }
  };

  const handleLocationDeny = async () => {
    setShowLocationModal(false);
    await setLocationPermissionStatus('denied');
    await loadLocationAndStations(false);
  };

  useEffect(() => {
    (async () => {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

      if (status === 'granted') {
        // OS says granted — load GPS
        await loadLocationAndStations(true);
        return;
      }

      // OS revoked a previously granted permission → reset stored state
      if (locationPermissionStatus === 'granted') {
        await setLocationPermissionStatus('unknown');
      }

      if (locationPermissionStatus === 'denied') {
        // User already said "Nicht jetzt" before — use cached/default, no modal
        await loadLocationAndStations(false);
        return;
      }

      if (locationPermissionStatus === 'permanently_denied' || !canAskAgain) {
        setLocationPermanentlyDenied(true);
        setShowLocationModal(true);
        return;
      }

      // 'unknown' — first time, show our modal
      setShowLocationModal(true);
    })();
  }, []);

  const flyTo = (center: { lat: number; lng: number }, zoom?: number) => {
    if (!mapRef.current) return;
    if (Platform.OS === 'web') {
      mapRef.current.flyTo?.([center.lat, center.lng], zoom ?? 13);
    } else {
      mapRef.current.animateToRegion?.({
        latitude: center.lat, longitude: center.lng,
        latitudeDelta: 0.05, longitudeDelta: 0.05,
      }, 1000);
    }
  };

  const handleLocateMe = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      setShowLocationModal(true);
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMapCenter(c);
      setLocation({ latitude: c.lat, longitude: c.lng });
      flyTo(c, 14);
      fetchStations(c.lat, c.lng, searchRadiusRef.current);
      setLocationDenied(false);
    } catch (e) {
      console.warn('[Location] Could not get current position:', e);
    }
  }, [fetchStations]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const result = await fuelApi.geocode(q);
      if (result.ok && result.results.length > 0) {
        const r = result.results[0];
        const newCenter = { lat: r.lat, lng: r.lng };
        setMapCenter(newCenter);
        setLocation({ latitude: r.lat, longitude: r.lng });
        fetchStations(r.lat, r.lng, searchRadius);
        flyTo(newCenter);
      }
    } catch (e) { console.error('Search error:', e); }
    finally { setIsSearching(false); }
  }, [searchQuery, searchRadius]);

  const handleRadiusChange = (r: number) => {
    setSearchRadius(r);
    setSelectedStation(null);
    fetchStations(mapCenter.lat, mapCenter.lng, r);
  };

  const handleSelectStation = useCallback((station: Station) => {
    setSelectedStation(station);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    flyTo({ lat: station.lat, lng: station.lng }, 14);
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
        station_id: station.id, station_name: station.name,
        station_brand: station.brand, lat: station.lat, lng: station.lng,
      });
    }
  };

  const fmt = (p: number | null) => (!p ? '\u2014' : p.toFixed(2).replace('.', ',') + ' \u20AC');
  const fmtDist = (d: number) => d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1).replace('.', ',')} km`;

  const sheetTranslateY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const openCount = stations.filter(s => s.is_open).length;

  return (
    <View style={styles.container}>
      <LocationPermissionModal
        visible={showLocationModal}
        permanentlyDenied={locationPermanentlyDenied}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />

      {/* Map */}
      <MapRenderer
        center={mapCenter}
        userLocation={location ? { lat: location.latitude, lng: location.longitude } : null}
        stations={stations}
        selectedFuelType={selectedFuelType}
        cheapestPrice={cheapestPrice}
        selectedStation={selectedStation}
        onSelectStation={handleSelectStation}
        mapRef={mapRef}
      />

      {/* Top Overlay */}
      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.searchBar}>
          <View style={styles.searchInputWrap}>
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
        </View>

        {locationDenied && (
          <TouchableOpacity
            style={styles.deniedBanner}
            onPress={() => {
              if (locationPermanentlyDenied) {
                Linking.openSettings();
              } else {
                setShowLocationModal(true);
              }
            }}
          >
            <Ionicons name="location-outline" size={13} color="#F59E0B" />
            <Text style={styles.deniedText}>
              {locationPermanentlyDenied
                ? 'Standort gesperrt · Einstellungen öffnen'
                : 'Kein Standort – Berlin Standard · Tippen zum Aktivieren'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Fuel pills */}
        <View style={styles.pillRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
            {FUEL_OPTIONS.map(({ type, label }) => (
              <TouchableOpacity key={type} testID={`map-fuel-${type}`} style={[styles.pill, selectedFuelType === type && styles.pillActive]} onPress={() => setSelectedFuelType(type)}>
                <Text style={[styles.pillText, selectedFuelType === type && styles.pillTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Radius pills */}
        <View style={styles.pillRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity key={r} testID={`map-radius-${r}`} style={[styles.pill, searchRadius === r && styles.pillActive]} onPress={() => handleRadiusChange(r)}>
                <Text style={[styles.pillText, searchRadius === r && styles.pillTextActive]}>{r} km</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color="#22C55E" />
            <Text style={styles.loadingText}>Lade Tankstellen...</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Bottom Sheet */}
      {selectedStation && (
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <TouchableOpacity style={styles.sheetHandle} onPress={handleCloseSheet} activeOpacity={0.7}>
            <View style={styles.handleBar} />
          </TouchableOpacity>

          <View style={styles.sheetHeader}>
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetBrand}>{selectedStation.brand}</Text>
              <Text style={styles.sheetName} numberOfLines={1}>{selectedStation.name}</Text>
              <Text style={styles.sheetAddr} numberOfLines={1}>
                {selectedStation.street} {selectedStation.house_number}, {selectedStation.place}
              </Text>
            </View>
            <View style={styles.sheetMeta}>
              <View style={[styles.statusBadge, selectedStation.is_open ? styles.openBg : styles.closedBg]}>
                <Text style={[styles.statusText, { color: selectedStation.is_open ? '#22C55E' : '#EF4444' }]}>
                  {selectedStation.is_open ? 'Ge\u00F6ffnet' : 'Geschlossen'}
                </Text>
              </View>
              <View style={styles.distRow}>
                <Ionicons name="location" size={14} color="#FF453A" />
                <Text style={styles.distText}>{fmtDist(selectedStation.dist)} entfernt</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceRow}>
            {(['diesel', 'e5', 'e10'] as FuelType[]).map((ft) => {
              const active = selectedFuelType === ft;
              return (
                <TouchableOpacity key={ft} testID={`sheet-price-${ft}`} style={[styles.priceCard, active && styles.priceCardActive]} onPress={() => setSelectedFuelType(ft)} activeOpacity={0.7}>
                  <Text style={[styles.priceLabel, active && styles.priceLabelActive]}>
                    {ft === 'diesel' ? 'DIESEL' : ft === 'e5' ? 'SUPER E5' : 'SUPER E10'}
                  </Text>
                  <Text style={[styles.priceValue, active && styles.priceValueActive]}>
                    {fmt(selectedStation[ft])}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity testID="sheet-navigate-btn" style={styles.navBtn} onPress={() => handleNavigate(selectedStation)} activeOpacity={0.8}>
              <Ionicons name="navigate" size={18} color="#0A0A0B" />
              <Text style={styles.navBtnText}>Navigation</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="sheet-detail-btn" style={styles.detailBtn} onPress={() => router.push(`/station/${selectedStation.id}`)} activeOpacity={0.8}>
              <Ionicons name="information-circle-outline" size={18} color="#22C55E" />
              <Text style={styles.detailBtnText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="sheet-fav-btn" style={[styles.favBtn, isFavorite(selectedStation.id) && styles.favBtnActive]} onPress={() => handleFavoriteToggle(selectedStation)} activeOpacity={0.7}>
              <Ionicons name={isFavorite(selectedStation.id) ? 'heart' : 'heart-outline'} size={22} color={isFavorite(selectedStation.id) ? '#EF4444' : COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Locate me FAB */}
      <TouchableOpacity
        testID="map-locate-me-btn"
        style={styles.locateMeBtn}
        onPress={handleLocateMe}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>

      {/* Station count */}
      {!selectedStation && openCount > 0 && !isLoading && (
        <View style={styles.countBadge}>
          <Ionicons name="location" size={14} color="#22C55E" />
          <Text style={styles.countText}>{openCount} Tankstellen</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0B' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: SPACING.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,22,26,0.92)', borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, marginLeft: SPACING.sm, fontSize: 15, color: COLORS.textPrimary },
pillRow: { marginTop: SPACING.sm },
  pillScroll: { gap: SPACING.xs },
  pill: {
    paddingHorizontal: 18, paddingVertical: SPACING.sm, borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(20,22,26,0.85)', borderWidth: 1, borderColor: COLORS.border,
  },
  pillActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  pillText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  pillTextActive: { color: '#0A0A0B' },
  loadingBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    backgroundColor: 'rgba(20,22,26,0.92)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  loadingText: { fontSize: 13, color: COLORS.textSecondary, marginLeft: SPACING.sm },
  sheet: {
    position: 'absolute', bottom: 80, left: 0, right: 0,
    backgroundColor: '#14161A', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg,
    borderTopWidth: 1, borderColor: COLORS.border, ...SHADOWS.elevated, zIndex: 20,
  },
  sheetHandle: { alignItems: 'center', paddingVertical: 10 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3A3F47' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  sheetInfo: { flex: 1, marginRight: SPACING.md },
  sheetBrand: { fontSize: 13, fontWeight: '700', color: '#22C55E', textTransform: 'uppercase', letterSpacing: 0.5 },
  sheetName: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  sheetAddr: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  sheetMeta: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.md, marginBottom: 6 },
  openBg: { backgroundColor: 'rgba(34,197,94,0.15)' },
  closedBg: { backgroundColor: 'rgba(239,68,68,0.15)' },
  statusText: { fontSize: 12, fontWeight: '700' },
  distRow: { flexDirection: 'row', alignItems: 'center' },
  distText: { fontSize: 13, color: COLORS.textSecondary, marginLeft: 4 },
  priceRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  priceCard: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.lg,
    backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#2A2F38',
  },
  priceCardActive: { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: '#22C55E' },
  priceLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  priceLabelActive: { color: '#22C55E' },
  priceValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  priceValueActive: { color: '#22C55E' },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E', paddingVertical: 12, borderRadius: RADIUS.xl,
  },
  navBtnText: { fontSize: 15, fontWeight: '700', color: '#0A0A0B', marginLeft: SPACING.sm },
  detailBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1C1C1E', paddingVertical: 12, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: '#22C55E',
  },
  detailBtnText: { fontSize: 15, fontWeight: '700', color: '#22C55E', marginLeft: SPACING.sm },
  favBtn: {
    width: 48, height: 48, borderRadius: RADIUS.xl, backgroundColor: '#1C1C1E',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2F38',
  },
  favBtnActive: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  locateMeBtn: {
    position: 'absolute', bottom: 160, right: SPACING.md,
    width: 48, height: 48, borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(20,22,26,0.92)', borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', zIndex: 15, ...SHADOWS.elevated,
  },
  countBadge: {
    position: 'absolute', bottom: 96, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,22,26,0.92)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, zIndex: 15,
  },
  countText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginLeft: 6 },
  deniedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
    marginTop: SPACING.xs,
  },
  deniedText: { fontSize: 12, color: '#F59E0B', flex: 1 },
});
