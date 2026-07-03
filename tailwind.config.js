/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          50: '#F0EFFF',
          100: '#E0DEFF',
          200: '#C2BDFF',
          300: '#A39CFF',
          400: '#857BFF',
          500: '#6C63FF',
          600: '#3A2EFF',
          700: '#0800F9',
          800: '#0600C6',
          900: '#050093',
        },
        secondary: {
          DEFAULT: '#FF6584',
          50: '#FFFFFF',
          100: '#FFFFFF',
          200: '#FFE5EA',
          300: '#FFBDC9',
          400: '#FF91A7',
          500: '#FF6584',
          600: '#FF2856',
          700: '#EA0035',
          800: '#B70029',
          900: '#84001E',
        },
        dark: {
          DEFAULT: '#1A1A2E',
          50: '#5F5F9E',
          100: '#565690',
          200: '#464677',
          300: '#37375D',
          400: '#282844',
          500: '#1A1A2E',
          600: '#0C0C15',
          700: '#000000',
          800: '#000000',
          900: '#000000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};