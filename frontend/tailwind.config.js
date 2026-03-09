/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fff1f0',
          100: '#ffe0db',
          200: '#ffc5bc',
          300: '#ff9e90',
          400: '#ff6b57',
          500: '#ff3d24',
          600: '#ed1f0a',
          700: '#c81508',
          800: '#a5160d',
          900: '#881912',
        },
        dark: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a24',
          600: '#22222f',
          500: '#2d2d3d',
          400: '#3d3d52',
          300: '#5a5a75',
          200: '#8888a0',
          100: '#b8b8cc',
        },
        neon: {
          green: '#00ff88',
          blue:  '#00d4ff',
          pink:  '#ff00aa',
          yellow: '#ffee00',
        }
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'cursor-blink': 'cursorBlink 1s step-end infinite',
        'progress-glow': 'progressGlow 2s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'count-down': 'countDown 1s ease-in-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        progressGlow: {
          '0%, 100%': { boxShadow: '0 0 6px rgba(255,61,36,0.4)' },
          '50%': { boxShadow: '0 0 16px rgba(255,61,36,0.8)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        countDown: {
          '0%': { transform: 'scale(2)', opacity: '0' },
          '50%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.5)', opacity: '0' },
        }
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,61,36,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,61,36,0.03) 1px, transparent 1px)',
        'radial-glow': 'radial-gradient(ellipse at center, rgba(255,61,36,0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      }
    },
  },
  plugins: [],
}
