'use client';
import { useState, useMemo } from 'react';

export default function RaspaySlots() {
  const [busy, setBusy] = useState(false);
  const [bet, setBet] = useState(100);
  const [nonce, setNonce] = useState(1);
  const clientSeed = useMemo(() => 'roger-raspay', []);
  const [grid, setGrid] = useState<string[][]|null>(null);
  const [wins, setWins] = useState<any[]>([]);
  const [win, setWin] = useState(0);

  async function spin() {
    setBusy(true);
    try {
      const res = await fetch('/api/games/slot/spin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          game_code: 'raspay_slots',
          bet, nonce, client_seed: clientSeed
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGrid(data.grid);
      setWins(data.wins);
      setWin(data.win);
      setNonce(nonce + 1);
    } catch (e:any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🎰 Raspay Slots</h1>

      <div className="flex items-center gap-4 mb-4">
        <label>
          Apuesta:
          <input
            type="number"
            value={bet}
            min={10}
            step={10}
            onChange={(e) => setBet(parseInt(e.target.value))}
            className="ml-2 bg-black/40 px-3 py-1 rounded"
          />
        </label>
        <button
          onClick={spin}
          disabled={busy}
          className="px-6 py-2 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 disabled:opacity-50"
        >
          {busy ? 'Girando…' : 'Girar 🎲'}
        </button>
        {win > 0 && <div className="ml-auto text-green-400 font-bold">Ganaste: {win}</div>}
      </div>

      <div className="grid grid-cols-5 gap-3 w-fit mx-auto">
        {Array.from({ length: 5 }).map((_, c) => (
          <div
            key={c}
            className="bg-black/50 rounded-xl p-2 w-28 h-52 flex flex-col gap-2 items-center justify-center"
          >
            {grid
              ? grid[c].map((s, r) => (
                  <div
                    key={r}
                    className="flex-1 flex items-center justify-center text-3xl bg-white/10 rounded-lg"
                  >
                    {s}
                  </div>
                ))
              : [0, 1, 2].map((r) => (
                  <div key={r} className="flex-1 animate-pulse bg-white/10 rounded-lg w-full" />
                ))}
          </div>
        ))}
      </div>

      <div className="mt-6">
        {wins.length
          ? wins.map((w, i) => (
              <div key={i}>
                Línea {i + 1}: {w.count}× {w.symbol} → +{w.win}
              </div>
            ))
          : 'Sin combinaciones.'}
      </div>
    </div>
  );
}
