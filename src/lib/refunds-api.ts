/** Remboursements aux voyageurs : file de la finance. */
import { authRequest } from "./api";
import type { PayoutChannel, PayoutStatus } from "./payouts-api";

export const REFUND_STATUS_LABEL: Record<PayoutStatus, string> = {
  TO_SEND: "À rembourser",
  SENDING: "Envoi en cours",
  PROCESSING: "En traitement chez l'opérateur",
  PAID: "Remboursé",
  FAILED: "Échec",
};

export const REFUND_REASON_LABEL: Record<string, string> = {
  TRAVELER_CANCEL: "Annulation par le voyageur",
  HOST_CANCEL: "Annulation par l'hôte",
  DISPUTE: "Litige tranché en faveur du voyageur",
};

export interface RefundItem {
  id: string;
  status: PayoutStatus;
  reason: string;
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
  traveler: { id: string; fullName: string; phone: string } | null;
  /** Null tant que le voyageur n'a pas indiqué son numéro. */
  beneficiary: { channel: PayoutChannel | null; phone: string; accountName: string | null } | null;
  canSend: boolean;
  canCheck: boolean;
  canMarkPaid: boolean;
}

export const listRefunds = (view: "open" | "done") => authRequest<RefundItem[]>(`/admin/refunds?view=${view}`);
export const sendRefund = (id: string) => authRequest<RefundItem | null>(`/admin/refunds/${encodeURIComponent(id)}/send`, { method: "POST" });
export const checkRefund = (id: string) => authRequest<RefundItem | null>(`/admin/refunds/${encodeURIComponent(id)}/check`, { method: "POST" });
export const markRefundPaid = (id: string, reference: string) =>
  authRequest<RefundItem | null>(`/admin/refunds/${encodeURIComponent(id)}/mark-paid`, { method: "POST", body: JSON.stringify({ reference }) });
