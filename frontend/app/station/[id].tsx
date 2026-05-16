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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { fuelApi, PriceHistoryEntry } from '../../src/services/api';
import { StationDetail, FuelType } from '../../src/types';
import { Toast } from '../../src/components/Toast';

const fuelColors: Record<FuelType, string> = {
  diesel: COLORS.diesel,
  e5: COLORS.e5,
  e10: COLORS.e10,
};

const CHART_HEIGHT = 100;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md * 2;

function PriceLineChart({ data, color }: { data: PriceHistoryEntry[]; color: string }) {
  const { t, language } = useStore();
  const dateLocale = language === 'en' ? 'en-GB' : 'de-DE';

  if (data.length === 0) {
    return (
      <View style={chartStyles.empty}>
        <Text style={chartStyles.emptyText}>{t('noHistoryData')}</Text>
      </View>
    );
  }

  if (data.length === 1) {
    return (
      <View style={chartStyles.empty}>
        <Text style={chartStyles.emptyText}>{data[0].price.toFixed(3).replace('.', ',')} €</Text>
      </View>
    );
  }

  const prices = data.map((d) => d.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 0.001;

  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - ((d.price - minP) / range) * CHART_HEIGHT * 0.8 - CHART_HEIGHT * 0.1;
    return { x, y, price: d.price, date: d.recorded_at };
  });

  const segments = pts.slice(0, -1).map((p1, i) => {
    const p2 = pts[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { midX: (p1.x + p2.x) / 2, midY: (p1.y + p2.y) / 2, length, angle };
  });

  const labelStep = Math.max(1, Math.floor(data.length / 4));
  const labelIndices = new Set([0, data.length - 1]);
  for (let i = labelStep; i < data.length - 1; i += labelStep) labelIndices.add(i);

  return (
    <View style={chartStyles.wrapper}>
      <View style={[chartStyles.canvas, { height: CHART_HEIGHT, width: CHART_WIDTH }]}>
        {[0.25, 0.5, 0.75].map((frac) => (
          <View key={frac} style={[chartStyles.gridLine, { top: CHART_HEIGHT * frac }]} />
        ))}
        {segments.map((seg, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: seg.midX - seg.length / 2,
              top: seg.midY - 1,
              width: seg.length,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: `${seg.angle}deg` }],
            }}
          />
        ))}
        {pts.map((p, i) => (
          <View key={i} style={[chartStyles.dot, { left: p.x - 4, top: p.y - 4, backgroundColor: color }]} />
        ))}
      </View>
      <View style={[chartStyles.xAxis, { width: CHART_WIDTH }]}>
        {pts.map((p, i) =>
          labelIndices.has(i) ? (
            <Text key={i} style={[chartStyles.xLabel, { left: p.x - 18 }]} numberOfLines={1}>
              {new Date(p.date).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' })}
            </Text>
          ) : null,
        )}
      </View>
      <View style={chartStyles.yLabels}>
        <Text style={chartStyles.yLabel}>{maxP.toFixed(3).replace('.', ',')} €</Text>
        <Text style={chartStyles.yLabel}>{minP.toFixed(3).replace('.', ',')} €</Text>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  canvas: { position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.border },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: COLORS.cardBackground },
  xAxis: { height: 20, position: 'relative', marginTop: SPACING.xs },
  xLabel: { position: 'absolute', fontSize: 10, color: COLORS.textMuted, width: 36, textAlign: 'center' },
  yLabels: {
    position: 'absolute', right: SPACING.md, top: SPACING.md,
    bottom: SPACING.md + 20, justifyContent: 'space-between', alignItems: 'flex-end',
  },
  yLabel: { fontSize: 10, color: COLORS.textMuted },
  empty: {
    backgroundColor: COLORS.cardBackground, borderRadius: RADIUS.xl, padding: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', height: 80,
  },
  emptyText: { fontSize: 13, color: COLORS.textMuted },
});

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite, addAlert, t } = useStore();

  const [station, setStation] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [chartFuelType, setChartFuelType] = useState<FuelType>('diesel');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const favorite = station ? isFavorite(station.id) : false;

  const getFuelLabel = (ft: FuelType) => {
    if (ft === 'diesel') return t('diesel');
    if (ft === 'e5') return t('superE5');
    return t('superE10');
  };

  useEffect(() => {
    const fetchStation = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await fuelApi.getStationDetail(id);
        if (response.ok && response.station) {
          setStation(response.station);
        } else {
          setError(t('stationNotFound'));
        }
      } catch {
        setError(t('failedToLoad'));
      } finally {
        setLoading(false);
      }
    };
    fetchStation();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fuelApi.getPriceHistory(id, chartFuelType, 7)
      .then(setPriceHistory)
      .catch(() => setPriceHistory([]));
  }, [id, chartFuelType]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleToggleFavorite = async () => {
    if (!station) return;
    if (favorite) {
      await removeFavorite(station.id);
      showToast(t('favoriteRemoved'));
    } else {
      await addFavorite({
        station_id: station.id,
        station_name: station.name,
        station_brand: station.brand,
        lat: station.lat,
        lng: station.lng,
      });
      showToast(t('favoriteAdded'));
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
      t('createPriceAlert'),
      `${getFuelLabel(fuelType)} ${t('dropsBelow')} ${price.toFixed(3).replace('.', ',')} € ${t('at')} ${station.brand}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('create'),
          onPress: async () => {
            await addAlert({
              station_id: station.id,
              station_name: station.name,
              fuel_type: fuelType,
              threshold_price: price,
              is_active: true,
            });
            Alert.alert(t('success'), t('alertCreated'));
          },
        },
      ],
    );
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return null;
    const [euros, cents] = price.toFixed(3).split('.');
    return { euros, mainCents: cents.slice(0, 2), lastDigit: cents.slice(2) };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentGreen} />
          <Text style={styles.loadingText}>{t('loadingDetails')}</Text>
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
          <Text style={styles.errorText}>{error || t('stationNotFound')}</Text>
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
                {station.is_open ? t('openNow') : t('closed')}
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
          <Text style={styles.sectionTitle}>{t('currentPrices')}</Text>
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
                  <Text style={styles.fuelLabel}>{getFuelLabel(fuelType)}</Text>
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
                    <Text style={styles.alertHintText}>{t('alertSetHint')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Price History Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('priceHistory')}</Text>
          <View style={styles.chartFuelTabs}>
            {(['diesel', 'e5', 'e10'] as FuelType[]).map((ft) => (
              <TouchableOpacity
                key={ft}
                style={[
                  styles.chartTab,
                  chartFuelType === ft && { borderBottomColor: fuelColors[ft], borderBottomWidth: 2 },
                ]}
                onPress={() => setChartFuelType(ft)}
              >
                <Text style={[styles.chartTabText, chartFuelType === ft && { color: fuelColors[ft] }]}>
                  {getFuelLabel(ft)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <PriceLineChart data={priceHistory} color={fuelColors[chartFuelType]} />
        </View>

        {/* Opening Hours */}
        {station.opening_times && station.opening_times.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('openingHours')}</Text>
            <View style={styles.hoursCard}>
              {station.opening_times.map((time, index) => (
                <View
                  key={index}
                  style={[styles.hourRow, index === station.opening_times.length - 1 && styles.hourRowLast]}
                >
                  <Text style={styles.hourDay}>{time.text}</Text>
                  <Text style={styles.hourTime}>{time.start} – {time.end}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('information')}</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="pin" size={18} color={COLORS.textSecondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('location')}</Text>
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
                  <Text style={styles.infoLabel}>{t('state')}</Text>
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
          <Text style={styles.navigateText}>{t('startNavigation')}</Text>
        </TouchableOpacity>
      </View>

      {/* Favorite feedback toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        bottomOffset={Platform.OS === 'ios' ? 130 : 110}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.md },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  errorText: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.md, textAlign: 'center' },
  navHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  navButton: {
    width: 48, height: 48, borderRadius: RADIUS.xl, backgroundColor: COLORS.cardBackground,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 140 },
  heroSection: { alignItems: 'center', paddingVertical: SPACING.xl, marginBottom: SPACING.md },
  brandIconLarge: {
    width: 80, height: 80, borderRadius: RADIUS.xl, backgroundColor: COLORS.cardBackground,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  stationName: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary, textAlign: 'center' },
  stationBrand: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, paddingHorizontal: SPACING.xl },
  address: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 6, textAlign: 'center', flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.lg,
  },
  openBadge: { backgroundColor: COLORS.accentGreen + '15' },
  closedBadge: { backgroundColor: COLORS.accentRed + '15' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 14, fontWeight: '600' },
  openText: { color: COLORS.accentGreen },
  closedText: { color: COLORS.accentRed },
  wholeDayBadge: {
    backgroundColor: COLORS.accentBlue + '20', paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5, borderRadius: RADIUS.md, marginLeft: SPACING.sm,
  },
  wholeDayText: { fontSize: 13, fontWeight: '700', color: COLORS.accentBlue },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: SPACING.md },
  priceCards: { flexDirection: 'row', gap: SPACING.sm },
  priceCard: {
    flex: 1, backgroundColor: COLORS.cardBackground, borderRadius: RADIUS.xl, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  fuelIndicator: { width: 32, height: 4, borderRadius: 2, marginBottom: SPACING.sm },
  fuelLabel: {
    fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: SPACING.sm,
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start' },
  priceEuros: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary },
  priceComma: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary },
  priceCents: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  priceSuper: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  priceCurrency: { fontSize: 14, fontWeight: '400', color: COLORS.textSecondary, marginLeft: 2, marginTop: 3 },
  priceNA: { fontSize: 28, fontWeight: '500', color: COLORS.textMuted },
  alertHint: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  alertHintText: { fontSize: 10, color: COLORS.textMuted, marginLeft: 4 },
  hoursCard: {
    backgroundColor: COLORS.cardBackground, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  hourRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  hourRowLast: { borderBottomWidth: 0 },
  hourDay: { fontSize: 14, color: COLORS.textSecondary },
  hourTime: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  infoCard: {
    backgroundColor: COLORS.cardBackground, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  infoIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.cardSecondary,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, marginTop: 2 },
  bottomActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.cardBackground, paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md, paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.elevated,
  },
  navigateButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accentGreen, paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.xl, ...SHADOWS.medium,
  },
  navigateText: { fontSize: 17, fontWeight: '700', color: COLORS.background, marginLeft: SPACING.sm },
  chartFuelTabs: { flexDirection: 'row', marginBottom: SPACING.md },
  chartTab: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  chartTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
});
