"use client";

import { useState, type FormEvent } from "react";
import { Stars, StarInput } from "@/components/Stars";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { createReview, getBookingReview, type BookingReviewState } from "@/lib/reviews-api";
import { useAsyncData } from "@/lib/use-async-data";

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");

/** Sur la réservation d'un séjour terminé : noter le logement, ou revoir son avis. */
export function ReviewBooking({ bookingId }: { bookingId: string }) {
  const { data } = useAsyncData(`booking-review-${bookingId}`, () => getBookingReview(bookingId));
  const [override, setOverride] = useState<BookingReviewState | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = override ?? data;
  if (!state) return null;

  if (state.review) {
    return (
      <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Votre avis</h2>
        <div className="mt-2">
          <Stars value={state.review.rating} size="text-xl" />
        </div>
        {state.review.comment && <p className="mt-2 whitespace-pre-line text-sm text-[var(--color-ink)]">{state.review.comment}</p>}
        {state.review.hostReply && (
          <p className="mt-3 rounded-2xl bg-[var(--color-cream-soft)] p-3 text-sm text-slate-700">
            <strong>Réponse de l&apos;hôte :</strong> {state.review.hostReply}
          </p>
        )}
      </section>
    );
  }
  if (!state.canReview) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (rating < 1) return setError("Choisissez une note de 1 à 5 étoiles.");
    setBusy(true);
    setError(null);
    try {
      const review = await createReview(bookingId, { rating, comment: comment.trim() || undefined });
      setOverride({ review, canReview: false });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Comment s&apos;est passé votre séjour ?</h2>
      <p className="text-sm text-slate-600">Votre avis est public (votre prénom et l&apos;initiale de votre nom) et aide les autres voyageurs. Il ne pourra plus être modifié.</p>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={4}
        placeholder="Propreté, accueil, conformité aux photos… (facultatif)"
        className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={busy}>Publier mon avis</Button>
    </form>
  );
}
