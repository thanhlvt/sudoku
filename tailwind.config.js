/** @type {import('tailwindcss').Config} */

// Theme tokens live in src/index.css as space-separated RGB triplets so that both the light and the
// dark palette can be swapped with CSS variables (and `<alpha-value>` opacity modifiers still work).
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // `data-theme` on <html> wins over the OS setting; with no attribute we follow prefers-color-scheme.
  darkMode: [
    'variant',
    ['@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) & }', ':root[data-theme="dark"] &'],
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito Variable"', 'Nunito', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        page: token('c-page'),
        card: token('c-card'),
        line: token('c-line'),
        soft: token('c-soft'),
        ink: token('c-ink'),
        accent: token('c-accent'),
        primary: { DEFAULT: '#7C3AED', dark: '#5B21B6', light: '#A78BFA' },
        night: '#312E81',
        // Difficulty colours: identical in both themes, each with a darker "edge" and a lighter "ghost".
        lv1: { DEFAULT: '#15803D', edge: '#14532D', ghost: '#22A559' },
        lv2: { DEFAULT: '#0369A1', edge: '#0C4A6E', ghost: '#0A85C6' },
        lv3: { DEFAULT: '#6D28D9', edge: '#4C1D95', ghost: '#8B5CF6' },
        lv4: { DEFAULT: '#C2410C', edge: '#7C2D12', ghost: '#EA6A2A' },
        lv5: { DEFAULT: '#BE123C', edge: '#881337', ghost: '#E23A5E' },
        board: {
          line: token('b-line'),
          frame: token('b-frame'),
          cell: token('b-cell'),
          peer: token('b-peer'),
          same: token('b-same'),
          sel: token('b-sel'),
          hint: token('b-hint'),
          wrong: token('b-wrong'),
          'wrong-ink': token('b-wrong-ink'),
          user: token('b-user'),
        },
      },
      keyframes: {
        'screen-in': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '60%': { opacity: '1', transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'digit-pop': {
          '0%': { transform: 'scale(0.4)', opacity: '0.4' },
          '60%': { transform: 'scale(1.22)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(2px)' },
        },
        wave: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.16)', backgroundColor: 'rgb(var(--b-sel))' },
          '100%': { transform: 'scale(1)' },
        },
        'hint-glow': {
          '0%, 100%': { boxShadow: 'inset 0 0 0 0 rgb(245 158 11 / 0)' },
          '50%': { boxShadow: 'inset 0 0 0 3px rgb(245 158 11 / 0.9)' },
        },
        'heart-lost': {
          '0%': { transform: 'scale(1) rotate(0)' },
          '25%': { transform: 'scale(1.45) rotate(-10deg)' },
          '55%': { transform: 'scale(0.7) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0)' },
        },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-3px)' } },
        flame: {
          '0%, 100%': { transform: 'scale(1) rotate(-3deg)' },
          '50%': { transform: 'scale(1.14) rotate(4deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0)' },
          '20%': { transform: 'rotate(-14deg)' },
          '40%': { transform: 'rotate(12deg)' },
          '60%': { transform: 'rotate(-8deg)' },
          '80%': { transform: 'rotate(5deg)' },
        },
        'bar-grow': { from: { width: '0' } },
        'star-pop': {
          '0%': { opacity: '0', transform: 'scale(0) rotate(-50deg)' },
          '65%': { opacity: '1', transform: 'scale(1.3) rotate(10deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        'trophy-drop': {
          '0%': { opacity: '0', transform: 'translateY(-60px) scale(0.5)' },
          '55%': { opacity: '1', transform: 'translateY(8px) scale(1.08)' },
          '75%': { transform: 'translateY(-5px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'badge-wobble': {
          '0%, 100%': { transform: 'rotate(-3deg) scale(1)' },
          '50%': { transform: 'rotate(3deg) scale(1.06)' },
        },
        'confetti-fall': {
          '0%': { transform: 'translate3d(0, -12vh, 0) rotate(0deg)', opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translate3d(var(--drift), 108vh, 0) rotate(var(--spin))', opacity: '0.9' },
        },
        'tab-pop': {
          '0%': { transform: 'scale(0.92)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'screen-in': 'screen-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'fade-in': 'fade-in 0.2s ease-out backwards',
        'sheet-up': 'sheet-up 0.34s cubic-bezier(0.2, 0.9, 0.25, 1) backwards',
        'pop-in': 'pop-in 0.38s cubic-bezier(0.34, 1.4, 0.64, 1) backwards',
        'digit-pop': 'digit-pop 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) backwards',
        shake: 'shake 0.4s ease-in-out backwards',
        wave: 'wave 0.55s ease-in-out backwards',
        'hint-glow': 'hint-glow 1.2s ease-in-out infinite',
        'heart-lost': 'heart-lost 0.6s ease-in-out backwards',
        float: 'float 2.2s ease-in-out infinite',
        flame: 'flame 1.4s ease-in-out infinite',
        wiggle: 'wiggle 0.7s ease-in-out backwards',
        'bar-grow': 'bar-grow 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'star-pop': 'star-pop 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) backwards',
        'trophy-drop': 'trophy-drop 0.8s cubic-bezier(0.3, 0.9, 0.4, 1) backwards',
        'badge-wobble': 'badge-wobble 1.6s ease-in-out infinite',
        'tab-pop': 'tab-pop 0.22s ease-out backwards',
        'confetti-fall': 'confetti-fall 3.6s linear infinite',
      },
    },
  },
  plugins: [],
};
