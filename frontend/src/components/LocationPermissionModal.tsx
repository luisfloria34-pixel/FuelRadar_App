import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface Props {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export function LocationPermissionModal({ visible, onAllow, onDeny }: Props) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="location" size={32} color={COLORS.accent} />
          </View>

          <Text style={styles.title}>Standort freigeben?</Text>

          <Text style={styles.body}>
            FuelRadar zeigt dir Tankstellen in deiner Nähe und die günstigsten Preise auf der Karte.
          </Text>

          {showWhy && (
            <View style={styles.whyBox}>
              <Text style={styles.whyText}>
                <Text style={styles.whyBold}>Warum brauchen wir deinen Standort?{'\n'}</Text>
                Dein Standort wird nur auf deinem Gerät verwendet, um Tankstellen in der Nähe zu laden. Er wird nicht gespeichert, nicht geteilt und nicht an Dritte weitergegeben.{'\n\n'}
                Ohne Standort wird Berlin als Standardort verwendet.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.whyBtn} onPress={() => setShowWhy(v => !v)}>
            <Ionicons name={showWhy ? 'chevron-up' : 'information-circle-outline'} size={16} color={COLORS.accent} />
            <Text style={styles.whyBtnText}>{showWhy ? 'Weniger anzeigen' : 'Warum wird der Standort benötigt?'}</Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.denyBtn} onPress={onDeny}>
              <Text style={styles.denyText}>Nicht jetzt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.allowBtn} onPress={onAllow}>
              <Text style={styles.allowText}>Erlauben</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: '#1C1E23',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  body: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  whyBox: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  whyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  whyBold: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  whyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.lg,
  },
  whyBtnText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  denyBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  denyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  allowBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  allowText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '700',
  },
});
