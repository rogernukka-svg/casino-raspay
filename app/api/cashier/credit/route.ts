import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { to_wallet, amount, note } = await req.json();
    if (!to_wallet) return NextResponse.json({ error: 'to_wallet requerido' }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });

    const supabase = supabaseServer();

    // user actual (cajero)
    const { data: s } = await supabase.auth.getUser();
    const user = s?.user;
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    // wallet del cajero
    const { data: cw, error: eW } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (eW || !cw?.id) return NextResponse.json({ error: 'Wallet de cajero no encontrada' }, { status: 400 });

    const idem = `credit-${to_wallet}-${Date.now()}`;

    const { data, error } = await supabase.rpc('fn_transfer', {
      p_from: cw.id,
      p_to: to_wallet,
      p_amount: Number(amount),
      p_kind: 'TRANSFER',
      p_note: note ?? '',
      p_idem: idem,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, tx: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
