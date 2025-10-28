import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { cashier_email, amount, note } = await req.json();

    if (!cashier_email || typeof cashier_email !== 'string') {
      return NextResponse.json({ error: 'Falta cashier_email' }, { status: 400 });
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // sesión (el RPC igual valida ADMIN)
    const { data: { user }, error: gErr } = await supabase.auth.getUser();
    if (gErr) return NextResponse.json({ error: gErr.message }, { status: 400 });
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const idem = `assign-${Date.now()}`;

    const { data, error } = await supabase.rpc('fn_admin_assign_by_email', {
      p_cashier_email: cashier_email,
      p_amount: Number(amount),
      p_note: note ?? '',
      p_idem: idem,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, tx: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
