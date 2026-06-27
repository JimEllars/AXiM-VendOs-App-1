/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'axim-black': '#0A0A0C',
        'axim-charcoal': '#16161A',
        'axim-steel': '#2A2C35',
        'axim-emerald': '#00E5A3',
        'axim-gold': '#D4AF37',
        'axim-platinum': '#E5E7EB',
        'axim-crimson': '#FF3B30',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}