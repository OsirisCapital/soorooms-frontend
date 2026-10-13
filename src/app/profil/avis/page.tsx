"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Stars } from "@/components/Stars";
import { listMyReviews } from "@/lib/reviews-api";
import { useAsyncData } from "@/lib/use-async-data";

export default function AvisPage() {
  const { data, loading, error } = useAsyncData("my-reviews", () => listMyReviews());

  return (
    <AppShell title="Mes avis" backHref="/profil">
      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error}</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-slate-600">Vous n&apos;avez pas encore laissé d&apos;avis.</p>
          <p className="mt-2 text-sm text-slate-500">Après un séjour terminé, ouvrez la réservation pour noter votre hébergement.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <Link href={`/logements/${r.property.id}`} className="font-medium text-[var(--color-teal)] underline">
                {r.property.title}
              </Link>
              <p className="text-xs text-slate-500">
                {r.property.city} · {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="mt-2">
                <Stars value={r.rating} size="text-xl" />
              </div>
              {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-[var(--color-ink)]">{r.comment}</p>}
              {r.hostReply && (
                <p className="mt-3 rounded-xl bg-[var(--color-cream-soft)] p-3 text-sm text-slate-700">
                  <strong>Réponse de l&apos;hôte :</strong> {r.hostReply}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
