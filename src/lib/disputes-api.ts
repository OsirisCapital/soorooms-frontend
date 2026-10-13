/** Litiges : liste avec montants, et décision de l'équipe. */
import { authRequest } from "./api";

export type DisputeDecision = "REFUND_FULL" | "REFUND_PARTIAL" | "PAY_HOST";

export interface DisputeItem {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: string | number | null;
  disputeReason: string | null;
  travelerConfirmedAt: string | null;
  hostConfirmedAt: string | null;
  openedAt: string;
  traveler: { id: string; fullName: string; phone: string };
  host: { id: string; fullName: string; phone: string } | null;
  room: { name: string; property: { id: string; title: string; city: string } };
  /** Null si rien n'a été payé. */
  money: { paid: number; hostPayout: number; travelerFee: number; status: string } | null;
}

export interface DisputeOutcome {
  ok: true;
  decision: DisputeDecision;
  refund: number;
  retained: number;
  hostPayout: number;
}

export const listDisputeQueue = () => authRequest<DisputeItem[]>("/admin/disputes-queue");

export const resolveDispute = (id: string, body: { decision: DisputeDecision; refundAmount?: number; note: string }) =>
  authRequest<DisputeOutcome>(`/admin/disputes-queue/${encodeURIComponent(id)}/resolve`, { method: "POST", body: JSON.stringify(body) });
