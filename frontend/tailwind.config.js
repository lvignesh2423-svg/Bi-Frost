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
          900: '#080812',
          800: '#0a0a14',
          700: '#0f0f1a',
          600: '#141421',
          500: '#1a1a2e',
        },
        mm: {
          green: '#baf24a',
          'green-light': '#e5ffc3',
          'green-dark': '#013330',
          blue: '#89b0ff',
          'blue-light': '#cce7ff',
          'blue-dark': '#190066',
          purple: '#d075ff',
          'purple-light': '#eac2ff',
          'purple-dark': '#2d004d',
          orange: '#f8893a',
          'orange-light': '#ffd4b8',
          'orange-dark': '#7a2e00',
        },
        muted: {
          400: '#3f3f4f',
          500: '#52525b',
        },
        light: {
          100: '#f8f9fa',
          200: '#e9ecef',
        },
      },
      fontFamily: {
        heading: ['DM Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 30px rgba(186, 242, 74, 0.15)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.25)',
        'inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
        'bento': '0 20px 60px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        lg: 'calc(var(--radius) + 4px)',
        md: 'calc(var(--radius) + 2px)',
        sm: 'calc(var(--radius))',
      },
      animation: {
        'accordion-down': '0.2s ease-out',
        'accordion-up': '0.2s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'slide-in': 'slideIn 0.6s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'shimmer': 'shimmer 3s infinite',
        'gradient': 'gradientShift 8s ease infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        shimmer: {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
    plugins: [],
  },
}