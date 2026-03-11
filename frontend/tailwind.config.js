/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#F5EFE2',       // warm parchment page background
        alabaster: '#261A0A',      // dark sepia — primary text
        'stone-gray': '#7A705E',   // warm mid-brown — secondary text
        burgundy: '#8B2030',       // rich crimson — error / resign
        navy: '#FAF7F2',           // warm near-white — cards / panels
        gold: '#96691A',           // deep antique gold — CTA, borders, active
        'gold-light': '#A87A28',
        'gold-dark': '#765214',
        cream: '#F0D9B5',          // chess light squares (unchanged)
        walnut: '#8B4513',         // chess dark squares (unchanged)
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
        'gold-glow': '0 0 15px rgba(150, 105, 26, 0.35)',
        'gold-glow-lg': '0 0 28px rgba(150, 105, 26, 0.55)',
        'stone': '0 4px 16px rgba(0, 0, 0, 0.10)',
        'stone-lg': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'board': '0 8px 40px rgba(0, 0, 0, 0.22), inset 0 0 0 3px #5C3A1A',
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
