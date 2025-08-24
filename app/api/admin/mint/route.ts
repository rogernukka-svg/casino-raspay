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

type RpcMintReturn = string;

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
  try { requireRole('ADMIN', role); } catch { 
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

  const { data, error } = await supabase.rpc('fn_mint', {
    p_to_wallet: body.toWalletId,
    p_amount: body.amount,
    p_idem: body.idempotencyKey,
    p_actor: userId,
  }) as { data: RpcMintReturn | null; error: { message?: string } | null };

  if (error) {
    return NextResponse.json({ error: error.message ?? 'Mint failed' }, { status: 400, headers: noStore() });
  }

  return NextResponse.json({ transactionId: data }, { status: 200, headers: noStore() });
}

function noStore() { return { 'Cache-Control': 'no-store, max-age=0' }; }
