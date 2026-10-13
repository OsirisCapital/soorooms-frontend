"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, type BookingDetail } from "@/lib/api";
import { formatFcfa } from "@/lib/booking-labels";
import { cancelBooking, getCancellationPreview, saveRefundDetails, type CancellationPreview } from "@/lib/cancel-api";
import { PAYOUT_CHANNEL_LABEL, type PayoutChannel } from "@/lib/payouts-api";

const inputClass = "rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-[var(--color-ink)]";

function MobileMoneyFields({
  channel, phone, name, onChannel, onPhone, onName,
}: {
  channel: PayoutChannel; phone: string; name: string;
  onChannel: (v: PayoutChannel) => void; onPhone: (v: string) => void; onName: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-slate-500">Opérateur</legend>
        {(Object.keys(PAYOUT_CHANNEL_LABEL) as PayoutChannel[]).map((value) => (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${value === channel ? "border-[var(--color-terracotta)] bg-[var(--color-cream)]" : "border-[var(--color-border)]"}`}
          >
            <input type="radio" name="refund-channel" value={value} checked={value === channel} onChange={() => onChannel(value)} />
            <span className="font-medium text-[var(--color-ink)]">{PAYOUT_CHANNEL_LABEL[value]}</span>
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Numéro Mobile Money
        <input type="tel" inputMode="tel" value={phone} onChange={(e) => onPhone(e.target.value)} placeholder="6 70 00 00 00" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Nom du titulaire du compte
        <input type="text" maxLength={80} value={name} onChange={(e) => onName(e.target.value)} placeholder="Comme enregistré chez l'opérateur" className={inputClass} />
      </label>
    </div>
  );
}

/** Bouton « Annuler la réservation » : montre d'abord ce qui sera remboursé, puis demande confirmation. */
export function CancelBooking({
  bookingId,
  viewer,
  onCancelled,
}: {
  bookingId: string;
  viewer: "TRAVELER" | "HOST";
  onCancelled: (booking: BookingDetail) => void;
}) {
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [channel, setChannel] = useState<PayoutChannel>("cm.mtn");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  async function start() {
    setError(null);
    setBusy(true);
    try {
      setPreview(await getCancellationPreview(bookingId));
      setOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de calculer le remboursement. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!preview?.canCancel) return;
    if (preview.needsRefundNumber && (phone.trim().length < 8 || name.trim().length < 2)) {
      setError("Indiquez le numéro Mobile Money et le nom du titulaire pour recevoir votre remboursement.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const done = await cancelBooking(bookingId, {
        reason: reason.trim() || undefined,
        ...(preview.needsRefundNumber ? { refundChannel: channel, refundPhone: phone.trim(), refundName: name.trim() } : {}),
      });
      onCancelled(done);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Annulation impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
      {!open ? (
        <>
          <Button variant="outline" onClick={start} loading={busy}>
            Annuler la réservation
          </Button>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </>
      ) : preview && !preview.canCancel ? (
        <>
          <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Annulation impossible</h2>
          <p className="mt-2 text-sm text-slate-600">{preview.reason}</p>
          <div className="mt-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
          </div>
        </>
      ) : preview ? (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Annuler cette réservation ?</h2>
          {preview.paid > 0 ? (
            <div className="rounded-xl bg-[var(--color-cream)] px-4 py-3 text-sm text-[var(--color-ink)]">
              <p>{preview.label}</p>
              <p className="mt-2">
                <strong>{viewer === "HOST" ? "Remboursé au voyageur" : "Vous serez remboursé de"} :</strong> {formatFcfa(preview.refund)}
              </p>
              {preview.retained > 0 && (
                <p className="mt-1 text-slate-600">Non remboursé : {formatFcfa(preview.retained)}</p>
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-[var(--color-cream)] px-4 py-3 text-sm text-[var(--color-ink)]">{preview.label}</p>
          )}
          {viewer === "TRAVELER" && preview.paid > 0 && (
            <p className="text-xs text-slate-500">
              Règles détaillées dans la <Link href="/remboursement" className="underline">politique de remboursement</Link>. Le remboursement est vérifié par notre équipe puis envoyé par Mobile Money.
            </p>
          )}
          {preview.needsRefundNumber && (
            <MobileMoneyFields channel={channel} phone={phone} name={name} onChannel={setChannel} onPhone={setPhone} onName={setName} />
          )}
          {viewer === "HOST" && preview.paid > 0 && (
            <p className="text-xs text-slate-500">Le voyageur sera prévenu et indiquera lui-même où recevoir son remboursement.</p>
          )}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Motif (facultatif)"
            className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={confirm} loading={busy}>Confirmer l&apos;annulation</Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Garder la réservation</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Suivi du remboursement d'une réservation annulée, et saisie du numéro s'il manque. */
export function RefundStatus({ bookingId, refund, onSaved }: { bookingId: string; refund: NonNullable<BookingDetail["refund"]>; onSaved: () => void }) {
  const [channel, setChannel] = useState<PayoutChannel>("cm.mtn");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editable = refund.status === "TO_SEND" || refund.status === "FAILED";

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await saveRefundDetails(bookingId, { channel, phone: phone.trim(), accountName: name.trim() });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const headline =
    refund.status === "PAID"
      ? `Remboursement de ${formatFcfa(refund.amount)} envoyé sur votre compte Mobile Money.`
      : refund.status === "SENDING" || refund.status === "PROCESSING"
        ? `Remboursement de ${formatFcfa(refund.amount)} en cours d'envoi.`
        : `Remboursement de ${formatFcfa(refund.amount)} prévu : notre équipe le vérifie puis l'envoie par Mobile Money.`;

  return (
    <section className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm text-[var(--color-ink)]">{headline}</p>
      {editable && !refund.hasNumber && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-slate-600">Indiquez où recevoir ce remboursement :</p>
          <MobileMoneyFields channel={channel} phone={phone} name={name} onChannel={setChannel} onPhone={setPhone} onName={setName} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={save} loading={busy} disabled={phone.trim().length < 8 || name.trim().length < 2}>Enregistrer mon numéro</Button>
        </div>
      )}
    </section>
  );
}
