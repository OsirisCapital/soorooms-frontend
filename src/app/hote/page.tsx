"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import type { KycStatus } from "@/lib/api";
import { BOOKING_STATUS_LABEL, formatDay, formatFcfa } from "@/lib/booking-labels";
import { loadHostOverview, needsHostAction } from "@/lib/host-data";
import { useAsyncData } from "@/lib/use-async-data";
import { firstNameOf, useMe } from "@/lib/use-me";

const KYC_BANNER: Partial<Record<KycStatus, { text: string; cta?: string }>> = {
  NOT_SUBMITTED: {
    text: "Vérifiez votre identité pour pouvoir publier vos logements.",
    cta: "Compléter ma vérification",
  },
  PENDING_REVIEW: { text: "Vos documents sont en cours de vérification. Vous pourrez publier dès leur validation." },
  REJECTED: { text: "Vos documents ont été refusés.", cta: "Renvoyer mes documents" },
};

function Stat({ value, label, highlight = false }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 text-center shadow-sm ${highlight && value > 0 ? "bg-[var(--color-terracotta)] text-white" : "bg-white"}`}>
      <p className={`text-2xl font-bold ${highlight && value > 0 ? "" : "text-[var(--color-teal)]"}`}>{value}</p>
      <p className={`mt-1 text-xs ${highlight && value > 0 ? "text-white/90" : "text-slate-500"}`}>{label}</p>
    </div>
  );
}

export default function HostDashboardPage() {
  const firstName = firstNameOf(useMe());
  const { data, loading, error } = useAsyncData("host-overview", loadHostOverview);

  const todo = (data?.bookings ?? []).filter(needsHostAction);
  const online = data?.properties.filter((p) => p.status === "ACTIVE").length ?? 0;
  const draft = (data?.properties.length ?? 0) - online;
  const banner = data ? KYC_BANNER[data.kycStatus] : undefined;

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[var(--color-teal)]">
        {firstName ? `Bonjour, ${firstName} !` : "Bonjour !"}
      </h1>
      <p className="mt-1 text-slate-600">Votre tableau de bord hôte.</p>

      {loading ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="h-20 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
          <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
        </div>
      ) : error || !data ? (
        <p className="mt-6 rounded-2xl bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
          {error ?? "Impossible de charger votre tableau de bord."}
        </p>
      ) : (
        <>
          {banner && (
            <section className="mt-6 rounded-2xl border border-[var(--color-terracotta)] bg-white p-4">
              <p className="flex items-start gap-3 text-sm text-[var(--color-ink)]">
                <Icon name="shield" size={22} className="shrink-0 text-[var(--color-terracotta)]" />
                <span>{banner.text}</span>
              </p>
              {banner.cta && (
                <Link href="/profil/parametres/hote" className="mt-3 inline-block text-sm font-semibold text-[var(--color-terracotta)]">
                  {banner.cta}
                </Link>
              )}
            </section>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat value={online} label="En ligne" />
            <Stat value={draft} label="Non publiés" />
            <Stat value={todo.length} label="À traiter" highlight />
          </div>

          <Link
            href="/hote/logements/nouveau"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-terracotta)] px-5 py-3.5 font-semibold text-white hover:bg-[var(--color-terracotta-dark)]"
          >
            <Icon name="plus" size={20} />
            Ajouter un logement
          </Link>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-[var(--color-teal)]">À traiter</h2>
            {todo.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">
                Rien à faire pour l&apos;instant. Les demandes de réservation apparaîtront ici.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {todo.slice(0, 5).map((booking) => (
                  <li key={booking.id}>
                    <Link href={`/hote/reservations/${booking.id}`} className="block rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="truncate font-display font-semibold text-[var(--color-teal)]">{booking.propertyTitle}</h3>
                        <span className="shrink-0 rounded-full bg-[var(--color-teal-100)] px-3 py-1 text-xs font-semibold text-[var(--color-teal)]">
                          {BOOKING_STATUS_LABEL[booking.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatDay(booking.checkInDate)} → {formatDay(booking.checkOutDate)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                        {booking.totalPrice != null
                          ? formatFcfa(booking.totalPrice)
                          : booking.offers[0]
                            ? `Offre : ${formatFcfa(booking.offers[0].amount)}`
                            : "—"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {todo.length > 5 && (
              <Link href="/hote/reservations" className="mt-3 inline-block text-sm font-semibold text-[var(--color-terracotta)]">
                Voir toutes les réservations
              </Link>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
