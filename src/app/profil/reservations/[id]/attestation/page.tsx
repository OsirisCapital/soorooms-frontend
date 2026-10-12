"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { ApiError, getAttestation, requestAttestation, type AttestationState } from "@/lib/api";
import { formatDay } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

const SITE = "https://www.soorooms.com";

/** Attestation de réservation : sur demande, pour les voyageurs venant de l'étranger ; sinon le reçu suffit. */
export default function AttestationPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAsyncData(`attestation-${id}`, () => getAttestation(id));
  const [fresh, setFresh] = useState<AttestationState | null>(null);
  const state = fresh ?? data;
  const reload = async () => setFresh(await getAttestation(id));
  const attestation = state?.attestation ?? null;
  const [qr, setQr] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [askError, setAskError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!attestation) return;
    let cancelled = false;
    QRCode.toDataURL(`${SITE}/verifier/${attestation.code}`, { width: 360, margin: 1, color: { dark: "#1e4a4a", light: "#ffffff" } })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [attestation]);

  async function ask() {
    setAskError(null);
    setBusy(true);
    try {
      await requestAttestation(id, country.trim());
      await reload();
    } catch (err) {
      setAskError(err instanceof ApiError ? err.message : "Demande impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const receiptLink = (
    <Link href={`/profil/reservations/${id}/recu`} className="font-semibold text-[var(--color-terracotta)]">
      Voir mon reçu
    </Link>
  );

  const requestForm = (
    <div className="mt-4 flex flex-col gap-3">
      <input
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        placeholder="Votre pays de résidence ou de nationalité"
        aria-label="Pays de résidence ou de nationalité"
        className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      <Button onClick={ask} loading={busy} disabled={country.trim().length < 2}>
        Demander l&apos;attestation à l&apos;hôte
      </Button>
      {askError && <p className="text-sm text-red-500">{askError}</p>}
    </div>
  );

  return (
    <AppShell backHref={`/profil/reservations/${id}`}>
      {loading ? (
        <div className="h-80 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error || !state ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Réservation introuvable."}</p>
      ) : state.status === "SIGNED" && attestation ? (
        <>
          <article className="rounded-2xl bg-white p-6 shadow-sm print:shadow-none">
            <header className="border-b border-[var(--color-border)] pb-4 text-center">
              <p className="font-display text-xl font-bold text-[var(--color-teal)]">SòôRooms</p>
              <h1 className="mt-1 text-lg font-semibold uppercase tracking-wide text-[var(--color-ink)]">Attestation de réservation</h1>
              {!attestation.valid && (
                <p className="mt-2 text-sm font-semibold text-red-500">Cette réservation a été annulée ou remboursée : l&apos;attestation n&apos;est plus valable.</p>
              )}
            </header>

            <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink)]">
              Nous attestons que <strong>{attestation.occupantName}</strong> dispose d&apos;une réservation confirmée et payée à{" "}
              <strong>{attestation.property.title}</strong> ({attestation.property.quarter}, {attestation.property.city}), chambre{" "}
              <strong>{attestation.roomName}</strong>, du <strong>{formatDay(attestation.checkInDate)}</strong> au{" "}
              <strong>{formatDay(attestation.checkOutDate)}</strong>, soit {attestation.nights} nuit{attestation.nights > 1 ? "s" : ""}.
            </p>

            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-slate-500">Référence</dt>
              <dd className="text-right">{attestation.bookingReference}</dd>
              <dt className="text-slate-500">Réservation réglée par</dt>
              <dd className="text-right">{attestation.payerName}</dd>
              <dt className="text-slate-500">Signée par</dt>
              <dd className="text-right">{attestation.signerName}</dd>
              <dt className="text-slate-500">Signée le</dt>
              <dd className="text-right">{formatDay(attestation.signedAt)}</dd>
            </dl>

            <div className="mt-5 flex items-center gap-4 border-t border-[var(--color-border)] pt-4">
              {qr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="QR code de vérification" className="h-24 w-24" />
              )}
              <p className="text-xs text-slate-600">
                Pour vérifier l&apos;authenticité de ce document, scannez le QR code ou saisissez le code{" "}
                <strong className="text-[var(--color-ink)]">{attestation.code}</strong> sur {SITE.replace("https://", "")}/verifier
              </p>
            </div>
          </article>
          <div className="no-print mt-4">
            <Button onClick={() => window.print()}>Imprimer / enregistrer en PDF</Button>
          </div>
        </>
      ) : (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="font-display text-lg font-semibold text-[var(--color-teal)]">Attestation de réservation</h1>
          <p className="mt-2 text-sm text-slate-600">
            L&apos;attestation, signée par l&apos;hôte, sert aux démarches de visa ou de court séjour des voyageurs venant de l&apos;étranger. Pour
            tous les autres, votre reçu fait foi. {receiptLink}
          </p>

          {state.status === "NOT_ELIGIBLE" && (
            <div className="mt-4 rounded-xl bg-[var(--color-cream-soft)] p-3 text-sm text-slate-700">
              <p className="font-semibold">Conditions à remplir :</p>
              <ul className="mt-1 list-disc pl-5">
                {state.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              {state.reasons.some((r) => /identité/i.test(r)) && (
                <Link href="/profil/parametres/hote" className="mt-2 inline-block font-semibold text-[var(--color-terracotta)]">
                  Vérifier mon identité
                </Link>
              )}
            </div>
          )}

          {state.status === "AVAILABLE" && requestForm}

          {state.status === "REQUESTED" && (
            <p className="mt-4 text-sm text-[var(--color-teal)]">✓ Demande envoyée à l&apos;hôte (pays déclaré : {state.country}). Vous serez prévenu dès sa décision.</p>
          )}

          {state.status === "DECLINED" && (
            <>
              <p className="mt-4 text-sm text-red-500">L&apos;hôte n&apos;a pas signé l&apos;attestation. Motif : {state.declineReason}</p>
              {requestForm}
            </>
          )}
        </section>
      )}
    </AppShell>
  );
}
