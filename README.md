# Raspay Casino (Demo)

Next.js + Supabase + Tailwind. Incluye:
- OTP sign-in (magic link)
- Roles: ADMIN / CASHIER / PLAYER
- Wallets y transfers via RPC (`fn_mint`, `fn_transfer`)
- Juego Dice básico con RNG determinístico

## Requisitos
- Node 18+
- Claves de Supabase

## Variables de entorno
Crea un archivo `.env.local` en la raíz con:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Juego / configuración
HOUSE_WALLET_ID=uuid-de-billetera-de-la-casa
SERVER_SEED=semilla-servidor-opcional
```

> Asegurate de configurar en Supabase → Authentication → URL Configuration el dominio de tu app para el `emailRedirectTo`.

## Scripts
```
npm install
npm run dev
```

## Estructura
- `app/(auth)/sign-in` ingreso por email
- `app/api/admin/mint` emisión (ADMIN)
- `app/api/cashier/credit` acreditar desde cajero (CASHIER)
- `app/api/games/dice/bet` endpoint de apuesta Dice
- `app/games/dice` UI placeholder
- `app/wallet` UI placeholder
- `lib/` helpers (auth/supabase/rng/rbac)
