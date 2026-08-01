/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      colors: {
        lightbg: '#F3F3F3',
        lightsurface: '#FFFFFF',
        lightborder: '#D0D0D2',
        lightbordermuted: '#BCBCBE',
        lighttext: '#2E2E2D',
        lightsubtext: '#4B4C51',
        darkbg: '#000000',
        darkbg2: '#0a0a0c',
        darksurface: '#121215',
        darkborder: '#28282d',
        darktext: '#F3DDB6',
        darksubtext: '#DFE0E2',
        darkmuted: '#7E7E7E',
        darkcaption: '#7E7E7E',
        accentGradient: '#8D9797',
        gold: {
          50: '#fffcf7',
          100: '#fdf7eb',
          200: '#fbeed2',
          300: '#f7dfae',
          400: '#F3DDB6',
          500: '#F3DDB6',
          600: '#e5c490',
          700: '#c59f64',
          800: '#7E7E7E',
        },
        brand: {
          50: '#fffcf7',
          100: '#fdf7eb',
          200: '#fbeed2',
          300: '#f7dfae',
          400: '#F3DDB6',
          500: '#F3DDB6',
          600: '#e5c490',
          700: '#c59f64',
          800: '#484848',
          900: '#3a3a3a',
          950: '#292929',
        },
        risk: {
          low: '#10B981',
          medium: '#F3DDB6',
          high: '#EF4444',
          critical: '#DC2626',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'gold-glow': '0 0 25px -5px rgba(243, 221, 182, 0.35)',
        'gold-md': '0 4px 15px -1px rgba(243, 221, 182, 0.25)',
      }
    },
  },
  plugins: [],
};
