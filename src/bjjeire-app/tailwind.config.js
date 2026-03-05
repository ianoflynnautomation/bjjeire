import { colors } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: colors.emerald,
        secondary: colors.orange,
        neutral: colors.zinc,
        success: colors.green,
        warning: colors.amber,
        danger: colors.red,
        ireland: {
          green: colors.emerald,
          orange: colors.orange,
          slate: colors.zinc,
          surface: {
            950: '#020617',
            900: '#0b1220',
            800: '#111827',
          },
          text: {
            high: '#f8fafc',
            medium: '#cbd5e1',
          },
        },
      },
      boxShadow: {
        irish: '0 14px 34px -16px rgba(16, 185, 129, 0.35)',
      },
      backgroundImage: {
        'irish-sheen': 'linear-gradient(120deg, rgba(16, 185, 129, 0.24), rgba(249, 115, 22, 0.20))',
        'irish-dark': 'linear-gradient(160deg, #020617 0%, #0b1220 45%, #052e2b 100%)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
