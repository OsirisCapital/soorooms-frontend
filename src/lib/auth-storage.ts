/**
 * Stockage local des tokens — volontairement isolé dans ce fichier pour
 * qu'un futur changement de stratégie (cookies httpOnly via un backend-
 * for-frontend, par exemple) ne touche qu'un seul endroit.
 */
import type { AuthTokens } from "./api";

const ACCESS_TOKEN_KEY = "sooroms.accessToken";
const REFRESH_TOKEN_KEY = "sooroms.refreshToken";

export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Payload du token d'accès ({ sub, role, phone }), lu sans vérifier la
 * signature : sert uniquement à savoir quel compte est connecté. Le nom et
 * le statut KYC viennent de GET /auth/me.
 */
function getTokenPayload(): { sub?: string; phone?: string } | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)) as { sub?: string; phone?: string };
  } catch {
    return null;
  }
}

export function getTokenUserId(): string | null {
  return getTokenPayload()?.sub ?? null;
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Le mode de compte (voyageur/hôte) est propre à la session.
  localStorage.removeItem("sooroms.account");
}
export function getTokenPhone(): string | null {
  return getTokenPayload()?.phone ?? null;
}