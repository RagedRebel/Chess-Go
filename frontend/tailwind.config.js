/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0D0D0D',       // primary background
        alabaster: '#E8E2D6',      // parchment white — text & light surfaces
        'stone-gray': '#7A746A',   // muted secondary text
        burgundy: '#9B3A4A',       // error / resign accents
        navy: '#141B2D',           // midnight navy — cards / sections
        gold: '#C5A059',           // antique gold — CTA, borders, active
        'gold-light': '#D4B472',
        'gold-dark': '#A8893A',
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
        'gold-glow': '0 0 15px rgba(197, 160, 89, 0.45)',
        'gold-glow-lg': '0 0 28px rgba(197, 160, 89, 0.65)',
        'stone': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'stone-lg': '0 8px 32px rgba(0, 0, 0, 0.65)',
        'board': '0 8px 40px rgba(0, 0, 0, 0.6), inset 0 0 0 3px #5C3A1A',
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
