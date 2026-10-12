/** Visites de vérification : demande et paiement (hôte), file (équipe), rapport (agent de terrain). */
import { authRequest } from "./api";

export type VisitStatus = "AWAITING_PAYMENT" | "PENDING_ASSIGNMENT" | "ASSIGNED" | "COMPLETED" | "REJECTED";

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  AWAITING_PAYMENT: "À payer",
  PENDING_ASSIGNMENT: "Payée · en attente d'un agent",
  ASSIGNED: "Agent désigné · visite à venir",
  COMPLETED: "Conforme · badge accordé",
  REJECTED: "Points à corriger",
};

export interface ChecklistItem {
  key: string;
  label: string;
}

export interface VisitResult {
  conforming: boolean;
  checklist: Record<string, boolean> | null;
  photoUrls: string[];
  report: string | null;
}

export interface Visit {
  id: string;
  status: VisitStatus;
  amount: number | null;
  paidAt: string | null;
  assignedAt: string | null;
  visitedAt: string | null;
  createdAt: string;
  agentName: string | null;
  property?: { id: string; title: string; city: string; quarter: string };
  result?: VisitResult | null;
}

export interface VisitOverview {
  property: { id: string; title: string; verified: boolean; verifiedAt: string | null };
  price: number;
  checklist: ChecklistItem[];
  current: Visit | null;
  history: Visit[];
}

export interface VisitDetail extends Visit {
  site: { latitude: number; longitude: number; region: string | null } | null;
  manager: { fullName: string; phone: string } | null;
  checklist?: ChecklistItem[];
}

export interface VisitPaymentCheck {
  confirmed: boolean;
  paymentStatus: "SUCCESS" | "FAILED" | "PENDING";
}

// Hôte
export const getVisitOverview = (propertyId: string) => authRequest<VisitOverview>(`/properties/${encodeURIComponent(propertyId)}/verification`);
export const requestVisit = (propertyId: string) =>
  authRequest<Visit>(`/properties/${encodeURIComponent(propertyId)}/verification`, { method: "POST" });
export const payVisit = (visitId: string) =>
  authRequest<{ paymentUrl: string; gatewayRef: string }>(`/payments/visits/${encodeURIComponent(visitId)}/initiate`, { method: "POST" });
export const verifyVisitPayment = (visitId: string, reference: string) =>
  authRequest<VisitPaymentCheck>(`/payments/visits/${encodeURIComponent(visitId)}/verify`, {
    method: "POST",
    body: JSON.stringify({ reference }),
  });

// Équipe
export const listVisits = () => authRequest<Visit[]>("/admin/visits");
export const listVisitAgents = () => authRequest<Array<{ id: string; fullName: string }>>("/admin/visits/agents");
export const getAdminVisit = (id: string) => authRequest<VisitDetail>(`/admin/visits/${encodeURIComponent(id)}`);
export const assignVisit = (id: string, agentId: string) =>
  authRequest<{ assigned: boolean }>(`/admin/visits/${encodeURIComponent(id)}/assign`, { method: "POST", body: JSON.stringify({ agentId }) });

// Agent de terrain
export const listMyVisits = () => authRequest<Visit[]>("/agent/visits");
export const getMyVisit = (id: string) => authRequest<VisitDetail>(`/agent/visits/${encodeURIComponent(id)}`);
export const submitVisitReport = (
  id: string,
  body: { conforming: boolean; checklist: Record<string, boolean>; photoUrls: string[]; report: string },
) => authRequest<{ conforming: boolean }>(`/agent/visits/${encodeURIComponent(id)}/report`, { method: "POST", body: JSON.stringify(body) });
