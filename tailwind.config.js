/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep charcoal backgrounds
        charcoal: {
          900: '#0E0F11', // Very dark background
          800: '#16181C', // Card background / section background
          700: '#23272F', // Borders / subtle highlights
          600: '#323846', // Inputs / mute secondary text
          500: '#4D5668',
          400: '#7E8B9B',
        },
        // Electric blue accents
        electric: {
          500: 'var(--color-accent)', // Main primary accent
          400: 'var(--color-accent-hover)', // Light hover state
          600: 'var(--color-accent-active)', // Darker active state
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
}
