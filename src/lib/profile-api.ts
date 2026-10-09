/** Photo de profil de la personne connectée. */
import { authRequest } from "./api";

export const setAvatar = (avatarUrl: string) =>
  authRequest<{ avatarUrl: string | null }>("/profile/avatar", { method: "PATCH", body: JSON.stringify({ avatarUrl }) });

export const removeAvatar = () => authRequest<{ avatarUrl: string | null }>("/profile/avatar", { method: "DELETE" });

/** Vrai pour une photo choisie depuis l'application (et non, par exemple, celle fournie par Google). */
export const isOwnAvatarUrl = (url: string | null | undefined) => typeof url === "string" && url.includes("/soorooms/avatars/");

/** Photo verrouillée : elle est liée à une vérification d'identité en cours ou approuvée. */
export const isAvatarLocked = (kycStatus: string | undefined, url: string | null | undefined) =>
  (kycStatus === "PENDING_REVIEW" || kycStatus === "APPROVED") && isOwnAvatarUrl(url);
