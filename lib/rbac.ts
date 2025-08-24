export function requireRole(role: 'ADMIN' | 'CASHIER' | 'PLAYER', got?: string) {
  if (got !== role) throw new Error('FORBIDDEN');
}
