/**
 * Appels de l'espace d'administration : accès de la personne connectée, statistiques, journal.
 * (Les appels d'accréditations et de litiges restent dans api.ts.)
 */
import { authRequest } from "./api";

export type Permission =
  | "dashboard.view"
  | "kyc.review"
  | "disputes.view"
  | "payments.view"
  | "users.view"
  | "support.manage"
  | "announcements.manage"
  | "releases.manage"
  | "staff.manage"
  | "audit.view";

export type StaffRole = "SUPER_ADMIN" | "KYC_REVIEWER" | "SUPPORT" | "FINANCE" | "CONTENT";

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  KYC_REVIEWER: "Responsable accréditations",
  SUPPORT: "Support",
  FINANCE: "Finance",
  CONTENT: "Contenu",
};

export interface AdminAccess {
  id: string;
  fullName: string;
  staffRole: StaffRole | null;
  permissions: Permission[];
}

export interface AdminOverview {
  generatedAt: string;
  users: { total: number; travelers: number; hosts: number; admins: number; newLast7Days: number; previous7Days: number };
  kyc: { pending: number };
  properties: {
    total: number;
    byStatus: Record<"PENDING_KYC" | "ACTIVE" | "SUSPENDED", number>;
    topCities: Array<{ city: string; count: number }>;
  };
  bookings: {
    total: number;
    byStatus: Record<"NEGOTIATING" | "PENDING_PAYMENT" | "CONFIRMED_ESCROW" | "COMPLETED" | "DISPUTED" | "CANCELLED", number>;
    disputed: number;
  };
  /** Montants en FCFA. */
  money: { volumeBooked: number; heldInEscrow: number; platformFeesEarned: number };
}

export interface AdminTimeseries {
  /** Jours « AAAA-MM-JJ », du plus ancien à aujourd'hui. */
  days: string[];
  signups: number[];
  bookings: number[];
  volume: number[];
}

export interface AuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  actor: { id: string; fullName: string } | null;
}

export const getAdminAccess = () => authRequest<AdminAccess>("/admin/me");
export const getAdminOverview = () => authRequest<AdminOverview>("/admin/stats/overview");
export const getAdminTimeseries = (days: number) => authRequest<AdminTimeseries>(`/admin/stats/timeseries?days=${days}`);
export const listAuditLog = (limit = 100) => authRequest<AuditEntry[]>(`/admin/audit?limit=${limit}`);
