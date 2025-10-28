// components/Nav.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Role = 'ADMIN' | 'CASHIER' | 'PLAYER' | null;

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={[
        'px-3 py-1.5 rounded-md text-sm transition-all',
        active
          ? 'text-black bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_14px_rgba(255,215,0,.35)]'
          : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial + suscripción
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        // 1) Sesión rápida
        const { data: sess } = await supabase.auth.getSession();
        const user = sess.session?.user ?? null;

        if (!user) {
          if (!mounted) return;
          setEmail(null);
          setRole(null);
          return;
        }

        // 2) Email
        if (mounted) setEmail(user.email ?? null);

        // 3) Rol (si falla, PLAYER por defecto)
        try {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          if (mounted) setRole((data?.role as Role) ?? 'PLAYER');
        } catch {
          if (mounted) setRole('PLAYER');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b1220b3] backdrop-blur border-b border-white/10">
      <div className="h-[2px] w-full bg-gradient-to-r from-yellow-400/70 via-yellow-500/50 to-yellow-400/70" />
      <div className="mx-auto max-w-[1400px] h-14 px-4 md:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-semibold tracking-wide hover:text-white text-yellow-300 drop-shadow-[0_0_10px_rgba(255,215,0,.35)]"
          >
            🎰 Raspay Casino
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/" active={pathname === '/'}>Home</NavLink>
            <NavLink href="/dashboard" active={pathname?.startsWith('/dashboard')}>Dashboard</NavLink>
            <NavLink href="/games" active={pathname?.startsWith('/games')}>Games</NavLink>
            <NavLink href="/wallet" active={pathname?.startsWith('/wallet')}>Wallet</NavLink>
            {role === 'ADMIN' && <NavLink href="/dashboard/admin" active={pathname?.startsWith('/dashboard/admin')}>Admin</NavLink>}
            {role === 'CASHIER' && <NavLink href="/dashboard/cashier" active={pathname?.startsWith('/dashboard/cashier')}>Cashier</NavLink>}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Si está cargando, no mostramos nada molesto */}
          {loading ? null : email ? (
            <>
              {role && (
                <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-md border border-yellow-500/40 text-yellow-300 bg-black/30">
                  {role}
                </span>
              )}
              <span className="hidden sm:inline text-sm text-gray-300">{email}</span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700 border border-white/10"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="px-3 py-1.5 rounded-md text-sm bg-gray-800 hover:bg-gray-700 border border-white/10">
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-3.5 py-1.5 rounded-md text-sm font-semibold text-black
                           bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700
                           shadow-[0_0_14px_rgba(255,215,0,.35)]"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
