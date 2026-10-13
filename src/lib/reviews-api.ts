/** Avis après séjour : voyageur, public (fiche logement) et réponse de l'hôte. */
import { authRequest, publicRequest } from "./api";

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  hostReply: string | null;
  hostRepliedAt: string | null;
  createdAt: string;
  /** « Marie K. » : jamais le nom complet. */
  authorName: string;
}

export interface PropertyReviews {
  average: number | null;
  count: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  hasMore: boolean;
  items: PublicReview[];
}

export interface MyReview {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  hostReply: string | null;
  createdAt: string;
  property: { id: string; title: string; city: string };
}

export interface BookingReviewState {
  review: { id: string; rating: number; comment: string | null; hostReply: string | null; createdAt: string } | null;
  canReview: boolean;
}

export const getPropertyReviews = (propertyId: string, before?: string) =>
  publicRequest<PropertyReviews>(`/properties/${encodeURIComponent(propertyId)}/reviews${before ? `?before=${encodeURIComponent(before)}` : ""}`);

export const getBookingReview = (bookingId: string) => authRequest<BookingReviewState>(`/bookings/${encodeURIComponent(bookingId)}/review`);

export const createReview = (bookingId: string, payload: { rating: number; comment?: string }) =>
  authRequest<NonNullable<BookingReviewState["review"]>>(`/bookings/${encodeURIComponent(bookingId)}/review`, { method: "POST", body: JSON.stringify(payload) });

export const listMyReviews = () => authRequest<MyReview[]>("/reviews/mine");

export const replyToReview = (propertyId: string, reviewId: string, reply: string) =>
  authRequest<{ id: string; hostReply: string; hostRepliedAt: string }>(
    `/properties/${encodeURIComponent(propertyId)}/reviews/${encodeURIComponent(reviewId)}/reply`,
    { method: "POST", body: JSON.stringify({ reply }) },
  );
