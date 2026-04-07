import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { fuelApi } from '../../src/services/api';
import { StationDetail, FuelType } from '../../src/types';
import { PriceTag } from '../../src/components/PriceTag';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite, addAlert } = useStore();
  
  const [station, setStation] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const favorite = station ? isFavorite(station.id) : false;

  useEffect(() => {
    const fetchStation = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await fuelApi.getStationDetail(id);
        if (response.ok && response.station) {
          setStation(response.station);
        } else {
          setError('Station not found');
        }
      } catch (err) {
        console.error('Error fetching station:', err);
        setError('Failed to load station details');
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!station) return;
    
    if (favorite) {
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

  const handleNavigate = () => {
    if (!station) return;
    
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${station.lat},${station.lng}`;
    const label = station.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
    });
    
    Linking.openURL(url as string);
  };

  const handleCreateAlert = (fuelType: FuelType, price: number) => {
    if (!station) return;
    
    Alert.alert(
      'Create Price Alert',
      `Get notified when ${fuelType.toUpperCase()} drops below ${price.toFixed(3)}€ at ${station.brand}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Alert',
          onPress: async () => {
            await addAlert({
              station_id: station.id,
              station_name: station.name,
              fuel_type: fuelType,
              threshold_price: price,
              is_active: true,
            });
            Alert.alert('Success', 'Price alert created!');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentGreen} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !station) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.accentRed} />
          <Text style={styles.errorText}>{error || 'Station not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={favorite ? COLORS.accentRed : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.brandIconLarge}>
            <Ionicons name="business" size={40} color={COLORS.accentBlue} />
          </View>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={styles.stationBrand}>{station.brand}</Text>
          
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.address}>
              {station.street} {station.house_number}, {station.post_code} {station.place}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                station.is_open ? styles.openBadge : styles.closedBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: station.is_open ? COLORS.accentGreen : COLORS.accentRed },
                ]}
              />
              <Text
                style={[styles.statusText, station.is_open ? styles.openText : styles.closedText]}
              >
                {station.is_open ? 'Open Now' : 'Closed'}
              </Text>
            </View>
            {station.whole_day && (
              <View style={styles.wholeDayBadge}>
                <Text style={styles.wholeDayText}>24h</Text>
              </View>
            )}
          </View>
        </View>

        {/* Price Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Prices</Text>
          <View style={styles.priceCards}>
            <TouchableOpacity
              style={styles.priceCard}
              onPress={() => station.diesel && handleCreateAlert('diesel', station.diesel)}
              activeOpacity={0.8}
            >
              <PriceTag price={station.diesel} fuelType="diesel" size="large" />
              <View style={styles.alertHint}>
                <Ionicons name="notifications-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.alertHintText}>Tap to set alert</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.priceCard}
              onPress={() => station.e5 && handleCreateAlert('e5', station.e5)}
              activeOpacity={0.8}
            >
              <PriceTag price={station.e5} fuelType="e5" size="large" />
              <View style={styles.alertHint}>
                <Ionicons name="notifications-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.alertHintText}>Tap to set alert</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.priceCard}
              onPress={() => station.e10 && handleCreateAlert('e10', station.e10)}
              activeOpacity={0.8}
            >
              <PriceTag price={station.e10} fuelType="e10" size="large" />
              <View style={styles.alertHint}>
                <Ionicons name="notifications-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.alertHintText}>Tap to set alert</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Opening Hours */}
        {station.opening_times && station.opening_times.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            <View style={styles.hoursCard}>
              {station.opening_times.map((time, index) => (
                <View key={index} style={styles.hourRow}>
                  <Text style={styles.hourDay}>{time.text}</Text>
                  <Text style={styles.hourTime}>
                    {time.start} - {time.end}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="pin" size={20} color={COLORS.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {station.lat.toFixed(6)}, {station.lng.toFixed(6)}
                </Text>
              </View>
            </View>
            {station.state && (
              <View style={styles.infoRow}>
                <Ionicons name="flag" size={20} color={COLORS.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>State</Text>
                  <Text style={styles.infoValue}>{station.state}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
          <Ionicons name="navigate" size={20} color={COLORS.background} />
          <Text style={styles.navigateText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  brandIconLarge: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stationName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  stationBrand: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  address: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  openBadge: {
    backgroundColor: 'rgba(50, 215, 75, 0.15)',
  },
  closedBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openText: {
    color: COLORS.accentGreen,
  },
  closedText: {
    color: COLORS.accentRed,
  },
  wholeDayBadge: {
    backgroundColor: COLORS.accentBlue + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  wholeDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentBlue,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  priceCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  alertHintText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  hoursCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hourDay: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  hourTime: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentGreen,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  navigateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
    marginLeft: SPACING.sm,
  },
});
