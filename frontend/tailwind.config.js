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
          50: '#e6eaf0',
          100: '#ccd5e0',
          200: '#99abca',
          300: '#6681b4',
          400: '#33579e',
          500: '#002d88',
          600: '#002470',
          700: '#001b58',
          800: '#001240',
          900: '#000928',
        },
      },
      keyframes: {
        drive: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        truck: {
          '0%': { left: '5%' },
          '100%': { left: '85%' },
        },
      },
      animation: {
        drive: 'drive 20s linear infinite',
        truck: 'truck 10s linear infinite',
      },
    },
  },
  plugins: [],
}
