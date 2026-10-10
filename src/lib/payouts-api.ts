/** Versements aux hôtes : file de la finance et coordonnées Mobile Money de l'hôte. */
import { authRequest } from "./api";

export type PayoutChannel = "cm.mtn" | "cm.orange";
export const PAYOUT_CHANNEL_LABEL: Record<PayoutChannel, string> = { "cm.mtn": "MTN Mobile Money", "cm.orange": "Orange Money" };

export type PayoutStatus = "TO_SEND" | "SENDING" | "PROCESSING" | "PAID" | "FAILED";
export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  TO_SEND: "À verser",
  SENDING: "Envoi en cours",
  PROCESSING: "En traitement chez l'opérateur",
  PAID: "Versé",
  FAILED: "Échec",
};

export interface PayoutItem {
  id: string;
  status: PayoutStatus;
  amount: number;
  attempts: number;
  failureReason: string | null;
  createdAt: string;
  sentAt: string | null;
  paidAt: string | null;
  bookingId: string;
  propertyTitle: string;
  city: string;
  checkInDate: string;
  checkOutDate: string;
  host: { id: string; fullName: string; phone: string } | null;
  /** Null tant que l'hôte n'a pas renseigné son numéro. */
  details: { channel: PayoutChannel; phone: string; accountName: string; updatedAt: string | null } | null;
  /** Numéro modifié il y a moins de 72 h : à vérifier avant d'envoyer. */
  detailsRecentlyChanged: boolean;
  beneficiary: { channel: PayoutChannel | null; phone: string; accountName: string | null } | null;
  canSend: boolean;
  canCheck: boolean;
  canMarkPaid: boolean;
}

export const listPayouts = (view: "open" | "done") => authRequest<PayoutItem[]>(`/admin/payouts?view=${view}`);
export const sendPayout = (id: string) => authRequest<PayoutItem | null>(`/admin/payouts/${encodeURIComponent(id)}/send`, { method: "POST" });
export const checkPayout = (id: string) => authRequest<PayoutItem | null>(`/admin/payouts/${encodeURIComponent(id)}/check`, { method: "POST" });

export const markPayoutPaid = (id: string, reference: string) =>
  authRequest<PayoutItem | null>(`/admin/payouts/${encodeURIComponent(id)}/mark-paid`, { method: "POST", body: JSON.stringify({ reference }) });

export interface PayoutDetails {
  channel: PayoutChannel | null;
  phone: string | null;
  accountName: string | null;
  updatedAt: string | null;
}
export const getPayoutDetails = () => authRequest<PayoutDetails>("/payouts/me");
export const savePayoutDetails = (body: { channel: PayoutChannel; phone: string; accountName: string }) =>
  authRequest<PayoutDetails>("/payouts/me", { method: "PUT", body: JSON.stringify(body) });
