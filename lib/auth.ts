import { supabaseServer } from './supabaseServer';

export async function getSession() {
  const supabase = supabaseServer();
  return supabase.auth.getSession();
}

export async function getUserRole(userId: string) {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
  return data?.role as 'ADMIN' | 'CASHIER' | 'PLAYER' | undefined;
}
