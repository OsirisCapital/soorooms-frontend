/**
 * Équivalents indicatifs en devises, pour la diaspora. Le paiement reste en FCFA : l'euro est lié au
 * franc CFA (BEAC) par une parité fixe, donc l'équivalent en euros est exact ; le dollar flotte, on ne
 * l'affiche que si un taux est configuré (NEXT_PUBLIC_USD_XAF = nombre de FCFA pour 1 USD).
 */
export const XAF_PER_EUR = 655.957;

const usdRate = Number(process.env.NEXT_PUBLIC_USD_XAF);

export function toEuro(xaf: number) {
  return xaf / XAF_PER_EUR;
}

export function formatEuro(xaf: number) {
  return `${toEuro(xaf).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Équivalent en dollars, ou null si aucun taux n'est configuré. */
export function formatUsd(xaf: number) {
  if (!Number.isFinite(usdRate) || usdRate <= 0) return null;
  return `${(xaf / usdRate).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $US`;
}
