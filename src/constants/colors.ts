/**
 * Color Constants
 *
 * Central source of truth for colors used outside of Tailwind className.
 * These values MUST match tailwind.config.ts to ensure consistency.
 *
 * Use cases:
 * - React Native components that don't support className (expo-router tabs, gradients, etc.)
 * - Victory Native charts (color prop)
 * - Any native styling that requires hex values
 *
 * For regular components, prefer Tailwind className:
 * GOOD: <View className="bg-primary">
 * BAD:  <View style={{ backgroundColor: COLORS.primary }}>
 */

export const Colors = {
  // Background colors
  background: {
    DEFAULT: '#0A0A0A', // bg-background
    surface: '#1A1A1A', // bg-background-surface
    elevated: '#2A2A2A', // bg-background-elevated
  },

  // Brand colors
  primary: {
    DEFAULT: '#0EA5E9', // bg-primary (sky-500)
    dark: '#0284C7', // bg-primary-dark (sky-600, pressed states)
    light: '#38BDF8', // bg-primary-light (sky-400, highlights)
    foreground: '#FFFFFF', // text-primary-foreground (white text on blue)
  },

  // Semantic colors
  success: '#38a169', // text-success
  warning: '#d69e2e', // text-warning
  destructive: '#e53e3e', // text-destructive
  info: '#0369A1', // text-info (sky-700)

  // Text colors
  foreground: {
    DEFAULT: '#e2e8f0', // text-foreground
    secondary: '#a0aec0', // text-foreground-secondary
    tertiary: '#718096', // text-foreground-tertiary
    inverse: '#1a202c', // text-foreground-inverse
  },

  // Border colors
  border: {
    DEFAULT: '#2d3748', // border-border
    light: '#4a5568', // border-border-light
    input: '#9CA3AF', // Checkbox/input borders (unselected state)
  },

  // UI library tokens (match copied react-native-reusables components)
  accent: {
    DEFAULT: '#27272A', // bg-accent
    foreground: '#E2E8F0', // text-accent-foreground
  },
  secondary: {
    DEFAULT: '#27272A', // bg-secondary
    foreground: '#E2E8F0', // text-secondary-foreground
  },
  card: {
    DEFAULT: '#1A1A1A', // bg-card
    foreground: '#E2E8F0', // text-card-foreground
  },
  input: '#27272A', // border-input
  muted: {
    DEFAULT: '#27272A', // bg-muted
    foreground: '#94A3B8', // text-muted-foreground
  },
  ring: '#0EA5E9', // ring-ring (match primary)

  // Surface colors (for image backgrounds, overlays)
  surface: {
    white: '#FFFFFF', // White background for image thumbnails
  },

  // RPE Colors (Rate of Perceived Exertion)
  rpe: {
    low: '#38a169', // text-rpe-low
    medium: '#d69e2e', // text-rpe-medium
    high: '#e53e3e', // text-rpe-high
    max: '#c53030', // text-rpe-max
  },
} as const;
