import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabaseServer';
import { diceRoll } from '@/lib/rng';

const schema = z.object({
  wager: z.number().finite().positive(),
  clientSeed: z.string().optional(),
  idempotencyKey: z.string().min(1).max(64),
});

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (err) {
    if ((err as any).issues) return NextResponse.json({ error: 'Invalid payload', details: (err as any).issues }, { status: 400 });
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .single();
  const playerWalletId = wallet?.id;
  const houseWalletId = process.env.HOUSE_WALLET_ID;

  if (!playerWalletId || !houseWalletId) {
    return NextResponse.json({ error: 'Wallet configuration error' }, { status: 500 });
  }

  // Debitar apuesta del jugador hacia la casa
  const { error: debitError } = await supabase.rpc('fn_transfer', {
    p_from_wallet: playerWalletId,
    p_to_wallet: houseWalletId,
    p_amount: body.wager,
    p_idem: body.idempotencyKey + '-bet',
    p_actor: userId,
  });
  if (debitError) return NextResponse.json({ error: debitError.message }, { status: 400 });

  const serverSeed = process.env.SERVER_SEED || '';
  const roll = diceRoll(serverSeed, body.clientSeed ?? '');
  const win = roll > 50;
  const payout = win ? body.wager * 2 : 0;

  if (win && payout > 0) {
    const { error: creditError } = await supabase.rpc('fn_transfer', {
      p_from_wallet: houseWalletId,
      p_to_wallet: playerWalletId,
      p_amount: payout,
      p_idem: body.idempotencyKey + '-payout',
      p_actor: userId,
    });
    if (creditError) return NextResponse.json({ error: creditError.message }, { status: 400 });
  }

  await supabase.from('game_rounds').insert({
    game: 'dice',
    user_id: userId,
    wager: body.wager,
    result: { roll, win, server_seed_hash: '', client_seed: body.clientSeed },
    payout,
  });

  return NextResponse.json({ roll, win, payout });
}
