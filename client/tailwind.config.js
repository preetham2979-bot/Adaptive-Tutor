/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        abyss:   '#050810',
        surface: '#0D1117',
        raised:  '#161B27',
        border:  'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['"Apple Garamond"', 'Georgia', 'serif'],
        mono: ['"Apple Garamond"', 'Georgia', 'serif'],
        code: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
