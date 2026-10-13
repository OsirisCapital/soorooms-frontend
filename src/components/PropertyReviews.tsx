"use client";

import { useState } from "react";
import { Stars } from "@/components/Stars";
import { getPropertyReviews, type PublicReview } from "@/lib/reviews-api";
import { useAsyncData } from "@/lib/use-async-data";

const formatMonth = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export function ReviewItem({ review, children }: { review: PublicReview; children?: React.ReactNode }) {
  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-[var(--color-ink)]">{review.authorName}</p>
        <Stars value={review.rating} />
      </div>
      <p className="text-xs text-slate-500">{formatMonth(review.createdAt)}</p>
      {review.comment && <p className="mt-2 whitespace-pre-line text-sm text-[var(--color-ink)]">{review.comment}</p>}
      {review.hostReply && (
        <p className="mt-3 rounded-xl bg-[var(--color-cream-soft)] p-3 text-sm text-slate-700">
          <strong>Réponse de l&apos;hôte :</strong> {review.hostReply}
        </p>
      )}
      {children}
    </li>
  );
}

/** Note moyenne et avis des voyageurs sur la fiche d'un logement. N'affiche rien tant qu'il n'y a aucun avis. */
export function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { data } = useAsyncData(`property-reviews-${propertyId}`, () => getPropertyReviews(propertyId));
  const [more, setMore] = useState<PublicReview[]>([]);
  const [hasMore, setHasMore] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  if (!data || data.count === 0) return null;

  const items = [...data.items, ...more];
  const canLoadMore = hasMore ?? data.hasMore;

  async function loadMore() {
    setBusy(true);
    try {
      const next = await getPropertyReviews(propertyId, items[items.length - 1]?.createdAt);
      setMore((m) => [...m, ...next.items]);
      setHasMore(next.hasMore);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-teal)]">Avis des voyageurs</h2>
        <span className="text-sm text-slate-600">
          <strong className="text-[var(--color-ink)]">{data.average?.toString().replace(".", ",")}</strong> / 5 · {data.count} avis
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((r) => (
          <ReviewItem key={r.id} review={r} />
        ))}
      </ul>
      {canLoadMore && (
        <button type="button" onClick={loadMore} disabled={busy} className="mt-3 w-full rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60">
          {busy ? "Un instant…" : "Voir plus d'avis"}
        </button>
      )}
    </section>
  );
}
