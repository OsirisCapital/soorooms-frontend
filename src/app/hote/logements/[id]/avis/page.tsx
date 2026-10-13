"use client";

import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { ReviewItem } from "@/components/PropertyReviews";
import { Stars } from "@/components/Stars";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { getPropertyReviews, replyToReview, type PublicReview } from "@/lib/reviews-api";
import { useAsyncData } from "@/lib/use-async-data";

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");

function ReplyForm({ propertyId, review, onDone }: { propertyId: string; review: PublicReview; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review.hostReply ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (text.trim().length < 2) return setError("Écrivez votre réponse.");
    setBusy(true);
    setError(null);
    try {
      await replyToReview(propertyId, review.id, text.trim());
      setOpen(false);
      onDone();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 text-sm font-semibold text-[var(--color-teal)] underline">
        {review.hostReply ? "Modifier ma réponse" : "Répondre publiquement"}
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={600} rows={3} placeholder="Remerciez, précisez, restez courtois : votre réponse est publique." className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={busy}>Publier ma réponse</Button>
    </form>
  );
}

export default function HostReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useAsyncData(`host-reviews-${id}-${version}`, () => getPropertyReviews(id));

  return (
    <AppShell backHref={`/hote/logements/${id}`}>
      <h1 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Avis des voyageurs</h1>
      {loading && !data ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error}</p>
      ) : !data || data.count === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">Aucun avis pour l&apos;instant. Ils arrivent après chaque séjour terminé.</p>
      ) : (
        <>
          <p className="mb-4 flex items-center gap-2 text-sm text-slate-600">
            <Stars value={data.average ?? 0} size="text-xl" />
            <span>
              <strong className="text-[var(--color-ink)]">{data.average?.toString().replace(".", ",")}</strong> / 5 · {data.count} avis
            </span>
          </p>
          <ul className="flex flex-col gap-2">
            {data.items.map((r) => (
              <ReviewItem key={r.id} review={r}>
                <ReplyForm propertyId={id} review={r} onDone={() => setVersion((v) => v + 1)} />
              </ReviewItem>
            ))}
          </ul>
          {data.hasMore && <p className="mt-3 text-center text-xs text-slate-500">Les avis les plus récents sont affichés.</p>}
        </>
      )}
    </AppShell>
  );
}
