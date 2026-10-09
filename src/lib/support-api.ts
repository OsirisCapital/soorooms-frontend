/** Appels du support : demandes de l'utilisateur, et boîte de réception de l'équipe. */
import { authRequest } from "./api";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_USER" | "RESOLVED" | "CLOSED";
export type TicketCategory = "ACCOUNT" | "BOOKING" | "PAYMENT" | "PROPERTY" | "TECHNICAL" | "OTHER";

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  ACCOUNT: "Mon compte",
  BOOKING: "Une réservation",
  PAYMENT: "Un paiement",
  PROPERTY: "Un logement",
  TECHNICAL: "Problème technique",
  OTHER: "Autre sujet",
};

/** Libellés vus par l'utilisateur. */
export const USER_STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Envoyée",
  IN_PROGRESS: "En cours de traitement",
  WAITING_USER: "Le support attend votre réponse",
  RESOLVED: "Résolue",
  CLOSED: "Clôturée",
};

/** Libellés vus par l'équipe. */
export const STAFF_STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Ouverte",
  IN_PROGRESS: "En cours",
  WAITING_USER: "En attente de l'utilisateur",
  RESOLVED: "Résolue",
  CLOSED: "Clôturée",
};

/** 42 → « SR-0042 », le numéro donné à l'utilisateur. */
export const ticketRef = (number: number) => `SR-${String(number).padStart(4, "0")}`;

export interface TicketSummary {
  id: string;
  number: number;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  lastMessageAt: string;
  createdAt: string;
}

export interface UserTicket extends Omit<TicketSummary, "lastMessageAt"> {
  bookingId: string | null;
  messages: Array<{ id: string; isStaff: boolean; body: string; createdAt: string }>;
}

export interface StaffTicketSummary extends TicketSummary {
  user: { id: string; fullName: string };
  assignee: { id: string; fullName: string } | null;
}

export interface StaffTicket extends Omit<TicketSummary, "lastMessageAt"> {
  bookingId: string | null;
  closedAt: string | null;
  user: { id: string; fullName: string; phone: string; email: string | null; role: string };
  assignee: { id: string; fullName: string } | null;
  messages: Array<{ id: string; isStaff: boolean; internal: boolean; body: string; createdAt: string; author: { id: string; fullName: string } }>;
}

// --- Utilisateur ---------------------------------------------------------

export const createTicket = (input: { subject: string; category: TicketCategory; message: string; bookingId?: string }) =>
  authRequest<Pick<TicketSummary, "id" | "number" | "subject" | "category" | "status" | "createdAt">>("/support/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
export const listMyTickets = () => authRequest<TicketSummary[]>("/support/tickets");
export const getMyTicket = (id: string) => authRequest<UserTicket>(`/support/tickets/${encodeURIComponent(id)}`);
export const replyToMyTicket = (id: string, body: string) =>
  authRequest<UserTicket>(`/support/tickets/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify({ body }) });
export const closeMyTicket = (id: string) => authRequest<UserTicket>(`/support/tickets/${encodeURIComponent(id)}/close`, { method: "POST" });

// --- Équipe --------------------------------------------------------------

export type StaffScope = "all" | "mine" | "unassigned";
export const listStaffTickets = (filters: { status?: string; scope?: StaffScope; q?: string }) => {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.scope && filters.scope !== "all") query.set("scope", filters.scope);
  if (filters.q?.trim()) query.set("q", filters.q.trim());
  return authRequest<StaffTicketSummary[]>(`/admin/support/tickets?${query.toString()}`);
};
export const getSupportSummary = () => authRequest<{ open: number; unassigned: number }>("/admin/support/summary");
export const getStaffTicket = (id: string) => authRequest<StaffTicket>(`/admin/support/tickets/${encodeURIComponent(id)}`);
export const replyAsStaff = (id: string, body: string, internal: boolean) =>
  authRequest<StaffTicket>(`/admin/support/tickets/${encodeURIComponent(id)}/reply`, { method: "POST", body: JSON.stringify({ body, internal }) });
export const assignTicket = (id: string, assigneeId: string | null) =>
  authRequest<StaffTicket>(`/admin/support/tickets/${encodeURIComponent(id)}/assign`, { method: "POST", body: JSON.stringify({ assigneeId }) });
export const setTicketStatus = (id: string, status: TicketStatus) =>
  authRequest<StaffTicket>(`/admin/support/tickets/${encodeURIComponent(id)}/status`, { method: "POST", body: JSON.stringify({ status }) });
