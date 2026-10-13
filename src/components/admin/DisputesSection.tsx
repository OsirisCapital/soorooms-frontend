"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { type DisputeDecision, type DisputeItem, type DisputeOutcome, listDisputeQueue, resolveDispute } from "@/lib/disputes-api";
import { useAsyncData } from "@/lib/use-async-data";

const DECISION_LABEL: Record<DisputeDecision, string> = {
  REFUND_FULL: "Rembourser le voyageur en totalité",
  REFUND_PARTIAL: "Rembourser en partie (le reste va à l'hôte)",
  PAY_HOST: "Payer l'hôte (litige écarté)",
};

function Decision({ dispute, canResolve, onDone }: { dispute: DisputeItem; canResolve: boolean; onDone: (outcome: DisputeOutcome) => void }) {
  const [decision, setDecision] = useState<DisputeDecision | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paid = dispute.money?.paid ?? 0;

  if (!dispute.money || paid <= 0) {
    return <p className="mt-3 text-sm text-red-600">Aucun paiement encaissé pour cette réservation : rien à rembourser ni à verser.</p>;
  }
  if (!canResolve) {
    return <p className="mt-3 text-xs text-slate-500">Seule la finance peut trancher un litige.</p>;
  }

  const refund = decision === "REFUND_FULL" ? paid : decision === "REFUND_PARTIAL" ? Number(amount.replace(/\s/g, "")) || 0 : 0;
  const invalidPartial = decision === "REFUND_PARTIAL" && (refund < 1 || refund >= paid);
  const summary =
    decision === "PAY_HOST"
      ? `${formatFcfa(dispute.money.hostPayout)} seront versés à l'hôte (après envoi par la finance). Rien n'est rendu au voyageur.`
      : decision === "REFUND_FULL"
        ? `${formatFcfa(paid)} seront rendus au voyageur, rien pour l'hôte.`
        : decision === "REFUND_PARTIAL" && !invalidPartial
          ? `${formatFcfa(refund)} rendus au voyageur ; le reste (${formatFcfa(paid - refund)}) est partagé entre l'hôte et la plateforme.`
          : null;

  async function submit() {
    if (!decision) return;
    if (!window.confirm(`${DECISION_LABEL[decision]} ?\n\n${summary ?? ""}\n\nCette décision est définitive.`)) return;
    setError(null);
    setBusy(true);
    try {
      onDone(await resolveDispute(dispute.id, { decision, ...(decision === "REFUND_PARTIAL" ? { refundAmount: refund } : {}), note: note.trim() }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-slate-500">Décision</legend>
        {(Object.keys(DECISION_LABEL) as DisputeDecision[]).map((value) => (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${value === decision ? "border-[var(--color-terracotta)] bg-[var(--color-cream)]" : "border-[var(--color-border)]"}`}
          >
            <input type="radio" name={`decision-${dispute.id}`} checked={value === decision} onChange={() => setDecision(value)} />
            <span className="font-medium text-[var(--color-ink)]">{DECISION_LABEL[value]}</span>
          </label>
        ))}
      </fieldset>
      {decision === "REFUND_PARTIAL" && (
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Montant rendu au voyageur (FCFA, moins de {formatFcfa(paid)})
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="ex. 20000"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-[var(--color-ink)]"
          />
        </label>
      )}
      {summary && <p className="rounded-xl bg-[var(--color-cream)] px-3 py-2 text-sm text-[var(--color-ink)]">{summary}</p>}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Motif de la décision, montré au voyageur et à l'hôte (10 caractères minimum)"
        className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy || !decision || invalidPartial || note.trim().length < 10}
        onClick={submit}
        className="rounded-xl bg-[var(--color-terracotta)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Enregistrement…" : "Valider la décision"}
      </button>
    </div>
  );
}

function DisputeCard({ dispute, canResolve, onResolved }: { dispute: DisputeItem; canResolve: boolean; onResolved: (outcome: DisputeOutcome) => void }) {
  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="font-display font-semibold text-[var(--color-teal)]">{dispute.room.property.title}</p>
      <p className="text-sm text-slate-600">
        {dispute.room.name} · {dispute.room.property.city}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {formatDay(dispute.checkInDate)} → {formatDay(dispute.checkOutDate)} · litige ouvert le {formatDay(dispute.openedAt)}
      </p>
      <div className="mt-2 rounded-xl bg-[var(--color-cream)] px-3 py-2 text-sm text-[var(--color-ink)]">
        <p>
          <strong>Voyageur :</strong> {dispute.traveler.fullName} ({dispute.traveler.phone}){dispute.travelerConfirmedAt ? " · a confirmé son arrivée" : ""}
        </p>
        <p className="mt-1">
          <strong>Hôte :</strong> {dispute.host ? `${dispute.host.fullName} (${dispute.host.phone})` : "—"}
          {dispute.hostConfirmedAt ? " · a confirmé l'accueil" : ""}
        </p>
      </div>
      <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">Motif signalé</p>
      <p className="rounded-xl bg-[var(--color-cream)] px-3 py-2 text-sm text-[var(--color-ink)]">{dispute.disputeReason ?? "Aucun motif renseigné."}</p>
      {dispute.money && (
        <p className="mt-2 text-sm text-slate-600">
          Encaissé : <strong>{formatFcfa(dispute.money.paid)}</strong> · part de l&apos;hôte : {formatFcfa(dispute.money.hostPayout)} · frais de service : {formatFcfa(dispute.money.travelerFee)}
        </p>
      )}
      <p className="mt-1 text-xs text-slate-500">
        Pour entendre les deux parties, utilisez les messages de la réservation ou contactez-les directement avant de décider.{" "}
        <Link href={`/admin/support`} className="underline">Support</Link>
      </p>
      <Decision dispute={dispute} canResolve={canResolve} onDone={onResolved} />
    </li>
  );
}

export function DisputesSection({ canResolve = false }: { canResolve?: boolean }) {
  const { data, loading, error } = useAsyncData("admin-disputes-queue", listDisputeQueue);
  const [done, setDone] = useState<Record<string, DisputeOutcome>>({});

  const open = (data ?? []).filter((d) => !(d.id in done));
  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--color-teal)]">Litiges ouverts{data ? ` (${open.length})` : ""}</h2>
      <p className="mt-1 text-sm text-slate-500">
        Les fonds restent bloqués en séquestre jusqu&apos;à votre décision. Elle crée un remboursement et/ou un versement dans les files de la finance ; rien ne part avant leur envoi.
      </p>
      {Object.keys(done).length > 0 && (
        <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Décision enregistrée. Retrouvez l&apos;opération dans <Link href="/admin/remboursements" className="underline">Remboursements</Link> ou <Link href="/admin/versements" className="underline">Versements</Link>.
        </p>
      )}
      {loading ? (
        <div className="mt-3 h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      ) : open.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Aucun litige ouvert.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {open.map((dispute) => (
            <DisputeCard key={dispute.id} dispute={dispute} canResolve={canResolve} onResolved={(outcome) => setDone((d) => ({ ...d, [dispute.id]: outcome }))} />
          ))}
        </ul>
      )}
    </section>
  );
}
