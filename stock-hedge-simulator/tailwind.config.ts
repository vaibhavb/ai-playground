import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: ['index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Geist', 'Mona Sans', 'IBM Plex Sans', 'Manrope', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        background: 'hsl(210 40% 2%)',
        foreground: 'hsl(210 40% 98%)',
        muted: 'hsl(218 14% 15%)',
        accent: 'hsl(190 95% 39%)',
        positive: 'hsl(142 72% 45%)',
        negative: 'hsl(0 85% 65%)',
        card: {
          DEFAULT: 'hsl(222 41% 10%)',
          foreground: 'hsl(210 40% 98%)',
        },
        border: 'hsl(217 33% 17%)',
        input: 'hsl(217 33% 17%)',
        ring: 'hsl(190 95% 39%)',
      },
      boxShadow: {
        card: '0 20px 45px -20px rgba(15, 118, 110, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
