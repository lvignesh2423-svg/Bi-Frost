/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0c0c14',
          800: '#111119',
          700: '#181822',
          600: '#1e1e2a',
          500: '#262636',
        },
        accent: {
          blue: '#037dd6',
          purple: '#7c3aed',
          pink: '#e040fb',
          green: '#00d091',
          orange: '#f6851b',
        },
      },
      fontFamily: {
        heading: ['DM Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.5)',
        'glow-blue': '0 0 30px rgba(3, 125, 214, 0.25)',
        'glow-purple': '0 0 30px rgba(124, 58, 237, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
}
