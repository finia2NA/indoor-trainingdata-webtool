// https://coolors.co/000529-faa916-726e60-d7263d-bdd5ea

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg': { DEFAULT: '#000529', 100: '#000108', 200: '#000210', 300: '#000318', 400: '#000421', 500: '#000529', 600: '#001087', 700: '#001be4', 800: '#4359ff', 900: '#a1acff' },
        'primary': { DEFAULT: '#faa916', 100: '#352301', 200: '#6a4602', 300: '#9f6803', 400: '#d48b04', 500: '#faa916', 600: '#fbbb43', 700: '#fccc72', 800: '#fddda1', 900: '#feeed0' },
        'inactive': { DEFAULT: '#726e60', 100: '#171613', 200: '#2e2c26', 300: '#444239', 400: '#5b584c', 500: '#726e60', 600: '#918d7c', 700: '#ada99d', 800: '#c8c6bd', 900: '#e4e2de' },
        'danger': { DEFAULT: '#d7263d', 100: '#2b080c', 200: '#570f19', 300: '#821725', 400: '#ad1f32', 500: '#d7263d', 600: '#e05265', 700: '#e87d8b', 800: '#f0a8b2', 900: '#f7d4d8' },
        // 'baby_powder': { DEFAULT: '#f7f7f2', 100: '#3d3d25', 200: '#79794a', 300: '#adad79', 400: '#d2d2b6', 500: '#f7f7f2', 600: '#f9f9f5', 700: '#fafaf7', 800: '#fcfcfa', 900: '#fdfdfc' },
        'secondary': { DEFAULT: '#bdd5ea', 100: '#142c40', 200: '#295881', 300: '#3d83c1', 400: '#7dacd6', 500: '#bdd5ea', 600: '#cadeee', 700: '#d7e6f3', 800: '#e5eef7', 900: '#f2f7fb' }
      }
    }
  },
  plugins: [],
}