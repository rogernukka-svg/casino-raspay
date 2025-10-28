// app/login/page.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function LoginPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);
    if (error) {
      setErr(error.message || 'Error al iniciar sesión');
      return;
    }
    // ✅ Sesión creada en COOKIES (auth-helpers)
    window.location.href = '/';
  }

  async function logout() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    window.location.reload();
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0b1220] text-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Lado izquierdo: branding / métricas */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f1a33] to-[#0b1220] p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30"
              style={{
                background:
                  'radial-gradient(90px 90px at 30% 30%, rgba(59,130,246,.35), transparent), radial-gradient(120px 120px at 70% 60%, rgba(236,72,153,.35), transparent)',
              }}
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
              RasPay Secure • Provably Fair
            </span>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight">
              Bienvenido a{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
                RasPay
              </span>
            </h1>
            <p className="mt-2 text-gray-300/90">
              Ingresá para manejar tu billetera, recibir créditos del cajero y acceder al casino con un look &amp; feel futurista.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-400">Uptime</div>
                <div className="mt-1 text-2xl font-semibold text-indigo-300">99.99%</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-400">Jackpot</div>
                <div className="mt-1 text-2xl font-semibold text-fuchsia-300">$178K</div>
              </div>
            </div>
          </div>

          {/* Lado derecho: formulario */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)]">
            <h2 className="text-xl font-semibold">Iniciar sesión</h2>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@dominio.com"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none placeholder:text-gray-500 focus:border-cyan-400/60"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-300">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 pr-16 outline-none placeholder:text-gray-500 focus:border-cyan-400/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300 hover:bg-white/10"
                  >
                    {showPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {err && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-2 w-full rounded-lg px-4 py-2 font-semibold text-black shadow-md transition-all disabled:opacity-60
                           bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 hover:from-fuchsia-300 hover:via-violet-300 hover:to-cyan-300"
              >
                {busy ? 'Entrando…' : 'Entrar'}
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full rounded-lg px-4 py-2 mt-2 text-sm bg-white/10 hover:bg-white/15"
              >
                Cerrar sesión
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-300">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline">
                Regístrate
              </Link>
            </div>

            <p className="mt-6 text-center text-[11px] text-gray-400">
              Seguridad de nivel bancario • 2FA pronto • Encriptación AES-256
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
