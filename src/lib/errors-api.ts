/** Journal des erreurs serveur (équipe ayant l'accès « Journal »). */
import { authRequest } from "./api";

export interface ErrorEventView {
  id: string;
  method: string;
  path: string;
  status: number;
  message: string;
  stack: string | null;
  count: number;
  lastUserId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
}

export interface ErrorsSummary {
  open: number;
  last24h: number;
  items: ErrorEventView[];
}

export const listErrors = (includeResolved = false) => authRequest<ErrorsSummary>(`/admin/errors${includeResolved ? "?resolved=true" : ""}`);

export const resolveError = (id: string) => authRequest<{ resolved: true }>(`/admin/errors/${encodeURIComponent(id)}/resolve`, { method: "POST" });
