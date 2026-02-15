/**
 * Color Constants — Single Source of Truth
 *
 * ALL app colors are defined here. Both NativeWind (tailwind.config.ts)
 * and programmatic usage (props, style objects, SVGs, charts) import from this file.
 *
 * For components, prefer Tailwind className over programmatic access:
 * GOOD: <View className="bg-primary">
 * BAD:  <View style={{ backgroundColor: Colors.primary.DEFAULT }}>
 */

export const Colors = {
  // Background colors
  background: {
    DEFAULT: '#0A0A0A',
    surface: '#1A1A1A',
    elevated: '#2A2A2A',
  },

  // Brand colors
  primary: {
    DEFAULT: '#0EA5E9', // sky-500
    dark: '#0284C7', // sky-600 (pressed states)
    light: '#38BDF8', // sky-400 (highlights)
    muted: '#2768A3', // muted sky (secondary muscle highlights)
    foreground: '#FFFFFF',
  },

  // Semantic colors
  success: '#38a169',
  warning: '#d69e2e',
  destructive: '#e53e3e',
  info: '#0369A1', // sky-700

  // Text colors
  foreground: {
    DEFAULT: '#e2e8f0',
    secondary: '#a0aec0',
    tertiary: '#718096',
    inverse: '#1a202c',
  },

  // Border colors
  border: {
    DEFAULT: '#2d3748',
    light: '#4a5568',
    input: '#9CA3AF', // Checkbox/input borders (unselected state)
  },

  // UI library tokens (react-native-reusables components)
  accent: {
    DEFAULT: '#27272A',
    foreground: '#E2E8F0',
  },
  secondary: {
    DEFAULT: '#27272A',
    foreground: '#E2E8F0',
  },
  card: {
    DEFAULT: '#1A1A1A',
    foreground: '#E2E8F0',
  },
  input: '#27272A',
  muted: {
    DEFAULT: '#27272A',
    foreground: '#94A3B8',
  },
  ring: '#0EA5E9',

  // Surface colors
  surface: {
    white: '#FFFFFF',
  },

  // Muscle diagram colors (body-highlighter SVG icons)
  muscle: {
    dimBody: '#3f3f3f', // Silhouette context layer (dark variant)
  },

  // RPE Colors (Rate of Perceived Exertion)
  rpe: {
    low: '#38a169',
    medium: '#d69e2e',
    high: '#e53e3e',
    max: '#c53030',
  },
} as const;
