/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep backgrounds
        ink: '#0a1113', // hero / deepest
        base: '#1b2127', // main page background
        panel: '#21272c', // raised panels
        'card-dark': '#262c31', // "Atualmente" neutral cards
        'card-teal': '#15282c', // teal-tinted feature cards
        footer: '#30363c', // lighter footer band
        // Brand teal
        brand: {
          DEFAULT: '#2cb2bd',
          light: '#3fc7d2',
          bright: '#2eb9c5',
          dark: '#1f8d97',
          deep: '#13585f',
        },
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1180px',
      },
      boxShadow: {
        'glow-brand': '0 0 0 1px rgba(44,178,189,0.35), 0 18px 60px -18px rgba(44,178,189,0.55)',
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
