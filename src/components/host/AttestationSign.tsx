"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, declineAttestation, getAttestation, signAttestation, type AttestationState } from "@/lib/api";
import { useAsyncData } from "@/lib/use-async-data";

/**
 * Attestation de réservation, côté gérant : visible seulement quand le voyageur l'a demandée
 * (ou qu'elle a déjà été traitée). Le gérant signe, ou refuse en donnant un motif.
 */
export function AttestationSign({ bookingId }: { bookingId: string }) {
  const { data } = useAsyncData(`attestation-host-${bookingId}`, () => getAttestation(bookingId));
  const [fresh, setFresh] = useState<AttestationState | null>(null);
  const state = fresh ?? data;
  const reload = async () => setFresh(await getAttestation(bookingId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  if (!state || !["REQUESTED", "SIGNED", "DECLINED"].includes(state.status)) return null;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      setDeclining(false);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Attestation de réservation</h2>

      {state.status === "REQUESTED" && (
        <>
          <p className="mt-1 text-sm text-slate-600">
            Le voyageur demande une attestation pour ses démarches (pays déclaré : <strong>{state.country ?? "—"}</strong>). Sa réservation est
            payée et son identité est vérifiée.
          </p>
          {declining ? (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Motif du refus (le voyageur le verra)"
                className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
              />
              <Button onClick={() => run(() => declineAttestation(bookingId, reason))} loading={busy} disabled={reason.trim().length < 3}>
                Confirmer le refus
              </Button>
              <Button variant="outline" onClick={() => setDeclining(false)} disabled={busy}>
                Annuler
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <Button
                onClick={() => {
                  if (window.confirm("Vous attestez que cette réservation est confirmée et payée. Signer ?")) void run(() => signAttestation(bookingId));
                }}
                loading={busy}
              >
                Signer l&apos;attestation
              </Button>
              <Button variant="outline" onClick={() => setDeclining(true)} disabled={busy}>
                Refuser
              </Button>
            </div>
          )}
        </>
      )}

      {state.status === "SIGNED" && state.attestation && (
        <p className="mt-2 text-sm text-[var(--color-teal)]">
          ✓ Signée par {state.attestation.signerName}. Code de vérification : <strong>{state.attestation.code}</strong>
        </p>
      )}

      {state.status === "DECLINED" && <p className="mt-2 text-sm text-slate-600">Demande refusée. Motif communiqué : {state.declineReason}</p>}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </section>
  );
}
