'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-800 p-4 space-y-3">
        <h2 className="font-bold text-lg">🎰 Raspay</h2>
        <nav className="flex flex-col gap-2">
          <Link href="/promotions" className="hover:text-emerald-400">Promotions</Link>
          <Link href="/vip" className="hover:text-emerald-400">VIP Club</Link>
          <Link href="/support" className="hover:text-emerald-400">Soporte</Link>
          <Link href="/affiliate" className="hover:text-emerald-400">Afiliados</Link>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1">
        {/* NAVBAR */}
        <header className="flex justify-between items-center px-6 py-4 bg-gray-800">
          <div className="flex gap-6">
            <Link href="/" className="font-bold text-xl">🎲 Raspay Casino</Link>
            <Link href="/games" className="hover:text-emerald-400">Casino</Link>
            <Link href="/sports" className="hover:text-emerald-400">Sports</Link>
          </div>
          <div className="flex gap-3">
            <Link href="/sign-in" className="px-4 py-1 bg-gray-700 rounded hover:bg-gray-600">Login</Link>
            <Link href="/register" className="px-4 py-1 bg-emerald-600 rounded hover:bg-emerald-700">Register</Link>
          </div>
        </header>

        {/* HERO */}
        <section className="px-6 py-12 text-center bg-gradient-to-r from-emerald-600/20 to-purple-700/20">
          <h1 className="text-4xl font-bold mb-2">
            World’s Smartest Online Casino 🎰
          </h1>
          <p className="opacity-80">
            Juegos rápidos, billetera segura y sistema provably fair.
          </p>
          <div className="mt-4 flex gap-4 justify-center">
            <Link href="/games" className="bg-emerald-600 px-6 py-2 rounded hover:bg-emerald-700">🎮 Casino</Link>
            <Link href="/sports" className="bg-gray-700 px-6 py-2 rounded hover:bg-gray-600">⚽ Sports</Link>
          </div>
        </section>

        {/* TRENDING GAMES */}
        <section className="px-6 py-10">
          <h2 className="text-2xl font-semibold mb-4">🔥 Juegos Populares</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { title: 'Dice Game', img: '/games/dice.png' },
              { title: 'Crash', img: '/games/crash.png' },
              { title: 'Slots', img: '/games/slots.png' },
              { title: 'Blackjack', img: '/games/blackjack.png' },
              { title: 'Roulette', img: '/games/roulette.png' },
            ].map((g) => (
              <Link key={g.title} href="/games" className="bg-gray-800 rounded overflow-hidden hover:scale-105 transition">
                <div className="h-28 bg-gray-700 flex items-center justify-center">
                  <span className="text-4xl">🎲</span>
                </div>
                <div className="p-2 text-center text-sm">{g.title}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
