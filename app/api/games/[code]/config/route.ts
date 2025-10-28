// app/api/games/[code]/config/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('games')
      .select('code, name, type, config')
      .eq('code', params.code)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ error: 'game_not_found' }, { status: 404 });
    }

    return NextResponse.json({
      code: data.code,
      name: data.name,
      type: data.type,
      config: data.config,
    });
  } catch (err: any) {
    console.error('get game config error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
