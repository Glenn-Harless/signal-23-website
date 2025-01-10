module.exports = {
  purge: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './src/styles/**/*.css'
  ],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        'neo-brutalist': ['Neo Brutalist', 'sans-serif'],
        'neo-brute-transparent': ['Neobrutetest', 'sans-serif'],
        'neo-brutalist4': ['NeobruteTest4', 'sans-serif'],
        'neo-brutalist5': ['NeobruteTest5', 'sans-serif'],
        'neo-brutalist6': ['NeobruteTest6', 'sans-serif'],
        'neo-brutalist7': ['NeobruteTest7', 'sans-serif'],
        'neo-brutalist8': ['NeobruteTest8', 'sans-serif'],
        'neo-brutalist9': ['NeobruteTest9', 'sans-serif'],
        'ibm-mono': ['IBM Plex Mono', 'monospace'],
        'space-mono': ['Space Mono', 'monospace'],
      },
      animation: {
        'flash': 'flash 0.5s ease-in-out infinite',
        'tear': 'tear 0.2s ease-in-out infinite',
        'scanline': 'scanline 1s linear infinite',
        'flicker': 'flicker 0.2s ease-in-out infinite',
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        tear: {
          '0%, 100%': { transform: 'translateY(0) skewY(-3deg)' },
          '50%': { transform: 'translateY(5px) skewY(-2deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  variants: {
    extend: {}
  },
  plugins: [],
}
