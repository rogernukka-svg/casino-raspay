// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Cliente de Supabase para ROUTE HANDLERS (App Router),
 * leyendo/escribiendo la cookie de sesión del usuario.
 * Requiere tener `middleware.ts` con createMiddlewareClient.
 */
export function supabaseServer() {
  return createRouteHandlerClient({ cookies });
}
