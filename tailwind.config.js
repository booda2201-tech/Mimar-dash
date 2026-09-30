/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0B4A3A',
          dark: '#073328',
          surface: '#0d5744',
          gold: '#C8A24B',
          'gold-light': '#DFC17B',
          'gold-dark': '#A98433',
          bg: '#F5F6F8',
        },
        primary: {
          DEFAULT: '#0B4A3A',
          container: '#0B4A3A',
          dark: '#003226',
        },
        secondary: {
          DEFAULT: '#C8A24B',
          container: '#ffd578',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontSize: {
        xs: ['0.78rem', { lineHeight: '1.25rem' }],
        sm: ['0.875rem', { lineHeight: '1.45rem' }],
        base: ['0.9375rem', { lineHeight: '1.6rem' }],
        lg: ['1.0625rem', { lineHeight: '1.7rem' }],
        xl: ['1.25rem', { lineHeight: '1.85rem' }],
        '2xl': ['1.5rem', { lineHeight: '2.1rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.4rem' }],
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        sans: ['Cairo', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      spacing: {
        sidebar: '292px',
        'sidebar-collapsed': '80px',
        topbar: '72px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(11, 74, 58, 0.04), 0 1px 2px -1px rgba(11, 74, 58, 0.03)',
        'card-hover': '0 4px 12px -2px rgba(11, 74, 58, 0.08), 0 2px 6px -2px rgba(11, 74, 58, 0.04)',
        modal: '0 20px 35px -10px rgba(11, 74, 58, 0.2), 0 10px 15px -5px rgba(0, 0, 0, 0.05)',
        gold: '0 8px 25px -4px rgba(200, 162, 75, 0.4)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    // Tailwind v3 has built-in RTL via logical properties when using rtl: variants
  },
};
