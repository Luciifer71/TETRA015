/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      colors: {
        darkbg: '#10120D',
        darkbg2: '#263C49',
        darksurface: '#263C49',
        darkborder: '#344e5f',
        darktext: '#DFE0E2',
        darksubtext: '#CBCDD0',
        darkmuted: '#AAABB0',
        darkcaption: '#A4A6A8',
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#f5d061',
          500: '#d4af37',
          600: '#b8860b',
          700: '#855806',
          800: '#633e06',
        },
        brand: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#f5d061',
          500: '#d4af37',
          600: '#b8860b',
          700: '#855806',
          800: '#263C49',
          900: '#1c2d37',
          950: '#10120D',
        },
        risk: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#EF4444',
          critical: '#DC2626',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.35)',
        'gold-md': '0 4px 15px -1px rgba(212, 175, 55, 0.25)',
      }
    },
  },
  plugins: [],
};
