import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabaseServer';
import { getUserRole } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';

const bodySchema = z.object({
  toWalletId: z.string().uuid(),
  amount: z.number().finite().positive(),
  idempotencyKey: z.string().min(1).max(64),
});

type RpcTransferReturn = string;

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415, headers: noStore() });
  }

  const supabase = supabaseServer();
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore() });
  }

  const role = await getUserRole(userId);
  try { requireRole('CASHIER', role); } catch { 
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noStore() });
  }

  let body: z.infer<typeof bodySchema>;
  try { body = bodySchema.parse(await req.json()); }
  catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: err.flatten() }, { status: 400, headers: noStore() });
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: noStore() });
  }

  const { data: wallet, error: walletErr } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (walletErr) {
    return NextResponse.json({ error: 'Could not fetch cashier wallet' }, { status: 500, headers: noStore() });
  }
  if (!wallet?.id) {
    return NextResponse.json({ error: 'Cashier wallet not found' }, { status: 404, headers: noStore() });
  }

  if (wallet.id === body.toWalletId) {
    return NextResponse.json({ error: 'Cannot transfer to the same wallet' }, { status: 422, headers: noStore() });
  }

  const { data, error } = await supabase.rpc('fn_transfer', {
    p_from_wallet: wallet.id,
    p_to_wallet: body.toWalletId,
    p_amount: body.amount,
    p_idem: body.idempotencyKey,
    p_actor: userId,
  }) as { data: RpcTransferReturn | null; error: { message?: string } | null };

  if (error) {
    return NextResponse.json({ error: error.message ?? 'Transfer failed' }, { status: 400, headers: noStore() });
  }

  return NextResponse.json({ transactionId: data }, { status: 200, headers: noStore() });
}

function noStore() { return { 'Cache-Control': 'no-store, max-age=0' }; }
