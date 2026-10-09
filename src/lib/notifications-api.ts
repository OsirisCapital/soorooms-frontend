/** Appels des notifications de la personne connectée. */
import { authRequest } from "./api";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  /** Page de l'application à ouvrir au toucher (chemin interne), ou null. */
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  items: AppNotification[];
  hasMore: boolean;
}

export function listNotifications(opts: { unreadOnly?: boolean; before?: string } = {}) {
  const query = new URLSearchParams({ limit: "30" });
  if (opts.unreadOnly) query.set("unread", "true");
  if (opts.before) query.set("before", opts.before);
  return authRequest<NotificationPage>(`/notifications?${query.toString()}`);
}

export const getUnreadCount = () => authRequest<{ count: number }>("/notifications/unread-count");
export const markNotificationRead = (id: string) => authRequest<{ count: number }>(`/notifications/${id}/read`, { method: "POST" });
export const markAllNotificationsRead = () => authRequest<{ count: number }>("/notifications/read-all", { method: "POST" });

/** N'ouvre qu'une page de l'application, jamais un site extérieur. */
export const isInternalPath = (value: string | null): value is string =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
