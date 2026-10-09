/** Réglage des e-mails de notification de la personne connectée. */
import { authRequest } from "./api";

export interface NotificationPreferences {
  emailEnabled: boolean;
  /** Sans adresse e-mail vérifiée, aucun e-mail n'est envoyé, même si le réglage est activé. */
  emailVerified: boolean;
}

export const getNotificationPreferences = () => authRequest<NotificationPreferences>("/notifications/preferences");

export const setEmailNotifications = (emailEnabled: boolean) =>
  authRequest<NotificationPreferences>("/notifications/preferences", { method: "PATCH", body: JSON.stringify({ emailEnabled }) });
