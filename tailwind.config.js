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
          'neo-brutalist': ['"Neo Brutalist"', 'sans-serif'],
        },
      },
    },
    variants: {
      extend: {},
    },
    plugins: [],
  };