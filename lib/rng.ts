import { createHash, randomBytes } from 'crypto';

export function commitServerSeed(seed?: string) {
  const s = seed ?? randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(s).digest('hex');
  return { serverSeed: s, serverSeedHash: hash };
}

export function diceRoll(serverSeed: string, clientSeed: string) {
  const h = createHash('sha256').update(`${serverSeed}:${clientSeed}`).digest('hex');
  const num = parseInt(h.slice(0, 8), 16);
  const roll = (num % 100) + 1;
  return roll;
}
