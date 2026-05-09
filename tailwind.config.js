/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: 'var(--theme-navy, #0A0F1E)', // Uses custom var, falls back to default
        accent: 'var(--theme-accent, #00C896)' // Uses custom var, falls back to default
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}