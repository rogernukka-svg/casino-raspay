import Image from 'next/image';

export default function HeroCard({
  title, count, img, badge,
}: { title: string; count: string; img: string; badge: string; }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-subtle bg-brand.card shadow-soft">
      <Image
        src={img}
        alt={title}
        width={1200}
        height={600}
        className="h-44 w-full object-cover opacity-90"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-brand.bg/60 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-4 flex items-center gap-3">
        <span className="rounded-md bg-black/40 px-2 py-1 text-xs">{badge}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="ml-2 text-xs text-emerald-400">• {count}</span>
      </div>
    </div>
  );
}
