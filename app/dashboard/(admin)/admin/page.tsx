'use client';

import { useEffect, useState } from 'react';

type Status = 'loading' | 'ok';

export default function AdminPage() {
  const [houseBalance, setHouseBalance] = useState<number>(999999);
  const [status, setStatus] = useState<Status>('loading');

  const [mintAmount, setMintAmount] = useState('');
  const [mintNote, setMintNote] = useState('');
  const [mintBusy, setMintBusy] = useState(false);

  const [cashierUserId, setCashierUserId] = useState('');
  const [assignAmount, setAssignAmount] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assignBusy, setAssignBusy] = useState(false);

  const [playerEmail, setPlayerEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditBusy, setCreditBusy] = useState(false);

  // 🧩 MODO SANDBOX — sin Supabase, todo local
  useEffect(() => {
    setStatus('ok');
  }, []);

  async function submitMint(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(mintAmount);
    if (!n || n <= 0) return alert('Monto inválido');

    try {
      setMintBusy(true);

      // 💰 Simula el mint local
      await new Promise((r) => setTimeout(r, 700));
      setHouseBalance((b) => (b ?? 0) + n);

      alert(`Mint OK ✅ +${n.toLocaleString()} fichas agregadas a HOUSE\nNota: ${mintNote || '—'}`);
      setMintAmount('');
      setMintNote('');
    } catch (err: any) {
      alert(err?.message || 'Error local');
    } finally {
      setMintBusy(false);
    }
  }

  async function submitAssign(e: React.FormEvent) {
    e.preventDefault();
    alert(`Simulado ✅ Asignar ${assignAmount} a cajero ${cashierUserId}\nNota: ${assignNote}`);
    setAssignAmount('');
    setAssignNote('');
  }

  async function submitCreditUser(e: React.FormEvent) {
    e.preventDefault();
    alert(`Simulado ✅ Acreditar ${creditAmount} al jugador ${playerEmail}\nNota: ${creditNote}`);
    setCreditAmount('');
    setCreditNote('');
  }

  return (
    <div className="relative max-w-4xl mx-auto p-6 md:p-8">
      {/* fondo visual */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(60% 35% at 0% 0%, rgba(59,130,246,.18), transparent 60%), radial-gradient(60% 35% at 100% 0%, rgba(168,85,247,.18), transparent 60%)',
        }}
      />

      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
        <span className="text-white">Panel</span>{' '}
        <span className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">Admin</span>
      </h1>

      {status === 'ok' && (
        <div className="mt-8 space-y-8">
          {/* Saldo HOUSE */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)]">
            <div className="text-sm text-gray-300">Saldo HOUSE</div>
            <div className="mt-1 text-4xl font-bold tracking-tight text-white">
              {houseBalance === null ? '—' : houseBalance.toLocaleString()}
            </div>
          </div>

          {/* Mint a HOUSE */}
          <form
            onSubmit={submitMint}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)]"
          >
            <div className="text-lg font-semibold text-white">Mintear a HOUSE</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-gray-400"
                placeholder="Monto"
                type="number"
                step="0.01"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
              />
              <input
                className="md:col-span-2 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-gray-400"
                placeholder="Nota (opcional)"
                value={mintNote}
                onChange={(e) => setMintNote(e.target.value)}
              />
            </div>

            <button
              disabled={mintBusy}
              type="submit"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-black
                         bg-gradient-to-r from-cyan-300 to-fuchsia-300 hover:from-cyan-200 hover:to-fuchsia-200
                         shadow-[0_0_18px_rgba(168,85,247,.35)] disabled:opacity-60"
            >
              {mintBusy ? 'Minting…' : 'Mintear'}
            </button>
          </form>

          {/* Asignar a Cajero */}
          <form
            onSubmit={submitAssign}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)]"
          >
            <div className="text-lg font-semibold text-white">Asignar a Cajero</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-gray-400"
                placeholder="cashier_user_id (UUID)"
                value={cashierUserId}
                onChange={(e) => setCashierUserId(e.target.value)}
              />
              <input
                className="rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-gray-400"
                placeholder="Monto"
                type="number"
                step="0.01"
                value={assignAmount}
                onChange={(e) => setAssignAmount(e.target.value)}
              />
              <input
                className="rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-gray-400"
                placeholder="Nota (opcional)"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-black
                         bg-gradient-to-r from-cyan-300 to-fuchsia-300 hover:from-cyan-200 hover:to-fuchsia-200
                         shadow-[0_0_18px_rgba(34,211,238,.35)]"
            >
              {assignBusy ? 'Asignando…' : 'Asignar'}
            </button>
          </form>

          {/* Acreditar Usuario */}
          <form
            onSubmit={submitCreditUser}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)]"
          >
            <div className="text-lg font-semibold text-white">Acreditar a Usuario (por email)</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-gray-400"
                placeholder="email del jugador"
                value={playerEmail}
                onChange={(e) => setPlayerEmail(e.target.value)}
              />
              <input
                className="rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-gray-400"
                placeholder="Monto"
                type="number"
                step="0.01"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
              <input
                className="rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-gray-400"
                placeholder="Nota (opcional)"
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-black
                         bg-gradient-to-r from-fuchsia-400 to-sky-400 hover:from-fuchsia-300 hover:to-sky-300
                         shadow-[0_0_18px_rgba(99,102,241,.35)]"
            >
              {creditBusy ? 'Acreditando…' : 'Acreditar'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
