/** Programme partenaire : parrainage, commissions, retraits (côté utilisateur et côté équipe). */
import { authRequest } from "./api";
import type { KycStatus } from "./api";
import type { PayoutChannel } from "./payouts-api";

export interface PartnerConfig {
  enabled: boolean;
  hostRatePercent: number;
  hostMonths: number;
  travelerRatePercent: number;
  travelerMonths: number;
  capPercent: number;
  minPayout: number;
  withholdingPercent: number;
  claimWindowDays: number;
  termsVersion: string;
}

export interface PartnerAccount {
  code: string;
  status: "ACTIVE" | "SUSPENDED";
  suspendedReason: string | null;
  termsVersion: string;
  needsTerms: boolean;
  kycStatus: KycStatus;
  fullName: string;
  payout: { channel: PayoutChannel; phone: string; accountName: string; updatedAt: string | null } | null;
  payoutRecentlyChanged: boolean;
  referrals: number;
  activeHosts: number;
  balance: { earned: number; withdrawn: number; available: number };
  hasOpenPayout: boolean;
}

export interface PartnerMe {
  config: PartnerConfig;
  terms: string[];
  partner: PartnerAccount | null;
}

export interface PartnerReferralItem {
  id: string;
  name: string;
  joinedAt: string;
  hostStartedAt: string | null;
  hostEndsAt: string | null;
  travelerEndsAt: string;
  earned: number;
}

export interface PartnerCommissionItem {
  id: string;
  kind: "HOST" | "TRAVELER";
  revenue: number;
  ratePercent: number;
  amount: number;
  createdAt: string;
}

export type PartnerPayoutStatus = "REQUESTED" | "SENDING" | "PAID" | "FAILED" | "REJECTED";
export const PARTNER_PAYOUT_STATUS_LABEL: Record<PartnerPayoutStatus, string> = {
  REQUESTED: "Demandé",
  SENDING: "Envoi en cours",
  PAID: "Versé",
  FAILED: "En cours de traitement",
  REJECTED: "Refusé",
};

export interface PartnerPayoutItem {
  id: string;
  gross: number;
  withholding: number;
  net: number;
  status: PartnerPayoutStatus;
  failureReason: string | null;
  decidedNote: string | null;
  createdAt: string;
  paidAt: string | null;
}

export const getPartner = () => authRequest<PartnerMe>("/partners/me");
export const activatePartner = () => authRequest<PartnerMe>("/partners/activate", { method: "POST", body: JSON.stringify({ acceptTerms: true }) });
export const savePartnerPayout = (body: { channel: PayoutChannel; phone: string; accountName: string }) =>
  authRequest<PartnerMe>("/partners/me/payout-details", { method: "PUT", body: JSON.stringify(body) });
export const listPartnerReferrals = () => authRequest<PartnerReferralItem[]>("/partners/me/referrals");
export const listPartnerCommissions = () => authRequest<PartnerCommissionItem[]>("/partners/me/commissions");
export const listPartnerPayouts = () => authRequest<PartnerPayoutItem[]>("/partners/me/payouts");
export const requestPartnerPayout = () => authRequest<PartnerMe>("/partners/me/payouts", { method: "POST" });
export const claimReferral = (code: string) => authRequest<{ ok: boolean; already: boolean }>("/partners/claim", { method: "POST", body: JSON.stringify({ code }) });

// --- Équipe ---------------------------------------------------------------

export interface AdminPartnerRow {
  id: string;
  code: string;
  status: "ACTIVE" | "SUSPENDED";
  suspendedReason: string | null;
  createdAt: string;
  fullName: string;
  phone: string;
  kycStatus: KycStatus;
  userId: string;
  referrals: number;
  earned: number;
  available: number;
}

export interface AdminPartnerPayout {
  id: string;
  partnerId: string;
  code: string;
  partnerStatus: "ACTIVE" | "SUSPENDED";
  fullName: string;
  phone: string;
  gross: number;
  withholding: number;
  net: number;
  status: PartnerPayoutStatus;
  attempts: number;
  failureReason: string | null;
  decidedNote: string | null;
  createdAt: string;
  sentAt: string | null;
  paidAt: string | null;
  beneficiary: { channel: PayoutChannel; phone: string; accountName: string };
  kycApproved: boolean;
  nameMatches: boolean;
  detailsRecentlyChanged: boolean;
  canSend: boolean;
  canCheck: boolean;
  canMarkPaid: boolean;
  canReject: boolean;
}

export const adminListPartners = () => authRequest<AdminPartnerRow[]>("/admin/partners");
export const adminSuspendPartner = (id: string, suspended: boolean, reason?: string) =>
  authRequest<unknown>(`/admin/partners/${encodeURIComponent(id)}/suspend`, { method: "POST", body: JSON.stringify({ suspended, reason }) });
export const adminPartnerConfig = () => authRequest<PartnerConfig>("/admin/partners/config");
export const adminUpdatePartnerConfig = (body: Partial<PartnerConfig>) => authRequest<PartnerConfig>("/admin/partners/config", { method: "PUT", body: JSON.stringify(body) });
export const adminListPartnerPayouts = (view: "open" | "done") => authRequest<AdminPartnerPayout[]>(`/admin/partners/payouts?view=${view}`);
const act = (id: string, action: string, body?: object) =>
  authRequest<AdminPartnerPayout | null>(`/admin/partners/payouts/${encodeURIComponent(id)}/${action}`, { method: "POST", body: body ? JSON.stringify(body) : undefined });
export const adminSendPartnerPayout = (id: string) => act(id, "send");
export const adminCheckPartnerPayout = (id: string) => act(id, "check");
export const adminMarkPartnerPayoutPaid = (id: string, reference: string) => act(id, "mark-paid", { reference });
export const adminRejectPartnerPayout = (id: string, reason: string) => act(id, "reject", { reason });
