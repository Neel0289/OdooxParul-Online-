/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066FF',
        secondary: '#667EEA',
        accent: '#F56565',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        sm: '4px',
        md: '12px',
        lg: '16px',
      },
    },
  },
  plugins: [],
}
