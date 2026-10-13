/** Annulation d'une réservation et remboursement. */
import { authRequest, type BookingDetail } from "./api";
import type { PayoutChannel } from "./payouts-api";

export type CancellationPreview =
  | { canCancel: false; reason: string; actor: "TRAVELER" | "HOST" }
  | {
      canCancel: true;
      actor: "TRAVELER" | "HOST";
      /** Somme déjà payée. */
      paid: number;
      /** Somme qui sera remboursée. */
      refund: number;
      /** Somme qui ne sera pas remboursée. */
      retained: number;
      percent: number;
      /** Règle appliquée, en une phrase. */
      label: string;
      /** Vrai si le voyageur doit indiquer où recevoir son remboursement. */
      needsRefundNumber: boolean;
    };

export interface RefundDestination {
  refundChannel: PayoutChannel;
  refundPhone: string;
  refundName: string;
}

export const getCancellationPreview = (bookingId: string) =>
  authRequest<CancellationPreview>(`/bookings/${encodeURIComponent(bookingId)}/cancellation-preview`);

export const cancelBooking = (bookingId: string, body: Partial<RefundDestination> & { reason?: string }) =>
  authRequest<BookingDetail>(`/bookings/${encodeURIComponent(bookingId)}/cancel`, { method: "POST", body: JSON.stringify(body) });

export const saveRefundDetails = (bookingId: string, body: { channel: PayoutChannel; phone: string; accountName: string }) =>
  authRequest<{ ok: true }>(`/bookings/${encodeURIComponent(bookingId)}/refund-details`, { method: "POST", body: JSON.stringify(body) });
