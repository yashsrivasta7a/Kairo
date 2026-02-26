// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {

        purple: {
          DEFAULT: '#7c3aed',
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6d28d9',
          900: '#4c1d95',
        },
      },
      fontFamily: {
        dmsans: ['DMSans_400Regular', 'sans-serif'],
        'dmsans-medium': ['DMSans_500Medium', 'sans-serif'],
        'dmsans-bold': ['DMSans_700Bold', 'sans-serif'],
        rm: ['Inter_400Regular', 'sans-serif'],
        md: ['Inter_500Medium', 'sans-serif'],
        sb: ['Inter_600SemiBold', 'sans-serif'],
        bd: ['Inter_700Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};