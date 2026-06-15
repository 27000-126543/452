/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        '2xl': '2rem',
      },
    },
    extend: {
      colors: {
        magic: {
          bg: '#0d0418',
          panel: '#1a0a2e',
          card: '#251444',
          border: '#3d2566',
          gold: '#d4af37',
          goldLight: '#f4d06f',
          goldDark: '#b8941f',
          blue: '#4fc3f7',
          blueDark: '#0288d1',
          flame: '#ff6b35',
          flameDark: '#e64a19',
          forest: '#2e7d32',
          blood: '#c62828',
          purple: '#7c3aed',
          purpleLight: '#a78bfa',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'magic-gradient': 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)',
        'gold-gradient': 'linear-gradient(135deg, #d4af37 0%, #f4d06f 50%, #d4af37 100%)',
        'rune-pattern': 'radial-gradient(circle at 20% 30%, rgba(124,58,237,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.1) 0%, transparent 50%)',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2)',
        'purple-glow': '0 0 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(124, 58, 237, 0.2)',
        'blue-glow': '0 0 15px rgba(79, 195, 247, 0.5)',
        'flame-glow': '0 0 15px rgba(255, 107, 53, 0.5)',
        'inner-magic': 'inset 0 1px 0 rgba(212, 175, 55, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'rune-spin': 'runeSpin 20s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(212, 175, 55, 0.7), 0 0 50px rgba(212, 175, 55, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        runeSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
