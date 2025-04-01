/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4020e7',
        'primary-dark': '#3010d7',
        'primary-light': '#6040ff'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}