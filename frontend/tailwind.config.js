// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: "#8B4513", light: "#A0522D", dark: "#6B3410" },
        accent:    { DEFAULT: "#D4A853", light: "#E8C07A" },
        surface:   "#FDF8F0",
      },
      fontFamily: {
        sans:  ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
