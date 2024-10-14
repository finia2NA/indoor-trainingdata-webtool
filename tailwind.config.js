/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'oxford_blue': { DEFAULT: '#000529', 100: '#000108', 200: '#000210', 300: '#000318', 400: '#000421', 500: '#000529', 600: '#001087', 700: '#001be4', 800: '#4359ff', 900: '#a1acff' },
        'orangeweb': { DEFAULT: '#faa916', 100: '#352301', 200: '#6a4602', 300: '#9f6803', 400: '#d48b04', 500: '#faa916', 600: '#fbbb43', 700: '#fccc72', 800: '#fddda1', 900: '#feeed0' },
        'dim_gray': { DEFAULT: '#726e60', 100: '#171613', 200: '#2e2c26', 300: '#444239', 400: '#5b584c', 500: '#726e60', 600: '#918d7c', 700: '#ada99d', 800: '#c8c6bd', 900: '#e4e2de' },
        'raspberry': { DEFAULT: '#db2955', 100: '#2c0811', 200: '#590f22', 300: '#851732', 400: '#b21e43', 500: '#db2955', 600: '#e25478', 700: '#e97f99', 800: '#f1aabb', 900: '#f8d4dd' },
        'baby_powder': { DEFAULT: '#f7f7f2', 100: '#3d3d25', 200: '#79794a', 300: '#adad79', 400: '#d2d2b6', 500: '#f7f7f2', 600: '#f9f9f5', 700: '#fafaf7', 800: '#fcfcfa', 900: '#fdfdfc' }
      }
    }
  },
  plugins: [],
}