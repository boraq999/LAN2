/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5b68f5',
          dark: '#4a56d4',
        },
        dark: {
          bg: '#1a1d29',
          card: '#252836',
          hover: '#2d3142',
        },
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
