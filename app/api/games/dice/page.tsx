// app/games/page.tsx
import Link from "next/link";

type Game = { href: string; title: string; desc: string };

export default function GamesIndex() {
  const games: Game[] = [
    { href: "/games/dice", title: "Dice", desc: "Apuesta a que el roll sea > target." },
    // Ejemplos para futuro:
    // { href: "/games/coinflip", title: "Coin Flip", desc: "Cara o cruz provably fair." },
    // { href: "/games/crash", title: "Crash", desc: "Súbete antes de que explote." },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Juegos</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="rounded-xl border border-zinc-800 p-4 hover:bg-zinc-900 transition-colors"
          >
            <div className="text-lg font-medium">{g.title}</div>
            <div className="text-sm text-zinc-400">{g.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
