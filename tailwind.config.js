/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Retro Computer Theme
        retro: {
          primary: '#00ff00',  // Classic green terminal
          background: '#000000',
          text: '#33ff33',
          accent: '#004400'
        },
        // Christmas Theme
        christmas: {
          primary: '#ff0000',  // Christmas red
          secondary: '#006400', // Christmas green
          background: '#ffffff',
          accent: '#ffd700'    // Gold
        }
      },
      fontFamily: {
        retro: ['VT323', 'monospace'],
        christmas: ['Mountains of Christmas', 'cursive']
      }
    }
  },
  plugins: [],
}
