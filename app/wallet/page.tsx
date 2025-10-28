'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type TxKind = 'MINT' | 'ASSIGN' | 'TRANSFER' | 'BET' | 'PAYOUT';

type Tx = {
  id: number;
  created_at: string;
  kind: TxKind;
  amount: string | number;
  from_wallet: string | null;
  to_wallet: string | null;
  note: string | null;
};

export default function WalletPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [walletId, setWalletId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const humanAmount = (a: string | number) =>
    Number(a ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setErrorMsg('Copiado ✅');
      setTimeout(() => setErrorMsg(null), 1500);
    } catch {
      setErrorMsg('No se pudo copiar');
      setTimeout(() => setErrorMsg(null), 2000);
    }
  };

  async function loadAll() {
    setRefreshing(true);
    setErrorMsg(null);
    try {
      // 1) sesión
      const { data: s, error: eS } = await supabase.auth.getUser();
      if (eS) throw eS;
      const uid = s?.user?.id;

      if (!uid) {
        // no logueado
        setWalletId(null);
        setBalance(null);
        setTxs([]);
        return;
      }

      // 2) tu wallet
      const { data: w, error: eW } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', uid)
        .maybeSingle();

      if (eW) throw eW;

      if (!w?.id) {
        setErrorMsg('Aún no tienes wallet. Vuelve a entrar luego.');
        setWalletId(null);
        setBalance(null);
        setTxs([]);
        return;
      }

      setWalletId(w.id);
      setBalance(Number(w.balance ?? 0));

      // 3) transacciones (últimas 30 donde participa tu wallet)
      const { data: t, error: eT } = await supabase
        .from('transactions')
        .select('id, created_at, kind, amount, from_wallet, to_wallet, note')
        .or(`from_wallet.eq.${w.id},to_wallet.eq.${w.id}`)
        .order('id', { ascending: false })
        .limit(30);

      if (eT) throw eT;
      setTxs(t ?? []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error cargando wallet');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();

    // recarga cuando cambia el estado de auth (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadAll();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return <div className="p-6">Cargando…</div>;
  }

  if (!walletId) {
    // estado sin sesión o sin wallet
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Mi Wallet</h1>
        <p className="text-gray-300">
          Inicia sesión para ver tu wallet y movimientos.
        </p>
        {errorMsg && (
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
            {errorMsg}
          </div>
        )}
        <a
          href="/login"
          className="inline-block px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10"
        >
          Ir a Login
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-yellow-300 drop-shadow">Mi Wallet</h1>
        <button
          onClick={loadAll}
          disabled={refreshing}
          className="px-3 py-1.5 rounded-md text-sm bg-gray-800 hover:bg-gray-700 border border-white/10 disabled:opacity-60"
        >
          {refreshing ? 'Actualizando…' : 'Refrescar'}
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Card Wallet */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-gray-300">Wallet ID</div>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <code className="text-xs md:text-sm text-gray-200 bg-black/40 rounded px-2 py-1">
            {walletId}
          </code>
          <button
            onClick={() => copy(walletId)}
            className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-white/10"
          >
            Copiar
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-300">Saldo</div>
        <div className="text-3xl font-semibold mt-1 text-yellow-300">
          {balance === null ? '—' : humanAmount(balance)}
        </div>
      </div>

      {/* Transacciones */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-4 text-lg font-semibold">Movimientos</div>
        <div className="border-t border-white/10">
          {txs.length === 0 ? (
            <div className="p-4 text-gray-400">Sin movimientos aún.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {txs.map((tx) => {
                const isIn = tx.to_wallet === walletId;
                const sign = isIn ? '+' : '-';
                return (
                  <li key={tx.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium">{tx.kind}</span>{' '}
                        <span className={isIn ? 'text-green-400' : 'text-red-400'}>
                          {isIn ? '↘ ingreso' : '↗ egreso'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(tx.created_at).toLocaleString()} — {tx.note || '—'}
                      </div>
                    </div>
                    <div
                      className={`text-base font-semibold ${
                        isIn ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {sign} {humanAmount(tx.amount)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Tu wallet se crea automáticamente al registrarte. Compartí tu <b>Wallet ID</b> con un cajero para recibir saldo.
      </p>
    </div>
  );
}
