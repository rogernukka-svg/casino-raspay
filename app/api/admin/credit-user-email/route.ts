// app/api/admin/credit-user-email/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { player_email, amount, note } = await req.json();

    if (!player_email || typeof player_email !== 'string') {
      return NextResponse.json({ error: 'Falta player_email' }, { status: 400 });
    }

    const nAmount = Number(amount);
    if (!nAmount || nAmount <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Autenticación
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    // Autorización (solo ADMIN)
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 400 });
    if (!prof || prof.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso restringido a ADMIN' }, { status: 403 });
    }

    const p_idem = `admin-credit-user-${Date.now()}`;

    // RPC recomendado: fn_admin_credit_to_email(player_email text, p_amount numeric, p_note text, p_idem text)
    const { data, error } = await supabase.rpc('fn_admin_credit_to_email', {
      player_email,
      p_amount: nAmount,
      p_note: note ?? '',
      p_idem,
    });

    // Si aún no tienes ese RPC y solo existe el del cajero, descomenta esto y comenta el bloque de arriba:
    // const { data, error } = await supabase.rpc('fn_cashier_credit_to_email', {
    //   p_player_email: player_email,
    //   p_amount: nAmount,
    //   p_note: note ?? '',
    //   p_idem,
    // });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, tx: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
