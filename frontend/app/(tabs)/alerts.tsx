import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { Alert as AlertType, FuelType } from '../../src/types';
import {
  getNotificationPermissionStatus,
  requestNotificationPermissions,
  registerForPushNotifications,
  PermissionStatus,
} from '../../src/hooks/useNotifications';

export default function AlertsScreen() {
  const { alerts, addAlert, removeAlert, toggleAlert, deviceId, language } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [newAlert, setNewAlert] = useState({
    fuel_type: 'e10' as FuelType,
    threshold_price: '',
    station_name: '',
  });
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');

  // Re-check permission every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getNotificationPermissionStatus().then(setPermissionStatus);
    }, [])
  );

  const handleEnableNotifications = async () => {
    if (permissionStatus === 'denied') {
      // On iOS "denied" means permanently denied — must go to Settings
      Alert.alert(
        'Benachrichtigungen deaktiviert',
        'Öffne die Einstellungen und aktiviere Benachrichtigungen für FuelRadar.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Einstellungen', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    const status = await requestNotificationPermissions();
    setPermissionStatus(status);
    if (status === 'granted' && deviceId) {
      registerForPushNotifications(deviceId, language);
    }
  };

  const handleCreateAlert = async () => {
    const price = parseFloat(newAlert.threshold_price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      Alert.alert('Ungültiger Preis', 'Bitte gib einen gültigen Preis ein.');
      return;
    }

    await addAlert({
      fuel_type: newAlert.fuel_type,
      threshold_price: price,
      station_name: newAlert.station_name || undefined,
      is_active: true,
    });

    setModalVisible(false);
    setNewAlert({ fuel_type: 'e10', threshold_price: '', station_name: '' });

    // Prompt for notification permission if not yet granted
    if (permissionStatus !== 'granted') {
      setTimeout(() => handleEnableNotifications(), 400);
    }
  };

  const handleDeleteAlert = (alertId: string) => {
    Alert.alert(
      'Alarm löschen',
      'Möchtest du diesen Preisalarm wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => removeAlert(alertId) },
      ]
    );
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title} testID="alerts-title">Preisalarme</Text>
          <Text style={styles.subtitle}>
            {alerts.length > 0 ? `${alerts.length} aktive Alarme` : 'Werde benachrichtigt'}
          </Text>
        </View>
        <TouchableOpacity
          testID="create-alert-btn"
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.background} />
        </TouchableOpacity>
      </View>

      {/* Notification permission banner */}
      {permissionStatus !== 'granted' && (
        <TouchableOpacity
          style={styles.permissionBanner}
          onPress={handleEnableNotifications}
          activeOpacity={0.85}
        >
          <View style={styles.permissionBannerLeft}>
            <View style={styles.permissionIconWrap}>
              <Ionicons name="notifications-off-outline" size={20} color={COLORS.accentAmber} />
            </View>
            <View>
              <Text style={styles.permissionTitle}>Benachrichtigungen deaktiviert</Text>
              <Text style={styles.permissionSubtitle}>
                {permissionStatus === 'denied'
                  ? 'In den Einstellungen aktivieren'
                  : 'Tippe um Alarme zu erhalten'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.accentAmber} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-outline" size={44} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Noch keine Alarme</Text>
            <Text style={styles.emptySubtitle}>
              Erstelle Preisalarme und werde benachrichtigt, sobald Kraftstoffpreise unter deinen Zielpreis fallen.
            </Text>
            <TouchableOpacity
              testID="create-first-alert-btn"
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.background} />
              <Text style={styles.emptyButtonText}>Alarm erstellen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard} testID={`alert-card-${alert.id}`}>
              <View style={styles.alertHeader}>
                <View style={[styles.fuelBadge, { backgroundColor: fuelColors[alert.fuel_type] + '20' }]}>
                  <View style={[styles.fuelDot, { backgroundColor: fuelColors[alert.fuel_type] }]} />
                  <Text style={[styles.fuelBadgeText, { color: fuelColors[alert.fuel_type] }]}>
                    {fuelLabels[alert.fuel_type]}
                  </Text>
                </View>
                <Switch
                  value={alert.is_active}
                  onValueChange={() => toggleAlert(alert.id)}
                  trackColor={{ false: COLORS.border, true: COLORS.accentGreen + '50' }}
                  thumbColor={alert.is_active ? COLORS.accentGreen : COLORS.textMuted}
                />
              </View>

              <View style={styles.alertContent}>
                <Text style={styles.priceLabel}>Alarm wenn unter</Text>
                <Text style={styles.priceValue}>
                  {alert.threshold_price.toFixed(2).replace('.', ',')} €
                </Text>
                {alert.station_name && (
                  <View style={styles.stationRow}>
                    <Ionicons name="business" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.stationName}>{alert.station_name}</Text>
                  </View>
                )}
              </View>

              {/* Active notification indicator */}
              {alert.is_active && permissionStatus === 'granted' && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="notifications" size={12} color={COLORS.accentGreen} />
                  <Text style={styles.activeIndicatorText}>Aktiv</Text>
                </View>
              )}

              <TouchableOpacity
                testID={`delete-alert-${alert.id}`}
                style={styles.deleteButton}
                onPress={() => handleDeleteAlert(alert.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.accentRed} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Alert Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Neuer Preisalarm</Text>
              <TouchableOpacity
                testID="close-alert-modal"
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Kraftstoffart</Text>
            <View style={styles.fuelOptions}>
              {(['diesel', 'e5', 'e10'] as FuelType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  testID={`fuel-option-${type}`}
                  style={[
                    styles.fuelOption,
                    newAlert.fuel_type === type && {
                      backgroundColor: fuelColors[type] + '20',
                      borderColor: fuelColors[type],
                    },
                  ]}
                  onPress={() => setNewAlert({ ...newAlert, fuel_type: type })}
                >
                  <Text
                    style={[
                      styles.fuelOptionText,
                      newAlert.fuel_type === type && { color: fuelColors[type] },
                    ]}
                  >
                    {fuelLabels[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Zielpreis (€)</Text>
            <TextInput
              testID="alert-price-input"
              style={styles.input}
              value={newAlert.threshold_price}
              onChangeText={(text) => setNewAlert({ ...newAlert, threshold_price: text })}
              placeholder="z.B. 1,50"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Tankstelle (optional)</Text>
            <TextInput
              testID="alert-station-input"
              style={styles.input}
              value={newAlert.station_name}
              onChangeText={(text) => setNewAlert({ ...newAlert, station_name: text })}
              placeholder="Jede Tankstelle"
              placeholderTextColor={COLORS.textMuted}
            />

            <TouchableOpacity
              testID="submit-alert-btn"
              style={styles.createButton}
              onPress={handleCreateAlert}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications" size={20} color={COLORS.background} />
              <Text style={styles.createButtonText}>Alarm erstellen</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  // Permission banner
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: '#2A1F00',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accentAmber + '50',
  },
  permissionBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  permissionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentAmber + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accentAmber,
  },
  permissionSubtitle: {
    fontSize: 12,
    color: COLORS.accentAmber + 'AA',
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 21,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentGreen,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xl,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
    marginLeft: SPACING.sm,
  },
  alertCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fuelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
  },
  fuelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  fuelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  alertContent: {},
  priceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    ...TYPOGRAPHY.priceLarge,
    color: COLORS.textPrimary,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  stationName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: 4,
  },
  activeIndicatorText: {
    fontSize: 12,
    color: COLORS.accentGreen,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accentRed + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: 50,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fuelOptions: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  fuelOption: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fuelOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentGreen,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md + 2,
    ...SHADOWS.medium,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    marginLeft: SPACING.sm,
  },
});
