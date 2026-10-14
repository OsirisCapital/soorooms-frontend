/**
 * Code de parrainage mémorisé quand quelqu'un ouvre un lien /r/CODE. Il est envoyé au serveur après la
 * connexion ou l'inscription (voir ReferralClaimer), puis effacé. Valable 30 jours.
 */
const KEY = "sooroms.referral";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function rememberReferral(code: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code: code.trim().toUpperCase(), at: Date.now() }));
  } catch {
    // stockage indisponible (navigation privée) : le parrainage ne sera simplement pas mémorisé
  }
}

export function pendingReferral(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code?: unknown; at?: unknown };
    if (typeof parsed.code !== "string" || typeof parsed.at !== "number" || Date.now() - parsed.at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

export function clearReferral() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // rien à faire
  }
}
