/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          blue: {
            DEFAULT: '#002147',
            light: '#003366',
            dark: '#001a38',
          },
          gold: {
            DEFAULT: '#FFD700',
            light: '#FFE033',
            dark: '#CCAC00',
          },
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#002147', // Midnight Blue
          600: '#001a38',
          700: '#00142d',
          800: '#000f22',
          900: '#000a17',
          950: '#00050c',
        },
        accent: {
          DEFAULT: '#FFD700', // Gold
          hover: '#CCAC00',
        }
      },
    },
  },
  plugins: [],
}
