/**
 * Appels de l'espace d'administration : accès de la personne connectée, statistiques, journal.
 * (Les appels d'accréditations et de litiges restent dans api.ts.)
 */
import { authRequest, type PendingKyc } from "./api";

export type Permission =
  | "dashboard.view"
  | "kyc.review"
  | "disputes.view"
  | "payments.view"
  | "payouts.manage"
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

/** Demande d'identité en attente, avec le nombre de demandes déjà déposées par la personne. */
export interface PendingKycItem extends PendingKyc {
  attempts: number;
}

export interface KycHistoryItem {
  id: string;
  status: "APPROVED" | "REJECTED";
  reviewerNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  user: { id: string; fullName: string; phone: string };
  /** null : décision antérieure au journal, auteur inconnu. */
  reviewer: { id: string; fullName: string } | null;
}

export const listPendingKycDetailed = () => authRequest<PendingKycItem[]>("/admin/kyc/pending");
export const listKycHistory = (limit = 50) => authRequest<KycHistoryItem[]>(`/admin/kyc/history?limit=${limit}`);

// --- Annonces et versions ------------------------------------------------

export type AnnouncementAudience = "ALL" | "TRAVELERS" | "HOSTS";
export const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  ALL: "Tout le monde",
  TRAVELERS: "Voyageurs",
  HOSTS: "Hôtes",
};

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  href: string | null;
  audience: AnnouncementAudience;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  recipientCount: number;
  createdAt: string;
  author: { fullName: string } | null;
}
export interface AnnouncementInput {
  title: string;
  body: string;
  href?: string;
  audience: AnnouncementAudience;
}

export const listAnnouncements = () => authRequest<AnnouncementItem[]>("/admin/announcements");
export const createAnnouncement = (input: AnnouncementInput) =>
  authRequest<AnnouncementItem>("/admin/announcements", { method: "POST", body: JSON.stringify(input) });
export const deleteAnnouncement = (id: string) => authRequest<{ ok: true }>(`/admin/announcements/${encodeURIComponent(id)}`, { method: "DELETE" });
export const publishAnnouncement = (id: string) =>
  authRequest<AnnouncementItem>(`/admin/announcements/${encodeURIComponent(id)}/publish`, { method: "POST" });

export interface ReleaseItem {
  id: string;
  version: string;
  notes: string;
  required: boolean;
  publishedAt: string;
}
export const listReleases = () => authRequest<ReleaseItem[]>("/admin/releases");
export const publishRelease = (input: { version: string; notes: string; required: boolean }) =>
  authRequest<ReleaseItem>("/admin/releases", { method: "POST", body: JSON.stringify(input) });
export const setReleaseRequired = (id: string, required: boolean) =>
  authRequest<ReleaseItem>(`/admin/releases/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ required }) });

// --- Équipe et tâches ----------------------------------------------------

export const PERMISSION_LABEL: Record<Permission, string> = {
  "dashboard.view": "Tableau de bord",
  "kyc.review": "Accréditations (identités)",
  "disputes.view": "Litiges",
  "payments.view": "Paiements",
  "payouts.manage": "Versements aux hôtes",
  "users.view": "Fiches utilisateurs",
  "support.manage": "Support",
  "announcements.manage": "Annonces",
  "releases.manage": "Versions de l'application",
  "staff.manage": "Équipe et tâches",
  "audit.view": "Journal",
};

export interface StaffMember {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  staffRole: StaffRole;
  extraPermissions: string[];
  permissions: Permission[];
}
export interface StaffInput {
  staffRole: StaffRole;
  permissions: Permission[];
}

export const listStaff = () => authRequest<StaffMember[]>("/admin/staff");
export const addStaff = (input: StaffInput & { identifier: string }) =>
  authRequest<StaffMember>("/admin/staff", { method: "POST", body: JSON.stringify(input) });
export const updateStaff = (id: string, input: StaffInput) =>
  authRequest<StaffMember>(`/admin/staff/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) });
export const removeStaff = (id: string) => authRequest<{ ok: true }>(`/admin/staff/${encodeURIComponent(id)}`, { method: "DELETE" });

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH";
export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = { LOW: "Basse", NORMAL: "Normale", HIGH: "Haute" };
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Terminée" };

export interface StaffTask {
  id: string;
  title: string;
  details: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  /** AAAA-MM-JJ */
  dueDate: string | null;
  href: string | null;
  completedAt: string | null;
  createdAt: string;
  assignee: { id: string; fullName: string } | null;
  createdBy: { id: string; fullName: string } | null;
}
export interface TaskInput {
  title: string;
  details?: string;
  assigneeId: string;
  priority: TaskPriority;
  dueDate?: string;
  href?: string;
}

export const listTasks = (scope: "mine" | "all", filter: "open" | "done") => authRequest<StaffTask[]>(`/admin/tasks?scope=${scope}&filter=${filter}`);
export const getOpenTaskCount = () => authRequest<{ count: number }>("/admin/tasks/open-count");
export const createTask = (input: TaskInput) => authRequest<StaffTask>("/admin/tasks", { method: "POST", body: JSON.stringify(input) });
export const assignTask = (id: string, assigneeId: string) =>
  authRequest<StaffTask>(`/admin/tasks/${encodeURIComponent(id)}/assign`, { method: "POST", body: JSON.stringify({ assigneeId }) });
export const setTaskStatus = (id: string, status: TaskStatus) =>
  authRequest<StaffTask>(`/admin/tasks/${encodeURIComponent(id)}/status`, { method: "POST", body: JSON.stringify({ status }) });
export const deleteTask = (id: string) => authRequest<{ ok: true }>(`/admin/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
