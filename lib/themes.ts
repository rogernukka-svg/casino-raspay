// lib/themes.ts

export const themes = {
  emeraldGold: {
    hero: `
      radial-gradient(1200px 600px at 20% -10%, rgba(16,185,129,0.20), transparent 50%),
      radial-gradient(1200px 600px at 80% -10%, rgba(139,92,246,0.25), transparent 50%)
    `,
    btnPrimary: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-glow",
    btnSecondary: "bg-gray-700 hover:bg-gray-600 text-white",
    kpiA: "text-emerald-400",
    kpiB: "text-cyan-400",
    panelMain: "ring-emerald-500/40",
    panelAlt: "ring-cyan-500/40",
  },

  premiumGold: {
    hero: `
      radial-gradient(1200px 600px at 20% -10%, rgba(255,215,0,0.20), transparent 50%),
      radial-gradient(1200px 600px at 80% -10%, rgba(255,140,0,0.25), transparent 50%)
    `,
    btnPrimary: "bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold shadow-[0_0_15px_rgba(255,215,0,0.5)]",
    btnSecondary: "bg-gray-800 hover:bg-gray-700 text-white border border-yellow-500/40",
    kpiA: "text-yellow-400 drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]",
    kpiB: "text-orange-400 drop-shadow-[0_0_6px_rgba(255,165,0,0.5)]",
    panelMain: "ring-yellow-400/40",
    panelAlt: "ring-orange-400/40",
  },
};
