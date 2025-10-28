'use client';

import Link from 'next/link';

export default function GameCard({
  title,
  icon,
  href = '/games',
}: {
  title: string;
  icon: string; // puedes pasar emoji o un componente
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5
                 hover:bg-white/10 transition-all shadow-[0_6px_30px_-14px_rgba(0,0,0,.45)]"
    >
      <div className="h-28 flex items-center justify-center">
        <span className="text-4xl group-hover:scale-110 transition-transform">{icon}</span>
      </div>
      <div className="px-3 py-2 text-center text-sm text-gray-200">{title}</div>
    </Link>
  );
}
