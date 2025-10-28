'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

function randomIdem(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type WalletRow = { id: string; balance?: number | null };

export default function CashierPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<'ADMIN' | 'CASHIER' | 'PLAYER' | null>(null);
  const [wallet, setWallet] = useState<WalletRow | null>(null);

  // Formulario de acreditación
  const [toWalletId, setToWalletId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [idem, setIdem] = useState(randomIdem('credit'));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // “historial” local de esta sesión (éxitos)
  const [localOps, setLocalOps] = useState<
    { toWalletId: string; amount: number; txid: string }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      const { data: ures } = await supabase.auth.getUser();
      const user = ures?.user ?? null;
      setEmail(user?.email ?? null);

      if (user?.id) {
        // Rol
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        setRole((prof?.role as any) ?? null);

        // Wallet del cajero
        const { data: w } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', user.id)
          .single();
        if (w) setWallet(w as WalletRow);
      } else {
        setRole(null);
        setWallet(null);
      }
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleCredit() {
    setMsg(null);
    setLoading(true);
    try {
      if (!toWalletId) throw new Error('Ingresa wallet destino (UUID)');
      if (amount <= 0) throw new Error('Monto inválido');

      const res = await fetch('/api/cashier/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toWalletId,
          amount: Number(amount),
          idempotencyKey: idem || randomIdem('credit'),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'No se pudo acreditar');

      setMsg(`✅ Acreditado: ${amount} — TxID: ${json.transactionId}`);
      setLocalOps((ops) => [
        { toWalletId, amount, txid: json.transactionId },
        ...ops,
      ]);
      setIdem(randomIdem('credit'));
      setAmount(0);

      // refrescar balance
      if (wallet?.id) {
        const { data: w } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('id', wallet.id)
          .single();
        if (w) setWallet(w as WalletRow);
      }
    } catch (err: any) {
      setMsg(`❌ ${err.message || 'Error inesperado'}`);
    } finally {
      setLoading(false);
    }
  }

  if (role !== 'CASHIER') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Cajero</h1>
        <p className="opacity-70">No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel de Cajero</h1>
        <div className="text-sm opacity-80">
          {email} · <span className="px-2 py-0.5 rounded bg-gray-800 border border-white/10">CASHIER</span>
        </div>
      </div>

      {/* Resumen de wallet del cajero */}
      <section className="rounded-lg border border-white/10 bg-gray-900 p-4">
        <h2 className="text-lg font-semibold mb-2">Mi Billetera</h2>
        <div className="text-sm space-y-1">
          <div>
            <span className="opacity-60">Wallet ID: </span>
            <code className="bg-gray-800 px-2 py-0.5 rounded">
              {wallet?.id ?? '—'}
            </code>
          </div>
          <div>
            <span className="opacity-60">Balance: </span>
            <strong>{wallet?.balance ?? 0}</strong>
          </div>
        </div>
      </section>

      {/* Acreditar a jugador */}
      <section className="rounded-lg border border-emerald-500/20 bg-gray-900 p-4">
        <h2 className="text-lg font-semibold mb-4">Acreditar saldo a jugador</h2>
        {msg && (
          <div className="mb-4 rounded border border-white/10 bg-gray-800 px-3 py-2">
            {msg}
          </div>
        )}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm opacity-70">Wallet destino (UUID del jugador)</label>
            <input
              type="text"
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full mt-1 rounded bg-gray-800 border border-white/10 px-3 py-2"
              placeholder="UUID del jugador"
            />
          </div>
          <div>
            <label className="text-sm opacity-70">Monto</label>
            <input
              type="number"
              value={Number.isNaN(amount) ? 0 : amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full mt-1 rounded bg-gray-800 border border-white/10 px-3 py-2"
              min={0}
              step="0.01"
              placeholder="50"
            />
          </div>
          <div>
            <label className="text-sm opacity-70">Idempotency Key</label>
            <input
              type="text"
              value={idem}
              onChange={(e) => setIdem(e.target.value)}
              className="w-full mt-1 rounded bg-gray-800 border border-white/10 px-3 py-2"
            />
          </div>
        </div>

        <button
          onClick={handleCredit}
          disabled={loading}
          className="mt-4 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Acreditando…' : 'Acreditar'}
        </button>
      </section>

      {/* Historial (solo de esta sesión para feedback rápido) */}
      <section className="rounded-lg border border-white/10 bg-gray-900 p-4">
        <h2 className="text-lg font-semibold mb-3">Últimas operaciones (sesión)</h2>
        {localOps.length === 0 ? (
          <p className="opacity-70 text-sm">Sin operaciones aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left opacity-70">
                <tr>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Destinatario (wallet)</th>
                  <th className="py-2 pr-4">Monto</th>
                  <th className="py-2 pr-4">TxID</th>
                </tr>
              </thead>
              <tbody>
                {localOps.map((op, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="py-2 pr-4">{new Date().toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-800 px-2 py-0.5 rounded">
                        {op.toWalletId.slice(0, 10)}…
                      </code>
                    </td>
                    <td className="py-2 pr-4">{op.amount}</td>
                    <td className="py-2 pr-4">
                      <code className="bg-gray-800 px-2 py-0.5 rounded">
                        {op.txid}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
