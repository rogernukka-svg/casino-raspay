'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gift, Handshake, Gem, PenSquare, MessageCircle, ShieldCheck, Headphones,
} from 'lucide-react';

const menuItems = [
  { label: 'Promotions', href: '/promotions', icon: Gift },
  { label: 'Affiliate', href: '/affiliate', icon: Handshake },
  { label: 'VIP Club', href: '/vip', icon: Gem },
  { label: 'Blog', href: '/blog', icon: PenSquare },
  { label: 'Forum', href: '/forum', icon: MessageCircle },
  { label: 'Responsible Gambling', href: '/responsible', icon: ShieldCheck },
  { label: 'Live Support', href: '/support', icon: Headphones },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white/[0.04] backdrop-blur-xl border-r border-white/10 hidden md:flex flex-col">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Menú</h2>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-blue-300 font-medium'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* BONUS BOX */}
      <div className="m-4 rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-600/20 to-violet-700/20 p-4 text-center shadow-[0_0_25px_-8px_rgba(59,130,246,0.45)]">
        <div className="text-xs uppercase tracking-wide text-blue-300 font-semibold">Bonus</div>
        <p className="mt-1 text-sm text-gray-200">Hasta 100% en tu 1er depósito</p>
        <Link
          href="/promotions"
          className="mt-3 inline-block rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-blue-400 hover:to-violet-500 transition-all shadow-[0_0_15px_rgba(59,130,246,0.55)]"
        >
          Ver promos
        </Link>
      </div>
    </aside>
  );
}
