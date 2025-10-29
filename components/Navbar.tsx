'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Role = 'ADMIN' | 'CASHIER' | 'USER';

export default function Navbar() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const u = data?.user ?? null;

        if (mounted) setUserEmail(u?.email ?? null);

        if (u) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', u.id)
            .maybeSingle();

          if (mounted) setRole((prof?.role as Role) ?? null);
        } else {
          if (mounted) setRole(null);
        }
      } catch (e) {
        console.error('Navbar auth/role fetch error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setRole(null);
    window.location.href = '/';
  }

  return (
    <header className="sticky top-0 z-40">
      <div
        className="
          w-full border-b border-white/10 backdrop-blur-xl
          bg-[#0b1220]/75
          [background-image:radial-gradient(60%_40%_at_0%_-20%,rgba(168,85,247,.18),transparent_60%),radial-gradient(60%_40%_at_100%_-20%,rgba(236,72,153,.18),transparent_60%)]
        "
      >
        <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* 🔥 Marca JokerPay */}
          <Link href="/" className="flex items-center gap-2 select-none">
            <div className="h-3 w-3 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
            <h1 className="text-xl font-extrabold tracking-tight">
              <span className="text-white">Joker</span>
              <span className="text-fuchsia-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]">Pay</span>
            </h1>
            <span className="ml-2 text-[11px] tracking-wider text-gray-400 border border-white/10 px-2 py-[1px] rounded-full uppercase">
              Secure • Provably Fair
            </span>
          </Link>

          {/* Links lado derecho */}
          <div className="flex items-center gap-5 text-sm font-medium">
            <Link href="/wallet" className="text-gray-200 hover:text-white transition-colors">
              Wallet
            </Link>

            <Link href="/games" className="text-gray-200 hover:text-white transition-colors">
              Games
            </Link>

            {loading ? (
              <>
                <span className="h-6 w-14 rounded bg-white/10 animate-pulse" />
                <span className="h-6 w-24 rounded bg-white/10 animate-pulse" />
              </>
            ) : (
              <>
                {role === 'ADMIN' && (
                  <Link
                    href="/dashboard/admin"
                    className="text-gray-200 hover:text-white transition-colors"
                  >
                    Admin
                  </Link>
                )}

                {role === 'CASHIER' && (
                  <Link
                    href="/dashboard/cashier"
                    className="text-gray-200 hover:text-white transition-colors"
                  >
                    Cajero
                  </Link>
                )}

                {!userEmail ? (
                  <>
                    <Link
                      href="/login"
                      className="px-3 py-1.5 rounded-md bg-white text-black font-semibold hover:bg-white/90 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="px-3 py-1.5 rounded-md border border-white/20 text-white hover:bg-white/10 transition-colors"
                    >
                      Register
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-gray-300">{userEmail}</span>
                    <button
                      onClick={logout}
                      className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
