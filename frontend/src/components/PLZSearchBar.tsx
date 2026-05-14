import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { fuelApi } from '../services/api';
import { useStore } from '../store/useStore';

const RADIUS_OPTIONS = [2, 5, 10, 25];

interface PLZSearchBarProps {
  onSearchComplete?: (lat: number, lng: number, radius: number, locationName: string) => void;
}

export const PLZSearchBar: React.FC<PLZSearchBarProps> = ({ onSearchComplete }) => {
  const { searchRadius, setSearchRadius, setSearchQuery, setSearchLocationName, t } = useStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    Keyboard.dismiss();
    setIsSearching(true);

    try {
      const result = await fuelApi.geocode(trimmed);
      if (result.ok && result.results.length > 0) {
        const first = result.results[0];
        const label = first.postcode
          ? `${first.postcode} ${first.city}`
          : first.city || first.display_name.split(',')[0];

        setLocationLabel(label);
        setSearchQuery(trimmed);
        setSearchLocationName(label);

        onSearchComplete?.(first.lat, first.lng, searchRadius, label);
      }
    } catch (error) {
      console.error('Geocode error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, searchRadius, onSearchComplete]);

  const handleRadiusChange = (radius: number) => {
    setSearchRadius(radius);
    if (locationLabel) {
      // Re-trigger search with new radius via callback
      handleSearchWithNewRadius(radius);
    }
  };

  const handleSearchWithNewRadius = useCallback(async (newRadius: number) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    setIsSearching(true);
    try {
      const result = await fuelApi.geocode(trimmed);
      if (result.ok && result.results.length > 0) {
        const first = result.results[0];
        onSearchComplete?.(first.lat, first.lng, newRadius, locationLabel);
      }
    } catch (error) {
      console.error('Re-search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, locationLabel, onSearchComplete]);

  const handleClear = () => {
    setQuery('');
    setLocationLabel('');
    setSearchQuery('');
    setSearchLocationName('');
    inputRef.current?.focus();
  };

  return (
    <View style={styles.wrapper}>
      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            ref={inputRef}
            testID="plz-search-input"
            style={styles.input}
            placeholder={t('searchPLZ')}
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            keyboardType="default"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              testID="plz-search-clear"
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          testID="plz-search-btn"
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.8}
          disabled={isSearching || query.trim().length < 2}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
          )}
        </TouchableOpacity>
      </View>

      {/* Location Label */}
      {locationLabel ? (
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={COLORS.accentGreen} />
          <Text style={styles.locationLabel} numberOfLines={1}>{locationLabel}</Text>
        </View>
      ) : null}

      {/* Radius Selector */}
      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>{t('radius')}</Text>
        <View style={styles.radiusOptions}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              testID={`radius-option-${r}`}
              style={[styles.radiusOption, searchRadius === r && styles.radiusOptionActive]}
              onPress={() => handleRadiusChange(r)}
            >
              <Text style={[styles.radiusText, searchRadius === r && styles.radiusTextActive]}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  locationLabel: {
    fontSize: 13,
    color: COLORS.accentGreen,
    fontWeight: '500',
    marginLeft: 5,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  radiusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: SPACING.md,
  },
  radiusOptions: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  radiusOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radiusOptionActive: {
    backgroundColor: COLORS.accentGreen + '20',
    borderColor: COLORS.accentGreen,
  },
  radiusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  radiusTextActive: {
    color: COLORS.accentGreen,
  },
});
