/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep backgrounds (exact values from Figma V2)
        ink: '#12181d', // deepest — text on teal buttons
        base: '#191E23', // main page background
        panel: '#21262B', // raised panels
        'card-dark': '#32373C', // "Atualmente" neutral cards
        'card-teal': '#12464A', // teal-tinted cards
        footer: '#30363C', // lighter footer band
        // Brand teal
        brand: {
          DEFAULT: '#2FBAC6',
          light: '#3FC7D2',
          bright: '#2FBAC5',
          dark: '#25939C',
          deep: '#1C6C73',
          darkest: '#12464A',
        },
        // Neutral text grays (from Figma)
        muted: '#ABACAF',
        'muted-2': '#87898C',
        'muted-3': '#5B5F62',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1180px',
      },
      boxShadow: {
        'glow-brand': '0 0 0 1px rgba(47,186,198,0.35), 0 18px 60px -18px rgba(47,186,198,0.55)',
        card: '0 24px 60px -28px rgba(0,0,0,0.75)',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'float-slow': 'float-slow 7s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.2,1) infinite',
        shimmer: 'shimmer 2.2s infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
      },
    },
  },
  plugins: [],
}
