/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        legal: {
          cream: '#fbf7ef',
          dark: '#24252d',
          teal: '#a1c5c1',
          orange: '#ff7300',
          border: '#e2e0dc',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
