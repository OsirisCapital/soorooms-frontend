"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { PAYOUT_CHANNEL_LABEL, type PayoutStatus } from "@/lib/payouts-api";
import { checkRefund, listRefunds, markRefundPaid, REFUND_REASON_LABEL, REFUND_STATUS_LABEL, sendRefund, type RefundItem } from "@/lib/refunds-api";
import { useAsyncData } from "@/lib/use-async-data";

const STATUS_STYLE: Record<PayoutStatus, string> = {
  TO_SEND: "bg-[var(--color-cream)] text-[var(--color-ink)]",
  SENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-700",
};

const actionClass = "rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60";

function RefundCard({ refund, onChange }: { refund: RefundItem; onChange: (next: RefundItem | null) => void }) {
  const [busy, setBusy] = useState<"send" | "check" | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const target = refund.beneficiary;
  const who = target ? `${target.accountName} (${target.phone})` : "le voyageur";

  async function run(kind: "send" | "check" | "manual") {
    if (kind === "send" && !window.confirm(`Rembourser ${formatFcfa(refund.amount)} à ${who} ?`)) return;
    let proof = "";
    if (kind === "manual") {
      proof = (window.prompt(`Vous avez déjà remboursé ${formatFcfa(refund.amount)} à ${who} par Orange Money / MTN ?\nSaisissez la référence de l'opération :`) ?? "").trim();
      if (!proof) return;
    }
    setError(null);
    setBusy(kind);
    try {
      onChange(await (kind === "send" ? sendRefund(refund.id) : kind === "check" ? checkRefund(refund.id) : markRefundPaid(refund.id, proof)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-semibold text-[var(--color-teal)]">{refund.propertyTitle}</p>
          <p className="text-sm text-slate-600">
            {refund.city} · {formatDay(refund.checkInDate)} → {formatDay(refund.checkOutDate)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[refund.status]}`}>{REFUND_STATUS_LABEL[refund.status]}</span>
      </div>

      <p className="mt-3 text-2xl font-bold text-[var(--color-ink)]">{formatFcfa(refund.amount)}</p>
      <p className="text-sm text-slate-600">{REFUND_REASON_LABEL[refund.reason] ?? refund.reason}</p>

      <div className="mt-2 rounded-xl bg-[var(--color-cream)] px-3 py-2 text-sm text-[var(--color-ink)]">
        <p>
          <strong>Voyageur :</strong> {refund.traveler?.fullName ?? "—"}
          {refund.traveler ? ` (${refund.traveler.phone})` : ""}
        </p>
        {target ? (
          <p className="mt-1">
            <strong>Rembourser sur :</strong> {target.channel ? PAYOUT_CHANNEL_LABEL[target.channel] : "Mobile Money"} · {target.phone} · {target.accountName}
          </p>
        ) : (
          <p className="mt-1 text-red-600">Le voyageur n&apos;a pas encore indiqué son numéro Mobile Money (il est invité à le faire sur sa réservation).</p>
        )}
      </div>

      {refund.failureReason && refund.status !== "PAID" && <p className="mt-2 text-sm text-red-600">{refund.failureReason}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <p className="mt-2 text-xs text-slate-500">
        Demandé le {formatDay(refund.createdAt)}
        {refund.attempts > 0 ? ` · ${refund.attempts} tentative${refund.attempts > 1 ? "s" : ""}` : ""}
        {refund.paidAt ? ` · remboursé le ${formatDay(refund.paidAt)}` : ""}
      </p>

      {(refund.canSend || refund.canCheck || refund.canMarkPaid) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {refund.canSend && (
            <button type="button" disabled={busy !== null} onClick={() => run("send")} className={`${actionClass} bg-[var(--color-terracotta)] text-white`}>
              {busy === "send" ? "Envoi…" : refund.status === "FAILED" ? "Réessayer l'envoi" : "Envoyer"}
            </button>
          )}
          {refund.canCheck && (
            <button type="button" disabled={busy !== null} onClick={() => run("check")} className={`${actionClass} border border-[var(--color-border)] bg-white text-[var(--color-ink)]`}>
              {busy === "check" ? "Vérification…" : "Vérifier l'état"}
            </button>
          )}
          {refund.canMarkPaid && (
            <button type="button" disabled={busy !== null} onClick={() => run("manual")} className={`${actionClass} border border-[var(--color-border)] bg-white text-[var(--color-ink)]`}>
              {busy === "manual" ? "Enregistrement…" : "Marquer comme remboursé (manuel)"}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function RefundList({ view }: { view: "open" | "done" }) {
  const { data, loading, error } = useAsyncData(`admin-refunds-${view}`, () => listRefunds(view));
  const [changes, setChanges] = useState<Record<string, RefundItem | null>>({});

  if (loading) return <div className="mt-3 h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error) return <p className="mt-3 text-sm text-red-500">{error}</p>;
  const items = (data ?? []).map((r) => (r.id in changes ? changes[r.id] : r)).filter((r): r is RefundItem => r !== null);
  if (items.length === 0) {
    return (
      <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">
        {view === "open" ? "Aucun remboursement en attente." : "Aucun remboursement effectué pour le moment."}
      </p>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {items.map((refund) => (
        <RefundCard key={refund.id} refund={refund} onChange={(next) => setChanges((c) => ({ ...c, [refund.id]: next }))} />
      ))}
    </ul>
  );
}

export function RefundsSection() {
  const [view, setView] = useState<"open" | "done">("open");
  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--color-teal)]">Remboursements aux voyageurs</h2>
      <p className="mt-1 text-sm text-slate-500">
        Les annulations donnant droit à un remboursement arrivent ici. Vérifiez le numéro puis envoyez : l&apos;argent part par Notch Pay et le voyageur est prévenu.
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
            {v === "open" ? "À traiter" : "Remboursés"}
          </button>
        ))}
      </div>
      <RefundList key={view} view={view} />
    </section>
  );
}
