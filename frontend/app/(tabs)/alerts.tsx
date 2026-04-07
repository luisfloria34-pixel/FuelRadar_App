import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { Alert as AlertType, FuelType } from '../../src/types';

export default function AlertsScreen() {
  const { alerts, addAlert, removeAlert, toggleAlert } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [newAlert, setNewAlert] = useState({
    fuel_type: 'e10' as FuelType,
    threshold_price: '',
    station_name: '',
  });

  const handleCreateAlert = async () => {
    const price = parseFloat(newAlert.threshold_price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
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
  };

  const handleDeleteAlert = (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeAlert(alertId) },
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
        <Text style={styles.title}>Price Alerts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Alerts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create price alerts to get notified when fuel prices drop below your target.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.background} />
              <Text style={styles.emptyButtonText}>Create Alert</Text>
            </TouchableOpacity>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View
                  style={[
                    styles.fuelBadge,
                    { backgroundColor: fuelColors[alert.fuel_type] + '20' },
                  ]}
                >
                  <Text
                    style={[styles.fuelBadgeText, { color: fuelColors[alert.fuel_type] }]}
                  >
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
                <View style={styles.priceTarget}>
                  <Text style={styles.priceLabel}>Alert when below</Text>
                  <Text style={styles.priceValue}>
                    {alert.threshold_price.toFixed(3)} €
                  </Text>
                </View>
                {alert.station_name && (
                  <Text style={styles.stationName}>
                    <Ionicons name="business" size={14} color={COLORS.textSecondary} />
                    {' '}{alert.station_name}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteAlert(alert.id)}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Alert</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Fuel Type</Text>
            <View style={styles.fuelOptions}>
              {(['diesel', 'e5', 'e10'] as FuelType[]).map((type) => (
                <TouchableOpacity
                  key={type}
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

            <Text style={styles.inputLabel}>Target Price (€)</Text>
            <TextInput
              style={styles.input}
              value={newAlert.threshold_price}
              onChangeText={(text) => setNewAlert({ ...newAlert, threshold_price: text })}
              placeholder="1.50"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Station Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newAlert.station_name}
              onChangeText={(text) => setNewAlert({ ...newAlert, station_name: text })}
              placeholder="Any station"
              placeholderTextColor={COLORS.textMuted}
            />

            <TouchableOpacity style={styles.createButton} onPress={handleCreateAlert}>
              <Text style={styles.createButtonText}>Create Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentGreen,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
    marginLeft: SPACING.xs,
  },
  alertCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fuelBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  fuelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertContent: {},
  priceTarget: {
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stationName: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    padding: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  fuelOptions: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  fuelOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  fuelOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  createButton: {
    backgroundColor: COLORS.accentGreen,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
});
