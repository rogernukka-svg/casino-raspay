'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function RegisterPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // si tu proyecto NO requiere verificación por email, ya tendrás sesión;
      // si requiere verificación, redirige a login con aviso.
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        router.replace('/wallet');
      } else {
        alert('Revisa tu email para confirmar la cuenta.');
        router.replace('/login');
      }
    } catch (e: any) {
      setErr(e?.message ?? 'Error al registrarte');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 shadow-[0_20px_80px_-20px_rgba(0,0,0,.6)]">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>

        <input
          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2"
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2"
          placeholder="Contraseña"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err && <div className="text-sm text-red-400">{err}</div>}

        <button
          disabled={busy}
          className="w-full px-4 py-2 rounded-md text-black font-semibold bg-gradient-to-r from-fuchsia-400 to-cyan-400 hover:from-fuchsia-300 hover:to-cyan-300 disabled:opacity-60"
          type="submit"
        >
          {busy ? 'Creando…' : 'Registrarme'}
        </button>
      </form>
    </div>
  );
}
