import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { wager, clientSeed, idempotencyKey } = await req.json();

    if (!wager || Number(wager) <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return NextResponse.json({ error: 'Falta idempotencyKey' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 400 });
    }
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Llamamos al RPC que ejecuta la apuesta de manera atómica en Postgres
    const { data, error } = await supabase.rpc('fn_game_dice_simple', {
      p_user: user.id,
      p_wager: Number(wager),
      p_client_seed: clientSeed ?? null,
      p_idem: idempotencyKey,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // El RPC devuelve { roll, win, payout }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
