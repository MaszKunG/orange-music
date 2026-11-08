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
          300: 'var(--theme-accent-light, #FFA42B)',
          400: 'rgb(var(--theme-accent-hover-rgb, 255 154 60) / <alpha-value>)',
          500: 'rgb(var(--theme-accent-rgb, 255 122 0) / <alpha-value>)', // Dynamic Theme Accent
          600: 'rgb(var(--theme-accent-dark-rgb, 224 105 0) / <alpha-value>)',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          DEFAULT: 'rgb(var(--theme-accent-rgb, 255 122 0) / <alpha-value>)',
          light: 'var(--theme-accent-hover, #FF9A3C)',
          glow: 'var(--theme-accent-glow, #FFA42B)',
          dark: 'var(--theme-accent-dark, #E06900)'
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
        'glow-orange': '0 0 25px var(--theme-accent-glow, rgba(255, 122, 0, 0.45))',
        'glow-orange-sm': '0 0 12px var(--theme-accent-glow-sm, rgba(255, 122, 0, 0.35))',
        'inset-pill': 'rgb(18,18,18) 0px 1px 0px, rgb(60,60,60) 0px 0px 0px 1px inset'
      },
      fontFamily: {
        sans: ['Kanit', 'Prompt', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
