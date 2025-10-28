/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta propia (fría, premium)
        brand: {
          bg:   "#0a0f1a", // fondo principal
          card: "#111827", // cartas
          soft: "#0e1624", // paneles / sidebar
          // acentos (gradiente principal)
          a: "#14b8a6",    // teal-500
          b: "#06b6d4",    // cyan-500
          c: "#8b5cf6",    // violet-500
        },
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(1200px 600px at 20% -10%, rgba(20,184,166,0.15), transparent 50%), radial-gradient(1200px 600px at 80% -10%, rgba(139,92,246,0.15), transparent 50%)",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(20,184,166,0.35), 0 6px 30px rgba(20,184,166,0.15)",
      },
      borderColor: {
        subtle: "rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};
