/** Équipe d'un logement : rôles, droits (miroir de common/utils/collaborator-access.ts) et appels. */
import { authRequest, type CollaboratorRole } from "./api";

export const ROLE_LABEL: Record<CollaboratorRole, string> = {
  MANAGER: "Gérant principal",
  CO_MANAGER: "Gestionnaire",
  AGENT: "Agent",
  RECEPTIONIST: "Réceptionniste",
  ACCOUNTANT: "Comptable",
};

export const ROLE_HELP: Record<CollaboratorRole, string> = {
  MANAGER: "Tout : équipe, publication, finances, vérification du logement.",
  CO_MANAGER: "Modifie la fiche et les chambres, gère les réservations et les messages. Ne voit pas les finances.",
  AGENT: "Modifie la fiche et les chambres, gère les réservations et les messages.",
  RECEPTIONIST: "Voit et traite les réservations et les messages, confirme les arrivées. Ne modifie pas la fiche.",
  ACCOUNTANT: "Voit les finances (revenus, versements, commissions). Rien d'autre.",
};

/** Rôles proposables à l'invitation (le gérant principal reste le propriétaire du logement). */
export const INVITABLE_ROLES: CollaboratorRole[] = ["CO_MANAGER", "RECEPTIONIST", "ACCOUNTANT", "AGENT"];

type Role = CollaboratorRole | null | undefined;
// Un rôle inconnu (réponse d'un ancien serveur) n'enlève aucun écran : le serveur reste le juge.
export const canEditProperty = (role: Role) => !role || role === "MANAGER" || role === "CO_MANAGER" || role === "AGENT";
export const canManageBookings = (role: Role) => !role || role !== "ACCOUNTANT";
export const canSeeFinance = (role: Role) => !role || role === "MANAGER" || role === "ACCOUNTANT";

export interface TeamMember {
  userId: string;
  fullName: string;
  phone: string;
  role: CollaboratorRole;
}

export const listTeam = (propertyId: string) => authRequest<TeamMember[]>(`/properties/${encodeURIComponent(propertyId)}/collaborators`);
export const inviteMember = (propertyId: string, phone: string, role: CollaboratorRole) =>
  authRequest<unknown>(`/properties/${encodeURIComponent(propertyId)}/collaborators`, { method: "POST", body: JSON.stringify({ phone, role }) });
export const changeMemberRole = (propertyId: string, userId: string, role: CollaboratorRole) =>
  authRequest<unknown>(`/properties/${encodeURIComponent(propertyId)}/collaborators/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
export const removeMember = (propertyId: string, userId: string) =>
  authRequest<null>(`/properties/${encodeURIComponent(propertyId)}/collaborators/${encodeURIComponent(userId)}`, { method: "DELETE" });
