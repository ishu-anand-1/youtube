/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#08070D',
        surface: {
          DEFAULT: '#100D18',
          hover: '#171220',
          muted: '#130F1D',
          elevated: '#1A1426',
          card: 'rgba(16, 13, 24, 0.75)',
        },
        blossom: {
          DEFAULT: '#E9A7D4',
          hover: '#D891C3',
          light: '#F5C8E6',
          glow: 'rgba(233, 167, 212, 0.25)',
        },
        lavender: {
          DEFAULT: '#C7A6FF',
          hover: '#B38BF5',
          light: '#E1CFFF',
          glow: 'rgba(199, 166, 255, 0.25)',
        },
        text: {
          primary: '#F8F3FA',
          secondary: '#B7ACBF',
          muted: '#7E7385',
        },
        accent: {
          DEFAULT: '#E9A7D4',
          hover: '#D891C3',
          glow: 'rgba(233, 167, 212, 0.25)',
        },
        border: 'rgba(233, 167, 212, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'blossom-sm': '0 0 15px -3px rgba(233, 167, 212, 0.2)',
        'blossom-md': '0 0 25px -5px rgba(233, 167, 212, 0.3)',
        'blossom-lg': '0 10px 40px -10px rgba(233, 167, 212, 0.35)',
        'lavender-glow': '0 0 25px -5px rgba(199, 166, 255, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
