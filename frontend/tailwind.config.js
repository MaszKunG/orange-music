/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF7A00', // Orange Brand Main
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          DEFAULT: '#FF7A00',
          light: '#FF9A3C',
          glow: '#FFA42B',
          dark: '#E06900'
        },
        dark: {
          base: '#121212',     // Level 0 Base background
          surface: '#181818',  // Level 1 Cards & Panels
          card: '#1F1F1F',     // Level 2 Interactive cards
          elevated: '#282828', // Level 3 Popovers, Modals
          border: '#333333',
          borderSubtle: '#222222'
        },
        text: {
          main: '#FFFFFF',
          sub: '#B3B3B3',
          muted: '#7C7C7C'
        }
      },
      boxShadow: {
        'dialog': 'rgba(0,0,0,0.6) 0px 8px 24px',
        'card': 'rgba(0,0,0,0.3) 0px 8px 8px',
        'glow-orange': '0 0 25px rgba(255, 122, 0, 0.45)',
        'glow-orange-sm': '0 0 12px rgba(255, 122, 0, 0.35)',
        'inset-pill': 'rgb(18,18,18) 0px 1px 0px, rgb(60,60,60) 0px 0px 0px 1px inset'
      },
      fontFamily: {
        sans: ['Kanit', 'Prompt', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
