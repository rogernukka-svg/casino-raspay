// app/api/games/slot/spin/route.ts
import 'server-only';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const runtime = 'nodejs'; // usamos Node para crypto

// ===== Tipos =====
type SpinReq = {
  game_code: string;   // ej: 'raspay_slots'
  bet: number;         // en centavos (int)
  nonce: number;       // 1,2,3… por jugador
  client_seed: string; // semilla elegida por el jugador
};

type GameConfig = {
  denom: number;
  reels: string[][];
  lines: number[][];
  // paytable expresado en “x100”. p.ej.: 200 = 2.00x * bet
  paytable: Record<string, Record<string, number>>;
};

// ===== Utils (RNG y evaluación) =====
function hmac(serverSeed: string, msg: string) {
  return crypto.createHmac('sha256', Buffer.from(serverSeed))
               .update(Buffer.from(msg))
               .digest('hex');
}

// Convierte los 8 primeros bytes del hash a número [0,1)
function hexToUnit(hex: string) {
  const slice = hex.slice(0, 16);
  const num = parseInt(slice, 16);
  return num / 0xffffffffffffffff;
}

// Evalúa líneas de pago (desde la izquierda, mínimo 3 iguales)
function evaluateWins(
  grid: string[][],
  lines: number[][],
  paytable: GameConfig['paytable'],
  bet: number
) {
  let totalWin = 0;
  const wins: Array<{ line: number[]; symbol: string; count: number; pay: number; win: number }> = [];

  for (const L of lines) {
    const lineSymbols = grid.map((col, i) => col[L[i]]);
    const first = lineSymbols[0];
    let count = 1;
    for (let i = 1; i < lineSymbols.length; i++) {
      if (lineSymbols[i] === first) count++;
      else break;
    }
    const payX100 = paytable[first]?.[String(count)] ?? 0;
    if (payX100 > 0) {
      const win = Math.round((payX100 * bet) / 100); // paytable en x100
      totalWin += win;
      wins.push({ line: L, symbol: first, count, pay: payX100, win });
    }
  }
  return { totalWin, wins };
}

// (Opcional) preflight CORS/health-check
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ===== Handler principal =====
export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // --- Auth ---
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // --- Parse & validación ---
    const body = (await req.json()) as Partial<SpinReq>;
    const game_code = String(body.game_code || '');
    const bet = Number.isFinite(body.bet) ? Number(body.bet) : NaN;
    const nonce = Number.isFinite(body.nonce) ? Number(body.nonce) : NaN;
    const client_seed = String(body.client_seed || '');

    if (!game_code || !Number.isInteger(bet) || bet <= 0 || !Number.isInteger(nonce) || nonce <= 0 || !client_seed) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // --- RPC: debita apuesta y devuelve hash + config del juego ---
    const { data: rpc, error: rpcErr } = await supabase.rpc('fn_slot_spin', {
      p_user: user.id,
      p_game_code: game_code,
      p_nonce: nonce,
      p_bet: bet,
      p_client_seed: client_seed,
    });

    if (rpcErr) {
      // ejemplos: insufficient_funds, game_not_found, seed_missing
      return NextResponse.json({ error: rpcErr.message }, { status: 400 });
    }

    const roundId: string = rpc.round_id;
    const serverHash: string = rpc.hash;              // HMAC(server_seed, client_seed:nonce)
    const config = rpc.config as GameConfig;

    // --- Construir grilla (5x3) usando sub-hashes por carrete ---
    const reels = config.reels;
    const cols = reels.length;
    const rows = 3; // visibles

    const grid: string[][] = Array.from({ length: cols }, () => Array(rows).fill(''));
    for (let c = 0; c < cols; c++) {
      const sub = hmac(serverHash, `reel:${c}`);
      const u = hexToUnit(sub);
      const strip = reels[c];
      const start = Math.floor(u * strip.length);
      for (let r = 0; r < rows; r++) {
        grid[c][r] = strip[(start + r) % strip.length];
      }
    }

    // --- Evaluar ganancias ---
    const { totalWin, wins } = evaluateWins(grid, config.lines, config.paytable, bet);

    // --- Acreditar si ganó ---
    if (totalWin > 0) {
      const { error: creditErr } = await supabase.rpc('fn_credit_win', {
        p_user: user.id,
        p_amount: totalWin,
        p_round_id: roundId,
      });
      if (creditErr) {
        // si fallara el crédito, devolvemos 500 para investigarlo
        return NextResponse.json({ error: creditErr.message }, { status: 500 });
      }
    }

    // --- Respuesta ---
    return NextResponse.json({
      round_id: roundId,
      grid,            // [col][row]
      wins,            // detalle de líneas ganadoras
      win: totalWin,   // total en centavos
      hash: serverHash,
      public: true,    // verificable por el jugador (provably fair)
    });
  } catch (err: any) {
    console.error('slot/spin error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
