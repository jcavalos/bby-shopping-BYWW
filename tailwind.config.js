/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FBF7F0',
        ink: '#22302D',
        primary: '#2F6F62',
        primarydark: '#1E4A40',
        accent: '#E8935A',
        accentsoft: '#F6D9BF',
        line: '#D8CFC0',
        danger: '#C1553F',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
