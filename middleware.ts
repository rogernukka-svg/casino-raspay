// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Esto refresca/inserta la cookie de sesión de Supabase en cada request,
  // de modo que los Route Handlers puedan leerla.
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();

  return res;
}

// (Opcional) Limita paths si quieres. Sin matcher corre en todo el sitio.
// export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
