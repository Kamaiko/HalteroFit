import type { Config } from 'tailwindcss';
import { Colors } from './src/constants/colors';

const config: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Colors,

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
