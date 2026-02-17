// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0D0D0D',  
          100: '#1A1A1A',       
          200: '#2A2A2A',       
          300: '#3A3A3A',       
        },
        accent: {
          DEFAULT: '#FF6B35',   
          light: '#FF8F5E',
          dark: '#CC5529',
        },
        light: {
          100: '#FFFFFF',       
          200: '#F0F0F0',       
          300: '#A0A0A0',       
        },
      },
    },
  },
  plugins: [],
};