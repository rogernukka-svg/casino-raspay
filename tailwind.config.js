/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          bg: "#0e1525",
          neon: "#00e5ff",
          gold: "#f5c542",
          green: "#00d084"
        }
      }
    },
  },
  plugins: [],
};
