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
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { fuelApi } from '../../src/services/api';
import { StationDetail, FuelType } from '../../src/types';

const fuelLabels: Record<FuelType, string> = {
  diesel: 'Diesel',
  e5: 'Super E5',
  e10: 'Super E10',
};

const fuelColors: Record<FuelType, string> = {
  diesel: COLORS.diesel,
  e5: COLORS.e5,
  e10: COLORS.e10,
};

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
          setError('Tankstelle nicht gefunden');
        }
      } catch (err) {
        console.error('Error fetching station:', err);
        setError('Details konnten nicht geladen werden');
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
      'Preisalarm erstellen',
      `Benachrichtigung wenn ${fuelLabels[fuelType]} unter ${price.toFixed(3).replace('.', ',')} € bei ${station.brand} fällt?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Erstellen',
          onPress: async () => {
            await addAlert({
              station_id: station.id,
              station_name: station.name,
              fuel_type: fuelType,
              threshold_price: price,
              is_active: true,
            });
            Alert.alert('Erfolg', 'Preisalarm wurde erstellt!');
          },
        },
      ]
    );
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    const [euros, cents] = price.toFixed(3).split('.');
    return { euros, mainCents: cents.slice(0, 2), lastDigit: cents.slice(2) };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentGreen} />
          <Text style={styles.loadingText}>Lade Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !station) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navHeader}>
          <TouchableOpacity testID="back-btn" style={styles.navButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.accentRed} />
          <Text style={styles.errorText}>{error || 'Tankstelle nicht gefunden'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity testID="back-btn" style={styles.navButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          testID="favorite-toggle-btn"
          style={styles.navButton}
          onPress={handleToggleFavorite}
        >
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
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.brandIconLarge}>
            <Ionicons name="business" size={36} color={COLORS.accentBlue} />
          </View>
          <Text style={styles.stationName} testID="station-name">{station.name}</Text>
          <Text style={styles.stationBrand}>{station.brand}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={15} color={COLORS.textSecondary} />
            <Text style={styles.address}>
              {station.street} {station.house_number}, {station.post_code} {station.place}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, station.is_open ? styles.openBadge : styles.closedBadge]}>
              <View style={[styles.statusDot, { backgroundColor: station.is_open ? COLORS.accentGreen : COLORS.accentRed }]} />
              <Text style={[styles.statusText, station.is_open ? styles.openText : styles.closedText]}>
                {station.is_open ? 'Jetzt geöffnet' : 'Geschlossen'}
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
          <Text style={styles.sectionTitle}>Aktuelle Preise</Text>
          <View style={styles.priceCards}>
            {(['diesel', 'e5', 'e10'] as FuelType[]).map((fuelType) => {
              const price = station[fuelType];
              const formatted = formatPrice(price);
              return (
                <TouchableOpacity
                  key={fuelType}
                  testID={`price-card-${fuelType}`}
                  style={styles.priceCard}
                  onPress={() => price && handleCreateAlert(fuelType, price)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.fuelIndicator, { backgroundColor: fuelColors[fuelType] }]} />
                  <Text style={styles.fuelLabel}>{fuelLabels[fuelType]}</Text>
                  {formatted ? (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceEuros}>{formatted.euros}</Text>
                      <Text style={styles.priceComma}>,</Text>
                      <Text style={styles.priceCents}>{formatted.mainCents}</Text>
                      <Text style={[styles.priceSuper, { color: fuelColors[fuelType] }]}>{formatted.lastDigit}</Text>
                      <Text style={styles.priceCurrency}>€</Text>
                    </View>
                  ) : (
                    <Text style={styles.priceNA}>—</Text>
                  )}
                  <View style={styles.alertHint}>
                    <Ionicons name="notifications-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.alertHintText}>Alarm setzen</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Opening Hours */}
        {station.opening_times && station.opening_times.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Öffnungszeiten</Text>
            <View style={styles.hoursCard}>
              {station.opening_times.map((time, index) => (
                <View key={index} style={[styles.hourRow, index === station.opening_times.length - 1 && styles.hourRowLast]}>
                  <Text style={styles.hourDay}>{time.text}</Text>
                  <Text style={styles.hourTime}>{time.start} – {time.end}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informationen</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="pin" size={18} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Standort</Text>
                <Text style={styles.infoValue}>
                  {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                </Text>
              </View>
            </View>
            {station.state && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="flag" size={18} color={COLORS.textSecondary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Bundesland</Text>
                  <Text style={styles.infoValue}>{station.state}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          testID="navigate-btn"
          style={styles.navigateButton}
          onPress={handleNavigate}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={20} color={COLORS.background} />
          <Text style={styles.navigateText}>Navigation starten</Text>
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
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
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
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: 140,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.md,
  },
  brandIconLarge: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stationName: {
    ...TYPOGRAPHY.h1,
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
    paddingHorizontal: SPACING.xl,
  },
  address: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
    textAlign: 'center',
    flex: 1,
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
    borderRadius: RADIUS.lg,
  },
  openBadge: {
    backgroundColor: COLORS.accentGreen + '15',
  },
  closedBadge: {
    backgroundColor: COLORS.accentRed + '15',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
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
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    marginLeft: SPACING.sm,
  },
  wholeDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentBlue,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  priceCards: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priceCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  fuelIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: SPACING.sm,
  },
  fuelLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceEuros: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  priceComma: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  priceCents: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  priceSuper: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  priceCurrency: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    marginLeft: 2,
    marginTop: 3,
  },
  priceNA: {
    fontSize: 28,
    fontWeight: '500',
    color: COLORS.textMuted,
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
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hourRowLast: {
    borderBottomWidth: 0,
  },
  hourDay: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  hourTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.elevated,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentGreen,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.xl,
    ...SHADOWS.medium,
  },
  navigateText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.background,
    marginLeft: SPACING.sm,
  },
});
