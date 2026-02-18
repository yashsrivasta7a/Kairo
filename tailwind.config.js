// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {

        purple: {
          DEFAULT: '#3c147dff',
        },
      },
      fontFamily: {
        rm: ['Inter_400Regular', 'sans-serif'],
        md: ['Inter_500Medium', 'sans-serif'],
        sb: ['Inter_600SemiBold', 'sans-serif'],
        bd: ['Inter_700Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};