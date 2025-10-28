import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const sb = supabaseServer();
    const houseId = process.env.HOUSE_WALLET_ID;

    if (!houseId) {
      return NextResponse.json({ error: 'HOUSE_WALLET_ID no configurado' }, { status: 500 });
    }

    const { data, error } = await sb
      .from('wallets')
      .select('balance')
      .eq('id', houseId)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ balance: data?.balance ?? 0, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
