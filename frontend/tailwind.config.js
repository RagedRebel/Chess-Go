/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        alabaster: '#F5F0E8',
        'stone-gray': '#8C8C8C',
        burgundy: '#6B2737',
        navy: '#1B2A4A',
        gold: '#D4AF37',
        'gold-light': '#E8C84A',
        'gold-dark': '#B8962E',
        cream: '#F0D9B5',
        walnut: '#8B4513',
        mahogany: '#5C1A1B',
        'light-square': '#F0D9B5',
        'dark-square': '#8B4513',
        'board-border': '#5C3A1A',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        playfair: ['Playfair Display', 'serif'],
        garamond: ['EB Garamond', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.4)',
        'gold-glow-lg': '0 0 25px rgba(212, 175, 55, 0.6)',
        'stone': '0 4px 16px rgba(0, 0, 0, 0.2)',
        'stone-lg': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'board': '0 8px 40px rgba(0, 0, 0, 0.35), inset 0 0 0 3px #5C3A1A',
      },
      transitionTimingFunction: {
        'dignified': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 400ms ease-in-out',
        'slide-up': 'slide-up 350ms ease-in-out',
      },
    },
  },
  plugins: [],
};
