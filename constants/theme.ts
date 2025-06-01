import { Platform } from 'react-native';

// Color Presets
export const COLOR_PRESETS = {
  neon: {
    primary: '#00FFFF', // Bright cyan
    secondary: '#FF00FF', // Magenta
    tertiary: '#00FF00', // Neon green
    accent: '#FF00AA', // Hot pink
    success: '#00FF9F', // Mint
    error: '#FF3D71', // Neon red
    warning: '#FFB800', // Amber
    info: '#00B8FF', // Sky blue
  },
  cyberpunk: {
    primary: '#FF00FF', // Hot pink
    secondary: '#00FFFF', // Cyan
    tertiary: '#FF00AA', // Neon pink
    accent: '#00FF00', // Neon green
    success: '#00FF9F', // Mint
    error: '#FF3D71', // Neon red
    warning: '#FFB800', // Amber
    info: '#00B8FF', // Sky blue
  },
  synthwave: {
    primary: '#FF00AA', // Neon pink
    secondary: '#00FFFF', // Cyan
    tertiary: '#FF00FF', // Magenta
    accent: '#00FF00', // Neon green
    success: '#00FF9F', // Mint
    error: '#FF3D71', // Neon red
    warning: '#FFB800', // Amber
    info: '#00B8FF', // Sky blue
  },
} as const;

// Default to neon theme
export const COLORS = {
  ...COLOR_PRESETS.neon,
  background: {
    primary: '#0A0A0A', // Dark background
    secondary: '#1A1A1A', // Slightly lighter background
    tertiary: '#2A2A2A', // Even lighter background
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
  },
  border: {
    primary: 'rgba(0, 255, 255, 0.3)', // Cyan with opacity
    secondary: 'rgba(255, 0, 255, 0.3)', // Magenta with opacity
  },
  shadow: {
    primary: 'rgba(0, 255, 255, 0.3)', // Cyan shadow
    secondary: 'rgba(255, 0, 255, 0.3)', // Magenta shadow
  },
} as const;

// Typography
export const FONTS = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
} as const;

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 6,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
} as const;

// Gradients
export const GRADIENTS = {
  primary: ['#00FFFF', '#FF00FF'], // Cyan to Magenta
  secondary: ['#FF00FF', '#00FF00'], // Magenta to Neon Green
  tertiary: ['#00FFFF', '#FF00AA'], // Cyan to Neon Pink
  success: ['#00FF9F', '#00FFFF'], // Mint to Cyan
  error: ['#FF3D71', '#FF00FF'], // Red to Magenta
} as const;

// Animation
export const ANIMATION = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
  },
} as const; 