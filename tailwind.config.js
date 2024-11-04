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
        'neo-brutalist-2': ['Neobrutalist2', 'Neo Brutalist'],
        'neo-brute-test': ['Neobrutetest', 'sans-serif'],
        'neo-brutalist-2-spacing': ['Neobrutalist2 closer spacing', 'sans-serif'],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};