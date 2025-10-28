// components/Brand.tsx
import Link from "next/link";

export default function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="RasPay">
      {/* Isotipo minimal (pulso sutil) */}
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/60 to-violet-500/60 blur-[8px] opacity-40 group-hover:opacity-70 transition-opacity" />
        <span className="relative h-7 w-7 rounded-full bg-[#0f172a] ring-1 ring-white/15 grid place-items-center">
          <span className="h-2 w-2 rounded-full bg-white/90 shadow-[0_0_10px_2px_rgba(255,255,255,.45)]" />
        </span>
      </span>

      {/* Wordmark: “Ras” blanco + “Pay” gradiente con contorno */}
      <div className="leading-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-white/95">
            Ras
            <span className="relative ml-1 bg-gradient-to-r from-white to-white bg-clip-text text-transparent">
              {/* el espacio mantiene el kerning antes del “Pay” */}
            </span>
            <span
              className="relative ml-1 text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 bg-clip-text
                         drop-shadow-[0_2px_12px_rgba(99,102,241,.35)]"
            >
              Pay
              {/* highlight inferior fino */}
              <i className="pointer-events-none absolute -bottom-[6px] left-0 right-0 h-[2px]
                             bg-gradient-to-r from-transparent via-blue-400/60 to-transparent
                             opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </span>

          {/* badge “chip” de vidrio */}
          <span className="hidden sm:inline rounded-full px-2 py-0.5 text-[10px] font-semibold
                           bg-white/[.06] backdrop-blur-md border border-white/10
                           text-white/80 tracking-wider">
            SECURE • PROVABLY FAIR
          </span>
        </div>

        {/* línea micro-neón (muy sutil) */}
        <span className="block h-[1px] w-24 mt-1 bg-gradient-to-r from-white/70 via-blue-400/70 to-violet-500/70
                         opacity-50 group-hover:opacity-80 transition-opacity" />
      </div>
    </Link>
  );
}
