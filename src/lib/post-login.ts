/**
 * Mémorise la page où le visiteur voulait aller (ex. après avoir scanné un QR code) pour l'y
 * ramener une fois connecté ou inscrit, au lieu de l'envoyer sur l'accueil.
 */
const KEY = "soorooms:next";

/** Seuls les chemins internes sont acceptés (jamais une URL externe). */
function isInternal(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function rememberNext(path: string): void {
  try {
    if (isInternal(path)) sessionStorage.setItem(KEY, path);
  } catch {
    // Stockage indisponible (navigation privée) : on retombera sur l'accueil.
  }
}

/** Renvoie la page mémorisée (et l'oublie), sinon l'accueil. */
export function takeNext(fallback = "/home"): string {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (path && isInternal(path)) return path;
  } catch {
    // voir rememberNext
  }
  return fallback;
}
