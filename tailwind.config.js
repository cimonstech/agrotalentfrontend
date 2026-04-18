/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: '#0D3320',
        brand: '#1A6B3C',
        gold: '#C8963E',
        cream: '#F7F3EC',
        bark: '#3D2B1F',
        primary: '#1f7a4d',
        accent: '#C9A227',
        'accent-gold': '#d4af37',
        secondary: '#C9A227',
        'background-light': '#f6f8f7',
        'background-dark': '#131f19',
      },
      fontFamily: {
        ubuntu: ['var(--font-ubuntu)', 'sans-serif'],
        sans: ['var(--font-ubuntu)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
