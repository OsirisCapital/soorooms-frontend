"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { getReceipt } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { PAYMENT_METHOD_LABEL } from "@/lib/finance-api";
import { useAsyncData } from "@/lib/use-async-data";

/** Reçu simple du voyageur, imprimable ou à enregistrer en PDF depuis le navigateur. */
export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { data: receipt, loading, error } = useAsyncData(`receipt-${id}`, () => getReceipt(id));

  return (
    <AppShell backHref={`/profil/reservations/${id}`}>
      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error || !receipt ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Reçu introuvable."}</p>
      ) : (
        <>
          <article className="rounded-2xl bg-white p-6 shadow-sm print:shadow-none">
            <header className="border-b border-[var(--color-border)] pb-4">
              <p className="font-display text-xl font-bold text-[var(--color-teal)]">SòôRooms</p>
              <h1 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">Reçu de réservation</h1>
              <p className="mt-1 text-sm text-slate-500">
                Référence <strong className="text-[var(--color-ink)]">{receipt.reference}</strong> · émis le {formatDay(receipt.issuedAt)}
              </p>
            </header>

            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">{receipt.guestName ? "Payeur" : "Voyageur"}</dt>
              <dd className="text-right text-[var(--color-ink)]">{receipt.travelerName}</dd>
              {receipt.guestName && (
                <>
                  <dt className="text-slate-500">Séjour pour</dt>
                  <dd className="text-right text-[var(--color-ink)]">{receipt.guestName}</dd>
                </>
              )}
              <dt className="text-slate-500">Logement</dt>
              <dd className="text-right text-[var(--color-ink)]">
                {receipt.property.title}
                <span className="block text-xs text-slate-500">
                  {receipt.property.city} · {receipt.property.quarter}
                </span>
              </dd>
              <dt className="text-slate-500">Chambre</dt>
              <dd className="text-right text-[var(--color-ink)]">{receipt.roomName}</dd>
              <dt className="text-slate-500">Séjour</dt>
              <dd className="text-right text-[var(--color-ink)]">
                {formatDay(receipt.checkInDate)} → {formatDay(receipt.checkOutDate)}
                <span className="block text-xs text-slate-500">
                  {receipt.nights} nuit{receipt.nights > 1 ? "s" : ""}
                </span>
              </dd>
              <dt className="text-slate-500">Paiement</dt>
              <dd className="text-right text-[var(--color-ink)]">{PAYMENT_METHOD_LABEL[receipt.paymentMethod] ?? receipt.paymentMethod}</dd>
            </dl>

            <div className="mt-5 border-t border-[var(--color-border)] pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Prix du séjour (convenu avec l&apos;hôte)</span>
                <span>{formatFcfa(receipt.stayPrice)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-slate-600">
                  Frais de service{receipt.travelerFeePercent !== null ? ` (${receipt.travelerFeePercent} %)` : ""}
                </span>
                <span>{formatFcfa(receipt.travelerFee)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-[var(--color-border)] pt-3 text-base font-semibold text-[var(--color-teal)]">
                <span>Total payé</span>
                <span>{formatFcfa(receipt.totalPaid)}</span>
              </div>
              {receipt.refunded && <p className="mt-3 text-xs font-semibold text-[var(--color-terracotta-dark)]">Cette réservation a été remboursée.</p>}
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Ce reçu atteste du paiement effectué sur SòôRooms. Les fonds sont conservés en séquestre puis reversés à l&apos;hôte une fois le séjour confirmé par les deux parties.
            </p>
          </article>

          <div className="no-print mt-4">
            <Button onClick={() => window.print()}>Imprimer / enregistrer en PDF</Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
