"use client";

import { AppShell } from "@/components/AppShell";
import { getMyLoyalty } from "@/lib/api";
import { formatDay } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

const REASON_LABEL: Record<string, string> = {
  STAY_COMPLETED: "Séjour terminé",
  FIRST_STAY_BONUS: "Bonus premier séjour",
};

export default function PointsPage() {
  const { data, loading, error } = useAsyncData("my-loyalty", getMyLoyalty);

  return (
    <AppShell title="Mes points" backHref="/profil">
      {loading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-[var(--color-cream-soft)]" />
      ) : error || !data ? (
        <p className="text-sm text-red-500">{error ?? "Impossible de charger vos points."}</p>
      ) : (
        <>
          <section className="rounded-3xl bg-[var(--color-teal)] p-6 text-center text-white shadow-sm">
            <p className="text-sm opacity-80">Votre solde</p>
            <p className="mt-1 text-5xl font-bold">{data.balance.toLocaleString("fr-FR")}</p>
            <p className="mt-1 text-sm opacity-80">point{data.balance > 1 ? "s" : ""}</p>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Bientôt, vos points serviront à</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-[var(--color-ink)]">
              {data.upcomingUses.map((use) => (
                <li key={use} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-[var(--color-terracotta)]">★</span>
                  {use}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">Continuez à cumuler : vos points sont conservés.</p>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Comment gagner des points</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {data.rules.map((rule) => (
                <li key={rule.reason}>
                  <p className="font-medium text-[var(--color-ink)]">{rule.title}</p>
                  <p className="text-sm text-slate-500">{rule.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Historique</h2>
            {data.entries.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm">
                Aucun point pour l&apos;instant. Vos premiers points arrivent à la fin de votre premier séjour.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {data.entries.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">{REASON_LABEL[entry.reason] ?? entry.reason}</p>
                      <p className="truncate text-xs text-slate-500">
                        {entry.label ? `${entry.label} · ` : ""}
                        {formatDay(entry.createdAt)}
                      </p>
                    </div>
                    <p className={`shrink-0 font-semibold ${entry.points >= 0 ? "text-[var(--color-teal)]" : "text-red-500"}`}>
                      {entry.points > 0 ? "+" : ""}
                      {entry.points.toLocaleString("fr-FR")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
