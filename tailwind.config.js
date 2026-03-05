/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        care: {
          primary: '#1a1a2e',
          secondary: '#16213e',
          accent: '#0f3460',
          text: '#e94560',
        },
      },
    },
  },
  plugins: [],
}
