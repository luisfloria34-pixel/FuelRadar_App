// FuelRadar Premium Theme
export const COLORS = {
  // Base colors
  background: '#0A0A0B',
  cardBackground: '#14161A',
  cardSecondary: '#1B1E24',
  border: '#2A2F38',
  
  // Text colors
  textPrimary: '#F5F7FA',
  textSecondary: '#9AA3AF',
  textMuted: '#6B7280',
  
  // Accent colors
  accentGreen: '#32D74B',
  accentBlue: '#3B82F6',
  accentOrange: '#FF9F0A',
  accentRed: '#FF453A',
  
  // Status colors
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#3B82F6',
  
  // Fuel type colors
  diesel: '#3B82F6',
  e5: '#32D74B',
  e10: '#FF9F0A',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  price: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  priceSmall: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
};
