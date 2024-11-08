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
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};