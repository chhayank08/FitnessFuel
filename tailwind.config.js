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
        surface: {
          base: '#0D0D18',
          1: '#14141F',
          2: '#1B1B2A',
          3: '#232336',
          line: 'rgba(255,255,255,0.06)',
          'line-strong': 'rgba(255,255,255,0.12)',
        },
        success: {
          DEFAULT: '#34D399',
          400: '#4AE3AC',
          500: '#34D399',
          600: '#10B981',
        },
        hydration: {
          DEFAULT: '#38BDF8',
          400: '#5CCBFA',
          500: '#38BDF8',
          600: '#0EA5E9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 24px -6px rgba(108,99,255,0.5)',
        'glow-success': '0 0 24px -6px rgba(52,211,153,0.5)',
        'glow-hydration': '0 0 24px -6px rgba(56,189,248,0.5)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'card-sheen': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 40%)',
        'primary-gradient': 'linear-gradient(135deg, #857BFF 0%, #6C63FF 50%, #5147E5 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.85)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};