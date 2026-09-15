import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class' as const,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        fashion: {
          pink: '#f093fb',
          purple: '#764ba2',
          blue: '#667eea',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-left': 'slideInLeft 0.5s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        'spin-slow': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        'pulse-slow': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-fashion': 'linear-gradient(to right, #f093fb 0%, #f5576c 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        'gradient-luxury': 'linear-gradient(to right, #c6426e 0%, #642b73 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
