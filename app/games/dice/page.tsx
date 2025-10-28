'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Result = { roll: number; win: boolean; payout: number };

export default function DiceGamePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState<string | null>(null);
  const [wager, setWager] = useState<number>(1);
  const [clientSeed, setClientSeed] = useState<string>('');
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });
  }, [supabase]);

  async function bet() {
    setErr(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/games/dice/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wager: Number(wager),
          clientSeed: clientSeed || undefined,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error en la apuesta');
      setResult(data as Result);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">🎲 Dice</h1>

      {!email && (
        <p className="mb-4 text-zinc-400">
          Debes <a className="underline text-emerald-400" href="/login">iniciar sesión</a> para jugar.
        </p>
      )}

      <div className="bg-gray-800 p-4 rounded space-y-3 shadow">
        <div>
          <label className="text-sm opacity-80">Apuesta (monto)</label>
          <input
            type="number"
            min={1}
            step="1"
            value={wager}
            onChange={(e) => setWager(Number(e.target.value))}
            className="mt-1 w-full bg-gray-900 p-2 rounded"
          />
        </div>

        <div>
          <label className="text-sm opacity-80">Client Seed (opcional)</label>
          <input
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            placeholder="tu-seed"
            className="mt-1 w-full bg-gray-900 p-2 rounded"
          />
        </div>

        <button
          disabled={!email || loading}
          onClick={bet}
          className="w-full bg-emerald-600 rounded py-2 font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Lanzando…' : 'Lanzar'}
        </button>

        {err && <p className="text-red-400">{err}</p>}
        {result && (
          <div className="mt-3 bg-gray-900 p-3 rounded space-y-1">
            <p>🎯 Roll: <b>{result.roll}</b></p>
            <p>🏆 Ganaste: <b>{result.win ? 'Sí' : 'No'}</b></p>
            <p>💰 Pago: <b>{result.payout}</b></p>
          </div>
        )}
      </div>
    </div>
  );
}
