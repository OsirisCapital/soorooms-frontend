"use client";

import Link from "next/link";
import { useState } from "react";
import { BarList, DailyChart, StatTile } from "@/components/admin/charts";
import { formatFcfa } from "@/lib/booking-labels";
import {
  ESCROW_STATUS_LABEL,
  financeCsv,
  PAYMENT_METHOD_LABEL,
  type CountAmount,
  type FinanceReport,
} from "@/lib/finance-api";
import { PAYOUT_STATUS_LABEL } from "@/lib/payouts-api";
import { formatPercent, getCurrentFees } from "@/lib/fees-api";
import { useAsyncData } from "@/lib/use-async-data";

const RANGES = [7, 30, 90, 365] as const;
const TEAL = "#1e4a4a";
const TERRACOTTA = "#c1622e";

const countHint = (value: CountAmount, empty: string) =>
  value.count === 0 ? empty : `${value.count} versement${value.count > 1 ? "s" : ""}`;

function downloadCsv(report: FinanceReport, name: string) {
  const blob = new Blob([financeCsv(report.lines)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-${report.days[0]}-${report.days[report.days.length - 1]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Rapport financier, commun à l'équipe finance (`mode="admin"`) et à l'hôte (`mode="host"`) : mêmes
 * chiffres, mais l'hôte ne voit que ses logements (le serveur filtre), et son « revenu » est ce qu'il reçoit.
 */
export function FinanceReportView({ mode, load }: { mode: "admin" | "host"; load: (days: number) => Promise<FinanceReport> }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const { data: r, loading, error } = useAsyncData(`${mode}-finance-${range}`, () => load(range));
  const host = mode === "host";
  const fees = useAsyncData("fees-current", getCurrentFees).data;

  const rangeButtons = (
    <div role="group" aria-label="Période du rapport" className="flex flex-wrap gap-2">
      {RANGES.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={range === value}
          onClick={() => setRange(value)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${range === value ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}
        >
          {value === 365 ? "1 an" : `${value} jours`}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {rangeButtons}
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      </div>
    );
  }
  if (error || !r) {
    return (
      <div className="flex flex-col gap-4">
        {rangeButtons}
        <p className="text-sm text-red-500">{error ?? "Rapport indisponible."}</p>
      </div>
    );
  }

  const empty = r.period.bookings === 0 && r.now.held === 0 && r.period.revenue === 0;

  return (
    <div className="flex flex-col gap-5">
      {rangeButtons}

      <div className="grid grid-cols-2 gap-3">
        {host ? (
          <>
            <StatTile hero label="Net reçu sur la période" value={formatFcfa(r.period.hostNetReleased)} hint={`${countHint(r.payouts.paid, "Aucun versement terminé")} · commission SòôRooms déduite : ${formatFcfa(r.period.commissionEarned)}`} />
            <StatTile label="En séquestre (à recevoir)" value={formatFcfa(r.now.heldNet)} hint="Versé après la confirmation du séjour" />
            <StatTile label="Encaissé auprès des voyageurs" value={formatFcfa(r.period.collected)} hint={`${r.period.bookings} réservation${r.period.bookings > 1 ? "s" : ""} payée${r.period.bookings > 1 ? "s" : ""}`} />
            <StatTile label="À verser par SòôRooms" value={formatFcfa(r.payouts.toSend.amount)} hint={countHint(r.payouts.toSend, "Rien en attente")} />
            <StatTile label="Envoi en cours" value={formatFcfa(r.payouts.inFlight.amount)} hint={countHint(r.payouts.inFlight, "Rien en cours")} />
            {r.payouts.failed.count > 0 && (
              <StatTile label="Versement en échec" value={formatFcfa(r.payouts.failed.amount)} tone="alert" href="/profil/parametres/hote" hint="Vérifiez votre numéro Mobile Money" />
            )}
            {r.now.disputedCount > 0 && <StatTile label="Bloqué par un litige" value={formatFcfa(r.now.disputedAmount)} tone="alert" hint={`${r.now.disputedCount} réservation${r.now.disputedCount > 1 ? "s" : ""}`} />}
            {r.period.refundedCount > 0 && <StatTile label="Remboursé aux voyageurs" value={formatFcfa(r.period.refunded)} hint={`${r.period.refundedCount} réservation${r.period.refundedCount > 1 ? "s" : ""}`} />}
          </>
        ) : (
          <>
            <StatTile hero label="Revenus de la plateforme" value={formatFcfa(r.period.revenue)} hint={`Commissions ${formatFcfa(r.period.commissionEarned)} · boosts ${formatFcfa(r.period.boosts)}`} />
            <StatTile label="Encaissé" value={formatFcfa(r.period.collected)} hint={`${r.period.bookings} réservation${r.period.bookings > 1 ? "s" : ""} payée${r.period.bookings > 1 ? "s" : ""}`} />
            <StatTile label="En séquestre" value={formatFcfa(r.now.held)} hint={`dont commission à venir ${formatFcfa(r.now.heldFee)}`} />
            <StatTile label="Versements à envoyer" value={formatFcfa(r.payouts.toSend.amount)} href="/admin/versements" tone={r.payouts.toSend.count > 0 ? "alert" : "default"} hint={countHint(r.payouts.toSend, "Rien en attente")} />
            <StatTile label="Versements en cours" value={formatFcfa(r.payouts.inFlight.amount)} hint={countHint(r.payouts.inFlight, "Rien en cours")} />
            <StatTile label="Versé aux hôtes" value={formatFcfa(r.payouts.paid.amount)} hint={countHint(r.payouts.paid, "Aucun sur la période")} />
            <StatTile label="Versements en échec" value={formatFcfa(r.payouts.failed.amount)} href="/admin/versements" tone={r.payouts.failed.count > 0 ? "alert" : "default"} hint={countHint(r.payouts.failed, "Aucun échec")} />
            <StatTile label="Bloqué par un litige" value={formatFcfa(r.now.disputedAmount)} href="/admin/litiges" tone={r.now.disputedCount > 0 ? "alert" : "default"} hint={r.now.disputedCount > 0 ? `${r.now.disputedCount} réservation${r.now.disputedCount > 1 ? "s" : ""}` : "Aucun litige"} />
            <StatTile label="Remboursé" value={formatFcfa(r.period.refunded)} hint={`${r.period.refundedCount} réservation${r.period.refundedCount > 1 ? "s" : ""}`} />
          </>
        )}
      </div>

      {empty ? (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">
          {host ? "Aucun paiement sur cette période. Vos revenus apparaîtront ici dès la première réservation payée." : "Aucun paiement sur cette période."}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <DailyChart title="Argent encaissé" unit="FCFA" kind="bar" color={TEAL} days={r.days} values={r.series.collected} />
            <DailyChart title={host ? "Net versé" : "Revenus de la plateforme"} unit="FCFA" kind="line" color={TERRACOTTA} days={r.days} values={r.series.settled} />
          </div>

          <BarList
            title={host ? "Encaissé par logement (FCFA)" : "Logements qui rapportent le plus (FCFA encaissés)"}
            color={TEAL}
            rows={r.byProperty.map((p) => ({ label: `${p.title} · ${p.city}`, value: p.amount }))}
          />
          <BarList
            title="Moyens de paiement (FCFA)"
            color={TERRACOTTA}
            rows={r.byMethod.map((m) => ({ label: `${PAYMENT_METHOD_LABEL[m.method] ?? m.method} · ${m.count}`, value: m.amount }))}
          />

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">Dernières opérations</h3>
              <button
                type="button"
                onClick={() => downloadCsv(r, host ? "mes-revenus" : "finances-soorooms")}
                className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-teal)]"
              >
                Exporter en CSV
              </button>
            </div>
            <ul className="mt-3 divide-y divide-[var(--color-border)]">
              {r.lines.slice(0, 10).map((line) => (
                <li key={`${line.bookingId}-${line.date}`} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-[var(--color-ink)]">{line.property}</p>
                    <p className="shrink-0 text-sm font-semibold text-[var(--color-ink)]">{formatFcfa(line.amount)}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {line.date} · {line.room} · {host ? `net ${formatFcfa(line.net)}` : `commission ${formatFcfa(line.fee)}`}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {ESCROW_STATUS_LABEL[line.escrowStatus]}
                    {line.payoutStatus ? ` · ${PAYOUT_STATUS_LABEL[line.payoutStatus]}` : ""}
                  </p>
                </li>
              ))}
            </ul>
            {r.lines.length > 10 && <p className="mt-2 text-xs text-slate-500">Les {r.lines.length} opérations de la période sont dans l&apos;export CSV.</p>}
          </section>
        </>
      )}

      {host && fees && (
        <p className="rounded-xl bg-[var(--color-teal-100)] px-3 py-2 text-sm text-[var(--color-teal)]">
          Commission SòôRooms actuelle : {formatPercent(fees.hostCommissionPercent)}
          {fees.launchActive && fees.launchEndsAt ? ` (offre de lancement jusqu'au ${fees.launchEndsAt.slice(0, 10)}, puis ${formatPercent(fees.standardHostCommissionPercent)})` : ""}.
        </p>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        {host
          ? "« Net reçu » = ce qui vous a été versé, commission SòôRooms déduite. L'argent reste en séquestre jusqu'à la confirmation du séjour par le voyageur et par vous."
          : "La commission n'est comptée comme gagnée que lorsque le versement à l'hôte est terminé ; avant, elle est « à venir » (dans le séquestre). Les frais prélevés par l'opérateur de paiement ne sont pas encore suivis dans ce rapport."}{" "}
        {!host && (
          <Link href="/admin/versements" className="font-semibold text-[var(--color-terracotta)]">
            Ouvrir les versements
          </Link>
        )}
      </p>
    </div>
  );
}
