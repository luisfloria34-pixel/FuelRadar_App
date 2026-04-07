// FuelRadar Premium Theme - German Market
export const COLORS = {
  // Base colors
  background: '#0A0A0B',
  cardBackground: '#14161A',
  cardSecondary: '#1B1E24',
  cardElevated: '#1E2128',
  border: '#2A2F38',
  borderLight: '#3A3F48',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#9AA3AF',
  textMuted: '#6B7280',
  textLight: '#B8C0CC',
  
  // Accent colors
  accent: '#32D74B',
  accentGreen: '#32D74B',
  accentBlue: '#3B82F6',
  accentOrange: '#FF9F0A',
  accentRed: '#FF453A',
  accentPurple: '#A855F7',
  
  // Fuel type colors
  diesel: '#3B82F6',
  e5: '#32D74B',
  e10: '#FF9F0A',
  
  // Status
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF453A',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.85)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  glassBg: 'rgba(20, 22, 26, 0.95)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  full: 999,
};

export const TYPOGRAPHY = {
  // Hero price
  priceHero: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  // Large price
  priceLarge: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  // Medium price
  priceMedium: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  // Small price
  priceSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  // Headers
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  // Body
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  tiny: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
};
