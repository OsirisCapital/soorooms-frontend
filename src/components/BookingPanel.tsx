"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  acceptOffer,
  ApiError,
  confirmCheckin,
  confirmHosting,
  counterOffer,
  getBooking,
  initiatePayment,
  raiseDispute,
  rejectOffer,
  type BookingDetail,
  type OfferStatus,
} from "@/lib/api";
import { BOOKING_STATUS_LABEL, formatDay, formatFcfa, nightsBetween } from "@/lib/booking-labels";

export type Viewer = "TRAVELER" | "HOST";

const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  SUPERSEDED: "Remplacée",
};

/**
 * Détail d'une réservation avec toutes les actions possibles selon son statut,
 * pour le voyageur comme pour l'hôte (le backend vérifie les droits de chacun).
 * Les actions renvoient la réservation à jour : on la garde telle quelle.
 */
export function BookingPanel({ initial, viewer }: { initial: BookingDetail; viewer: Viewer }) {
  const isTraveler = viewer === "TRAVELER";
  const [booking, setBooking] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [counter, setCounter] = useState("");
  const [reason, setReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const bookingId = useRef(initial.id);

  // Au retour d'un autre onglet (paiement, par exemple), on relit l'état : le
  // passage à « Confirmée » est fait par le webhook du backend.
  useEffect(() => {
    function refreshOnReturn() {
      if (document.visibilityState !== "visible") return;
      getBooking(bookingId.current)
        .then(setBooking)
        .catch(() => {});
    }
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => document.removeEventListener("visibilitychange", refreshOnReturn);
  }, []);

  async function run(action: () => Promise<BookingDetail | void>) {
    setError(null);
    setBusy(true);
    try {
      const updated = await action();
      if (updated) setBooking(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const refresh = () => run(() => getBooking(booking.id));

  const nights = nightsBetween(booking.checkInDate.slice(0, 10), booking.checkOutDate.slice(0, 10));
  const current = booking.offers[0];
  const offerFromTraveler = current ? current.proposedByUserId === booking.travelerId : false;
  const offerIsMine = current ? offerFromTraveler === isTraveler : false;
  const otherParty = isTraveler ? "L'hôte" : "Le voyageur";
  const propertyHref = isTraveler
    ? `/logements/${booking.room.property.id}`
    : `/hote/logements/${booking.room.property.id}`;

  const myConfirmedAt = isTraveler ? booking.travelerConfirmedAt : booking.hostConfirmedAt;
  const otherConfirmedAt = isTraveler ? booking.hostConfirmedAt : booking.travelerConfirmedAt;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-[var(--color-teal)]">{booking.room.property.title}</h1>
          <p className="mt-1 text-slate-600">
            {booking.room.name} · {booking.room.property.city}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--color-teal-100)] px-3 py-1 text-xs font-semibold text-[var(--color-teal)]">
          {BOOKING_STATUS_LABEL[booking.status]}
        </span>
      </div>

      <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">
          {formatDay(booking.checkInDate)} → {formatDay(booking.checkOutDate)} · {nights} nuit{nights > 1 ? "s" : ""}
        </p>
        <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
          {booking.totalPrice != null
            ? formatFcfa(booking.totalPrice)
            : current
              ? `Offre en cours : ${formatFcfa(current.amount)}`
              : "—"}
        </p>
        <Link href={propertyHref} className="mt-2 inline-block text-sm font-semibold text-[var(--color-terracotta)]">
          {isTraveler ? "Voir le logement" : "Gérer le logement"}
        </Link>
      </section>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {/* --- Négociation du prix --- */}
      {booking.status === "NEGOTIATING" && current && (
        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Négociation du prix</h2>

          {offerIsMine ? (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Votre offre de <strong>{formatFcfa(current.amount)}</strong> a été envoyée.{" "}
                {isTraveler
                  ? "Actualisez cette page pour voir la réponse de l'hôte."
                  : "Le voyageur doit maintenant répondre."}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Button variant="outline" onClick={refresh} loading={busy}>
                  Actualiser
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Annuler cette réservation ?")) run(() => rejectOffer(booking.id));
                  }}
                >
                  Annuler la réservation
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">
                {otherParty} propose <strong>{formatFcfa(current.amount)}</strong> pour ce séjour.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Button onClick={() => run(() => acceptOffer(booking.id))} loading={busy}>
                  Accepter ce prix
                </Button>

                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={counter}
                    onChange={(e) => setCounter(e.target.value)}
                    placeholder="Ma contre-proposition (FCFA)"
                    aria-label="Contre-proposition en FCFA"
                    className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy || counter.trim() === "" || Number(counter) < 0}
                    onClick={() =>
                      run(async () => {
                        const updated = await counterOffer(booking.id, Number(counter));
                        setCounter("");
                        return updated;
                      })
                    }
                    className="shrink-0 rounded-2xl bg-[var(--color-teal-600)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Proposer
                  </button>
                </div>

                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Refuser cette offre mettra fin à la réservation. Continuer ?")) {
                      run(() => rejectOffer(booking.id));
                    }
                  }}
                >
                  Refuser et annuler
                </Button>
              </div>
            </>
          )}

          <ul className="mt-5 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
            {booking.offers.map((offer) => {
              const fromTraveler = offer.proposedByUserId === booking.travelerId;
              return (
                <li key={offer.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">
                    {fromTraveler === isTraveler ? "Vous" : otherParty} · {formatFcfa(offer.amount)}
                  </span>
                  <span className="text-xs text-slate-500">{OFFER_STATUS_LABEL[offer.status]}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* --- Paiement --- */}
      {booking.status === "PENDING_PAYMENT" && (
        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Paiement</h2>
          {isTraveler ? (
            <>
              <p className="mt-2 text-sm text-slate-600">
                L&apos;hôte a validé le prix. Votre paiement est conservé en séquestre et n&apos;est reversé à l&apos;hôte
                qu&apos;après confirmation du séjour par vous deux.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Button
                  loading={busy}
                  onClick={() =>
                    run(async () => {
                      const payment = await initiatePayment(booking.id);
                      window.location.assign(payment.paymentUrl);
                    })
                  }
                >
                  Payer {booking.totalPrice != null ? formatFcfa(booking.totalPrice) : ""}
                </Button>
                <Button variant="outline" onClick={refresh} disabled={busy}>
                  J&apos;ai payé — actualiser
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Le prix est validé. En attente du paiement du voyageur : les dates seront bloquées une fois le paiement
                confirmé.
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={refresh} loading={busy}>
                  Actualiser
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      {/* --- Séjour confirmé : double validation et litige --- */}
      {booking.status === "CONFIRMED_ESCROW" && (
        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Séjour confirmé</h2>
          <p className="mt-2 text-sm text-slate-600">
            {isTraveler
              ? "Votre paiement est sécurisé. Une fois sur place, confirmez votre arrivée : l'hôte est payé quand vous avez tous les deux confirmé."
              : "Le voyageur a payé, les fonds sont en séquestre. Confirmez l'hébergement une fois le voyageur installé : vous êtes payé quand vous avez tous les deux confirmé."}
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {myConfirmedAt ? (
              <p className="rounded-xl bg-[var(--color-teal-100)] px-4 py-3 text-sm text-[var(--color-teal)]">
                Vous avez confirmé.{" "}
                {otherConfirmedAt ? `${otherParty} aussi.` : `En attente de la confirmation ${isTraveler ? "de l'hôte" : "du voyageur"}.`}
              </p>
            ) : (
              <Button
                onClick={() => run(() => (isTraveler ? confirmCheckin(booking.id) : confirmHosting(booking.id)))}
                loading={busy}
              >
                {isTraveler ? "Je confirme mon arrivée" : "Je confirme l'hébergement"}
              </Button>
            )}

            {!showDispute ? (
              <Button variant="outline" onClick={() => setShowDispute(true)} disabled={busy}>
                Signaler un problème
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Décrivez le problème rencontré (10 caractères minimum)"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none"
                />
                <Button
                  variant="outline"
                  disabled={busy || reason.trim().length < 10}
                  onClick={() => run(() => raiseDispute(booking.id, reason.trim()))}
                >
                  Envoyer le signalement
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {booking.status === "COMPLETED" && (
        <p className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          Séjour terminé : les deux parties ont confirmé et le paiement a été libéré à l&apos;hôte.
        </p>
      )}

      {booking.status === "DISPUTED" && (
        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Litige en cours</h2>
          <p className="mt-2 text-sm text-slate-600">
            Les fonds restent bloqués en attendant une résolution.
            {booking.disputeReason ? ` Motif signalé : « ${booking.disputeReason} »` : ""}
          </p>
        </section>
      )}

      {booking.status === "CANCELLED" && (
        <p className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">Cette réservation a été annulée.</p>
      )}
    </>
  );
}
