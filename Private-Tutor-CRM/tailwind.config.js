/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elementary: '#10B981',
        middle: '#F59E0B',
        high: '#EF4444',
        academic: '#3B82F6',
      }
    },
  },
  plugins: [],
}