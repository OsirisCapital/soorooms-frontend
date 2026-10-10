"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import {
  checkPayout,
  listPayouts,
  markPayoutPaid,
  PAYOUT_CHANNEL_LABEL,
  PAYOUT_STATUS_LABEL,
  sendPayout,
  type PayoutItem,
  type PayoutStatus,
} from "@/lib/payouts-api";
import { useAsyncData } from "@/lib/use-async-data";

const STATUS_STYLE: Record<PayoutStatus, string> = {
  TO_SEND: "bg-[var(--color-cream)] text-[var(--color-ink)]",
  SENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-700",
};

const actionClass =
  "rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60";

function PayoutCard({ payout, onChange }: { payout: PayoutItem; onChange: (next: PayoutItem | null) => void }) {
  const [busy, setBusy] = useState<"send" | "check" | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "send" | "check" | "manual") {
    if (kind === "send") {
      const who = payout.details ? `${payout.details.accountName} (${payout.details.phone})` : "l'hôte";
      if (!window.confirm(`Envoyer ${formatFcfa(payout.amount)} à ${who} ?`)) return;
    }
    let proof = "";
    if (kind === "manual") {
      const who = payout.details ? `${payout.details.accountName} (${payout.details.phone})` : "l'hôte";
      proof = (window.prompt(`Vous avez déjà versé ${formatFcfa(payout.amount)} à ${who} par Orange Money / MTN ?\nSaisissez la référence de l'opération :`) ?? "").trim();
      if (!proof) return;
    }
    setError(null);
    setBusy(kind);
    try {
      onChange(await (kind === "send" ? sendPayout(payout.id) : kind === "check" ? checkPayout(payout.id) : markPayoutPaid(payout.id, proof)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  const target = payout.beneficiary ?? payout.details;
  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-semibold text-[var(--color-teal)]">{payout.propertyTitle}</p>
          <p className="text-sm text-slate-600">
            {payout.city} · {formatDay(payout.checkInDate)} → {formatDay(payout.checkOutDate)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[payout.status]}`}>{PAYOUT_STATUS_LABEL[payout.status]}</span>
      </div>

      <p className="mt-3 text-2xl font-bold text-[var(--color-ink)]">{formatFcfa(payout.amount)}</p>

      <div className="mt-2 rounded-xl bg-[var(--color-cream)] px-3 py-2 text-sm text-[var(--color-ink)]">
        <p>
          <strong>Hôte :</strong> {payout.host?.fullName ?? "—"}
          {payout.host ? ` (${payout.host.phone})` : ""}
        </p>
        {target ? (
          <p className="mt-1">
            <strong>Verser sur :</strong> {target.channel ? PAYOUT_CHANNEL_LABEL[target.channel] : "Mobile Money"} · {target.phone} · {target.accountName}
          </p>
        ) : (
          <p className="mt-1 text-red-600">L&apos;hôte n&apos;a pas encore renseigné son numéro Mobile Money.</p>
        )}
      </div>

      {payout.detailsRecentlyChanged && payout.status !== "PAID" && (
        <p className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-800">
          ⚠ Ce numéro a été modifié il y a moins de 72 h. Vérifiez auprès de l&apos;hôte avant d&apos;envoyer.
        </p>
      )}
      {payout.failureReason && payout.status !== "PAID" && <p className="mt-2 text-sm text-red-600">{payout.failureReason}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <p className="mt-2 text-xs text-slate-500">
        Mise en file le {formatDay(payout.createdAt)}
        {payout.attempts > 0 ? ` · ${payout.attempts} tentative${payout.attempts > 1 ? "s" : ""}` : ""}
        {payout.paidAt ? ` · versé le ${formatDay(payout.paidAt)}` : ""}
      </p>

      {(payout.canSend || payout.canCheck || payout.canMarkPaid) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {payout.canSend && (
            <button type="button" disabled={busy !== null} onClick={() => run("send")} className={`${actionClass} bg-[var(--color-terracotta)] text-white`}>
              {busy === "send" ? "Envoi…" : payout.status === "FAILED" ? "Réessayer l'envoi" : "Envoyer"}
            </button>
          )}
          {payout.canCheck && (
            <button type="button" disabled={busy !== null} onClick={() => run("check")} className={`${actionClass} border border-[var(--color-border)] bg-white text-[var(--color-ink)]`}>
              {busy === "check" ? "Vérification…" : "Vérifier l'état"}
            </button>
          )}
          {payout.canMarkPaid && (
            <button type="button" disabled={busy !== null} onClick={() => run("manual")} className={`${actionClass} border border-[var(--color-border)] bg-white text-[var(--color-ink)]`}>
              {busy === "manual" ? "Enregistrement…" : "Marquer comme versé (manuel)"}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function PayoutList({ view }: { view: "open" | "done" }) {
  const { data, loading, error } = useAsyncData(`admin-payouts-${view}`, () => listPayouts(view));
  const [changes, setChanges] = useState<Record<string, PayoutItem | null>>({});

  if (loading) return <div className="mt-3 h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error) return <p className="mt-3 text-sm text-red-500">{error}</p>;
  const items = (data ?? []).map((p) => (p.id in changes ? changes[p.id] : p)).filter((p): p is PayoutItem => p !== null);
  if (items.length === 0) {
    return (
      <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">
        {view === "open" ? "Aucun versement en attente." : "Aucun versement effectué pour le moment."}
      </p>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {items.map((payout) => (
        <PayoutCard key={payout.id} payout={payout} onChange={(next) => setChanges((c) => ({ ...c, [payout.id]: next }))} />
      ))}
    </ul>
  );
}

export function PayoutsSection() {
  const [view, setView] = useState<"open" | "done">("open");
  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--color-teal)]">Versements aux hôtes</h2>
      <p className="mt-1 text-sm text-slate-500">
        Les réservations confirmées par le voyageur et l&apos;hôte arrivent ici. Vérifiez le numéro puis envoyez : l&apos;argent part par Notch Pay et l&apos;hôte est prévenu.
      </p>
      <div className="mt-3 flex gap-2">
        {(["open", "done"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${view === v ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}
          >
            {v === "open" ? "À traiter" : "Versés"}
          </button>
        ))}
      </div>
      <PayoutList key={view} view={view} />
    </section>
  );
}
