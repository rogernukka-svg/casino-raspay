'use client';

import Link from 'next/link';
import Sidebar from '../components/Sidebar';

/**
 * Paleta & presets JokerPay (neón elegante)
 */
const theme = {
  heroBg:
    'radial-gradient(1200px 600px at 15% -10%, rgba(147,51,234,0.18), transparent), radial-gradient(900px 500px at 90% -20%, rgba(236,72,153,0.16), transparent), #0a0f1a',
  kpiA: 'text-violet-300 drop-shadow-[0_0_14px_rgba(168,85,247,0.25)]',
  kpiB: 'text-fuchsia-300 drop-shadow-[0_0_14px_rgba(217,70,239,0.25)]',
  ringMain: 'ring-violet-500/20 hover:ring-violet-400/30',
  ringAlt: 'ring-fuchsia-500/20 hover:ring-fuchsia-400/30',
  btnPrimary:
    'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-black shadow-[0_8px_30px_-10px_rgba(139,92,246,0.55)]',
  btnSecondary:
    'bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-black shadow-[0_8px_30px_-10px_rgba(236,72,153,0.55)]',
};

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#0a0f1a] text-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* MAIN */}
      <main className="flex-1">
        {/* separador sutil bajo el navbar */}
        <div className="sticky top-0 z-10 h-3 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

        {/* HERO */}
        <section className="relative px-6 pt-10 pb-12">
          <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.75]" style={{ background: theme.heroBg }} />
          <div className="max-w-[1200px] mx-auto">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 md:p-8 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.55)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                {/* Copy principal */}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-gray-300">
                    <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_14px_rgba(139,92,246,0.7)]" /> JokerPay
                    Secure Wallet · Provably Fair
                  </div>

                  <h1 className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                    La nueva era del <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">casino online</span>
                  </h1>

                  <p className="mt-3 text-[15px] md:text-base text-gray-300/90 max-w-xl">
                    Velocidad absurda, experiencia premium y un sistema <em>provably fair</em> impulsado por
                    la billetera segura de <strong>JokerPay</strong>.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href="/games"
                      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${theme.btnPrimary}`}
                    >
                      🎰 Entrar al Casino
                    </Link>
                    <Link
                      href="/sports"
                      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${theme.btnSecondary}`}
                    >
                      ⚽ Sports Betting
                    </Link>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-4 min-w-[280px] md:min-w-[360px]">
                  <KPI label="CASINO" value="35,697" className={theme.kpiA} sub="jugando ahora" />
                  <KPI label="SPORTS" value="12,796" className={theme.kpiB} sub="apostando ahora" />
                  <KPI label="PAYOUT 24H" value="$3.2M" className="text-emerald-300 drop-shadow-[0_0_14px_rgba(16,185,129,0.25)]" sub="en premios" />
                  <KPI label="JACKPOT" value="$178K" className="text-amber-300 drop-shadow-[0_0_14px_rgba(251,191,36,0.25)]" sub="acumulado" />
                </div>
              </div>

              {/* Buscador */}
              <div className="mt-7 grid grid-cols-1 md:grid-cols-[160px_1fr_120px] gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">Casino</div>
                <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="mr-2">🔎</span>
                  <input
                    placeholder="Busca tu juego favorito"
                    className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
                  />
                </div>
                <button
                  className="rounded-xl text-black text-sm font-semibold transition-all px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 shadow-[0_8px_30px_-10px_rgba(99,102,241,0.55)]"
                >
                  Buscar
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sección 2: bloques destacados */}
        <section className="px-6">
          <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-6">
            <Panel title="🎰 Casino" subtitle="+35,697 jugando ahora" ringClass={theme.ringMain} />
            <Panel title="⚽ Sports" subtitle="+12,796 apostando ahora" ringClass={theme.ringAlt} />
          </div>
        </section>

        {/* TRENDING GAMES */}
        <section className="px-6 py-10">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-semibold">🔥 Juegos Populares</h2>
              <Link href="/games" className="text-sm text-violet-300 hover:text-violet-200 transition-colors">
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <FancyCard title="Dice" emoji="🎲" />
              <FancyCard title="Crash" emoji="💥" />
              <FancyCard title="Slots" emoji="🎰" />
              <FancyCard title="Blackjack" emoji="🃏" />
              <FancyCard title="Roulette" emoji="🎡" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function KPI({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-[11px] uppercase tracking-wider text-gray-400">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`text-xl font-bold ${className}`}>{value}</span>
        <span className="text-xs text-gray-400">{sub}</span>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, ringClass }: { title: string; subtitle: string; ringClass: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl p-5 ring-1 ${ringClass} transition-all shadow-[0_10px_40px_-12px_rgba(0,0,0,.55)]`}
    >
      <div className="text-lg font-bold">{title}</div>
      <div className="mt-1 text-sm text-gray-300/90">{subtitle}</div>
    </div>
  );
}

function FancyCard({ title, emoji }: { title: string; emoji: string }) {
  return (
    <Link
      href="/games"
      className="group rounded-2xl overflow-hidden border border-white/10 bg-white/6 backdrop-blur hover:bg-white/10 transition-all"
    >
      <div className="h-28 flex items-center justify-center">
        <span className="text-4xl drop-shadow-[0_4px_10px_rgba(0,0,0,.35)] group-hover:scale-110 transition-transform">
          {emoji}
        </span>
      </div>
      <div className="px-3 py-2 text-center text-sm text-gray-200">{title}</div>
    </Link>
  );
}
