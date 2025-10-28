// app/api/games/list/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('games')
      .select('code, name, type, config, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ games: data || [] });
  } catch (err: any) {
    console.error('list games error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
