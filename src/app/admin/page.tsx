"use client";

import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { BarList, DailyChart, StatTile } from "@/components/admin/charts";
import { getAdminOverview, getAdminTimeseries } from "@/lib/admin-api";
import { formatFcfa } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

const RANGES = [7, 30, 90] as const;
const TEAL = "#1e4a4a";
const TERRACOTTA = "#c1622e";

const BOOKING_STATUS_LABEL: Record<string, string> = {
  NEGOTIATING: "En négociation",
  PENDING_PAYMENT: "En attente de paiement",
  CONFIRMED_ESCROW: "Payées (fonds sécurisés)",
  COMPLETED: "Terminées",
  DISPUTED: "En litige",
  CANCELLED: "Annulées",
};

function Dashboard() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const overview = useAsyncData("admin-overview", getAdminOverview);
  const series = useAsyncData(`admin-series-${range}`, () => getAdminTimeseries(range));

  if (overview.loading) return <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (overview.error || !overview.data) return <p className="text-sm text-red-500">{overview.error ?? "Statistiques indisponibles."}</p>;

  const o = overview.data;
  const delta = o.users.newLast7Days - o.users.previous7Days;
  const deltaText = delta === 0 ? "Stable par rapport à la semaine précédente" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} par rapport à la semaine précédente`;
  const activeProps = o.properties.byStatus.ACTIVE;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <StatTile hero label="Volume réservé" value={formatFcfa(o.money.volumeBooked)} hint={`${formatFcfa(o.money.heldInEscrow)} sécurisés en attente · commissions ${formatFcfa(o.money.platformFeesEarned)}`} />
        <StatTile label="Utilisateurs" value={o.users.total.toLocaleString("fr-FR")} hint={`+${o.users.newLast7Days} sur 7 jours. ${deltaText}`} />
        <StatTile label="Hôtes" value={o.users.hosts.toLocaleString("fr-FR")} hint={`${o.users.travelers.toLocaleString("fr-FR")} voyageurs`} />
        <StatTile label="Logements actifs" value={activeProps.toLocaleString("fr-FR")} hint={`${o.properties.total} au total`} />
        <StatTile label="Réservations" value={o.bookings.total.toLocaleString("fr-FR")} />
        <StatTile label="Identités à examiner" value={o.kyc.pending.toLocaleString("fr-FR")} href="/admin/accreditations" tone={o.kyc.pending > 0 ? "alert" : "default"} hint={o.kyc.pending > 0 ? "À traiter" : "Rien en attente"} />
        <StatTile label="Litiges ouverts" value={o.bookings.disputed.toLocaleString("fr-FR")} href="/admin/litiges" tone={o.bookings.disputed > 0 ? "alert" : "default"} hint={o.bookings.disputed > 0 ? "À traiter" : "Aucun litige"} />
      </div>

      <div role="group" aria-label="Période des graphiques" className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={range === r}
            onClick={() => setRange(r)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${range === r ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}
          >
            {r} jours
          </button>
        ))}
      </div>

      {series.loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : series.error || !series.data ? (
        <p className="text-sm text-red-500">{series.error ?? "Courbes indisponibles."}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <DailyChart title="Inscriptions" unit="inscriptions" kind="bar" color={TEAL} days={series.data.days} values={series.data.signups} />
          <DailyChart title="Réservations créées" unit="réservations" kind="bar" color={TERRACOTTA} days={series.data.days} values={series.data.bookings} />
          <DailyChart title="Volume réservé" unit="FCFA" kind="line" color={TERRACOTTA} days={series.data.days} values={series.data.volume} format={(v) => v.toLocaleString("fr-FR")} />
        </div>
      )}

      <BarList
        title="Réservations par statut"
        color={TEAL}
        rows={Object.entries(o.bookings.byStatus).map(([status, value]) => ({ label: BOOKING_STATUS_LABEL[status] ?? status, value }))}
      />
      <BarList title="Logements par ville" color={TERRACOTTA} rows={o.properties.topCities.map((c) => ({ label: c.city, value: c.count }))} />
    </div>
  );
}

export default function AdminDashboardPage() {
  return <AdminFrame permission="dashboard.view">{() => <Dashboard />}</AdminFrame>;
}
