// components/LogoMark.tsx
export default function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rp-dot" cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#93c5fd" />
          <stop offset="1" stopColor="#8b5cf6" />
        </radialGradient>
        <filter id="rp-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#0f172a" stroke="url(#rp-dot)" strokeWidth="2" />
      <g filter="url(#rp-glow)">
        <path d="M20 42V20h14c6 0 10 4 10 10s-4 10-10 10h-6v2h-8Zm8-10h6c2.7 0 4-1.8 4-4s-1.3-4-4-4h-6v8Z" fill="url(#rp-dot)" />
      </g>
    </svg>
  );
}
