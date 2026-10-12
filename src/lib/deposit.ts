/** Aperçu du paiement en deux temps d'une salle de fêtes (le serveur reste seul juge des montants). */
const DAY_MS = 86_400_000;
const BALANCE_DUE_DAYS = 7;

export function previewDeposit(checkInDate: string, depositPercent: number | null | undefined, total: number, now = new Date()) {
  if (!depositPercent || depositPercent <= 0 || depositPercent >= 100) return null;
  const checkIn = new Date(`${checkInDate.slice(0, 10)}T00:00:00Z`).getTime();
  const dueAt = checkIn - BALANCE_DUE_DAYS * DAY_MS;
  if (dueAt - now.getTime() < DAY_MS) return null;
  const deposit = Math.round((total * depositPercent) / 100);
  return deposit >= 1 && deposit < total ? { deposit, balance: total - deposit, dueAt: new Date(dueAt) } : null;
}
