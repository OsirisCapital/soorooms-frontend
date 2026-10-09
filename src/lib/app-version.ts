/** Version de l'application installée sur l'appareil, et comparaison avec celle exigée par le serveur. */
import { version } from "../../package.json";

export const APP_VERSION: string = version;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export interface VersionInfo {
  latest: string;
  minSupported: string;
  notes: string;
}

const PATTERN = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;

/** Négatif si a < b. Une version illisible compte comme la plus basse. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => (PATTERN.test(v) ? v.split(".").map(Number) : [-1, -1, -1]);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

/** Lit la version courante côté serveur. Renvoie null au moindre problème : on ne bloque jamais sur une erreur. */
export async function fetchVersionInfo(): Promise<VersionInfo | null> {
  try {
    const response = await fetch(`${API_URL}/app/version`, { cache: "no-store" });
    if (!response.ok) return null;
    const body = await response.json();
    const data = body?.data ?? body;
    if (typeof data?.latest !== "string" || typeof data?.minSupported !== "string") return null;
    return { latest: data.latest, minSupported: data.minSupported, notes: typeof data.notes === "string" ? data.notes : "" };
  } catch {
    return null;
  }
}

/** Vide les caches et désinscrit le service worker, puis recharge : l'appareil repart de la dernière version. */
export async function applyUpdate(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* on recharge quand même */
  }
  window.location.reload();
}
