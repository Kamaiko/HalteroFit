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
  // ============================================================================
  // Core App Colors
  // ============================================================================

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
  success: '#38A169',
  warning: '#D69E2E',
  destructive: '#E53E3E',
  info: '#0369A1', // sky-700

  // Text colors
  foreground: {
    DEFAULT: '#E2E8F0',
    secondary: '#A0AEC0',
    tertiary: '#718096',
    inverse: '#1A202C',
  },

  // Border colors
  border: {
    DEFAULT: '#2D3748',
    light: '#4A5568',
    input: '#9CA3AF', // Checkbox/input borders (unselected state)
  },

  // Surface colors
  surface: {
    white: '#FFFFFF',
  },

  // Overlay/translucent colors
  overlay: {
    light: 'rgba(255, 255, 255, 0.3)', // Handles, placeholder icons on dark bg
  },

  // ============================================================================
  // UI Library Tokens (react-native-reusables components)
  // Values may duplicate core colors — kept separate for library compatibility
  // ============================================================================

  accent: {
    DEFAULT: '#27272A',
    foreground: '#E2E8F0',
  },
  secondary: {
    DEFAULT: '#27272A',
    foreground: '#E2E8F0',
  },
  card: {
    DEFAULT: '#1A1A1A', // matches background.surface
    foreground: '#E2E8F0',
  },
  input: '#27272A',
  muted: {
    DEFAULT: '#27272A',
    foreground: '#94A3B8',
  },
  ring: '#0EA5E9', // matches primary.DEFAULT

  // ============================================================================
  // Domain-Specific Colors
  // ============================================================================

  // Brand logo gradient (carbon fiber effect — diagonal sheen on dark backgrounds)
  brand: {
    carbonLight: '#404040', // Highlight (top-left sheen)
    carbonDark: '#1A1A1A', // Shadow (matches background.surface)
  },

  // Dev mode
  dev: {
    banner: '#FF6B35', // Orange dev mode indicator
  },

  // Muscle diagram colors (body-highlighter SVG icons)
  muscle: {
    dimBody: '#4F4F4F', // Silhouette context layer (dark variant)
  },

  // RPE Colors (Rate of Perceived Exertion)
  // Intentionally duplicates semantic colors — may diverge for fine-grained RPE visualization
  rpe: {
    low: '#38A169',
    medium: '#D69E2E',
    high: '#E53E3E',
    max: '#C53030',
  },
} as const;
