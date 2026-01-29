import type { Config } from 'tailwindcss';

const config: Config = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./src/**/*.{js,jsx,ts,tsx}', './App.{js,jsx,ts,tsx}'],
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Background colors
        background: {
          DEFAULT: '#0A0A0A', // Deep black
          surface: '#1A1A1A', // Card backgrounds
          elevated: '#2A2A2A', // Elevated cards
        },

        // Brand colors
        primary: {
          DEFAULT: '#4299e1', // Brand blue
          dark: '#2b6cb0', // Darker blue for pressed states
          light: '#63b3ed', // Lighter blue for highlights
          foreground: '#FFFFFF', // Text on primary buttons
        },

        // Semantic colors
        success: '#38a169', // Progress green
        warning: '#d69e2e', // Caution amber
        destructive: '#e53e3e', // Critical red (delete, errors)
        info: '#3182ce', // Information blue

        // Text colors (using Tailwind's text-* convention)
        foreground: {
          DEFAULT: '#e2e8f0', // Primary text (light)
          secondary: '#a0aec0', // Secondary text (medium gray)
          tertiary: '#718096', // Tertiary text (dark gray)
          inverse: '#1a202c', // Text on light backgrounds
        },

        // Border colors
        border: {
          DEFAULT: '#2d3748', // Default borders
          light: '#4a5568', // Lighter borders
        },

        // UI library tokens (required by copied react-native-reusables components)
        accent: {
          DEFAULT: '#27272A', // Hover/active background
          foreground: '#E2E8F0', // Text on accent
        },
        secondary: {
          DEFAULT: '#27272A', // Secondary button background
          foreground: '#E2E8F0', // Text on secondary
        },
        card: {
          DEFAULT: '#1A1A1A', // Card background
          foreground: '#E2E8F0', // Text inside cards
        },
        input: '#27272A', // Input borders and dark-mode bg
        muted: {
          DEFAULT: '#27272A', // Muted backgrounds (code blocks, disabled)
          foreground: '#94A3B8', // Muted text (placeholders, descriptions)
        },
        ring: '#4299e1', // Focus ring color

        // RPE Colors (Rate of Perceived Exertion)
        rpe: {
          low: '#38a169', // RPE 1-5 (Easy)
          medium: '#d69e2e', // RPE 6-7 (Moderate)
          high: '#e53e3e', // RPE 8-9 (Hard)
          max: '#c53030', // RPE 10 (Maximum)
        },
      },

      spacing: {
        // Using 8px grid system (xs, sm, md, lg, xl, 2xl, 3xl)
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },

      fontSize: {
        // Modular scale 1.25 (12-36px)
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '28px',
        '3xl': '32px',
        '4xl': '36px',
      },
    },
  },
  plugins: [],
};

export default config;
