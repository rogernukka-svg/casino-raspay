'use client';
import { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const supabase = useMemo(
    () => createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      setStatus('error');
      setMessage('Ingresá un email válido.');
      return;
    }
    setStatus('loading'); setMessage('');
    const redirectTo = (typeof window !== 'undefined') ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true }
    });
    if (error) { setStatus('error'); setMessage('No pudimos enviar el enlace. Probá de nuevo.'); }
    else { setStatus('ok'); setMessage('Revisá tu correo y abrí el enlace mágico para ingresar.'); }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Ingresar</h1>
      <form onSubmit={handleSignIn} className="space-y-3">
        <input
          type="email"
          className="w-full p-2 text-black rounded"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          autoComplete="email"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 p-2 rounded disabled:opacity-50"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Enviando…' : 'Enviar enlace mágico'}
        </button>
      </form>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}
