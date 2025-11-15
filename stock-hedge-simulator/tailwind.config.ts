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
        background: 'hsl(210 40% 98%)',
        foreground: 'hsl(213 22% 15%)',
        muted: 'hsl(214 32% 94%)',
        accent: 'hsl(199 89% 48%)',
        positive: 'hsl(148 68% 42%)',
        negative: 'hsl(0 84% 60%)',
        card: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(213 22% 15%)',
        },
        border: 'hsl(214 32% 86%)',
        input: 'hsl(214 32% 90%)',
        ring: 'hsl(199 89% 48%)',
      },
      boxShadow: {
        card: '0 18px 30px -20px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
