import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface SearchBarProps {
  placeholder?: string;
  onPress?: () => void;
  value?: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
}

export const PremiumSearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Tankstelle suchen...',
  onPress,
  value,
  onChangeText,
  editable = false,
}) => {
  if (onPress && !editable) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <Text style={styles.placeholder}>{placeholder}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={COLORS.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.subtle,
  },
  placeholder: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});
