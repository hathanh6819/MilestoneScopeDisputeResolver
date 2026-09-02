/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#0f172a',
        'surface-elevated': '#1e293b',
        border: '#334155',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        }
      }
    },
  },
  plugins: [],
}
