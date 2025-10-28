// app/games/page.tsx
import Link from "next/link";
import GameCard from "@/components/GameCard"; // ya lo tienes en /components

export const dynamic = "force-dynamic";

const GAMES = [
  {
    slug: "dice",
    title: "Dice",
    description: "Apuesta al dado: mayor/menor, rápido y transparente.",
    icon: "🎲",
  },
  // aquí luego agregas más, p. ej. crash, slots, blackjack...
  // { slug: "crash", title: "Crash", description: "...", icon: "🚀" },
];

export default function GamesHubPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Games</h1>
        <p className="text-sm text-zinc-400">
          Elige un juego para empezar. Todos son <span className="font-semibold">provably fair</span>.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((g) => (
          <Link key={g.slug} href={`/games/${g.slug}`} className="block">
            {/* Si tu GameCard acepta props title/description/icon, perfecto */}
            <GameCard title={g.title} description={g.description} icon={g.icon} />
          </Link>
        ))}
      </section>
    </main>
  );
}
