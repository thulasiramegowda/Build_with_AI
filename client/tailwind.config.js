/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#F8F6EF',
          sidebar: '#F3F0E6',
          card: '#FFFDF7',
          border: '#E7E1D5',
          primary: '#252923',
          secondary: '#77766E',
          accent: '#D9A62E',
          'accent-hover': '#C19022',
          'accent-light': '#FDF8EC',
          highlight: '#FAF7EE',
        },
        brand: {
          50: '#FDF8EC',
          100: '#FBEECB',
          500: '#D9A62E',
          600: '#C19022',
          700: '#9B7217',
          900: '#523A06',
        }
      }
    },
  },
  plugins: [],
}
