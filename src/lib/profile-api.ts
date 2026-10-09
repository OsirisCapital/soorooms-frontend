/** Photo de profil de la personne connectée. */
import { authRequest } from "./api";

export const setAvatar = (avatarUrl: string) =>
  authRequest<{ avatarUrl: string | null }>("/profile/avatar", { method: "PATCH", body: JSON.stringify({ avatarUrl }) });

export const removeAvatar = () => authRequest<{ avatarUrl: string | null }>("/profile/avatar", { method: "DELETE" });
