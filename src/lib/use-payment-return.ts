"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, isServerUnavailable, verifyPaymentReturn } from "@/lib/api";
import { retry } from "@/lib/retry";

/**
 * Vérification du paiement au RETOUR du voyageur sur la réservation, sans dépendre d'un webhook.
 *
 * La référence vient de l'adresse de retour (Notch Pay y joint `reference`) ou, à défaut, de celle
 * mémorisée au moment du lancement du paiement. Le serveur ne la croit jamais sur parole : il la
 * relit chez Notch Pay et vérifie qu'elle désigne bien cette réservation, au bon montant.
 *
 * On réessaie tant que le paiement est « en cours » (le voyageur valide sur son téléphone) ou que le
 * serveur gratuit se réveille (environ une minute).
 */
const RETRIES = 10;
const RETRY_DELAY_MS = 6000;

const storageKey = (bookingId: string) => `sooroms.pendingPayment.${bookingId}`;

export function rememberPendingPayment(bookingId: string, reference: string) {
  try {
    localStorage.setItem(storageKey(bookingId), reference);
  } catch {
    // stockage indisponible : le retour fournira la référence dans l'adresse
  }
}

function forgetPendingPayment(bookingId: string) {
  try {
    localStorage.removeItem(storageKey(bookingId));
  } catch {
    // sans importance
  }
}

function readReturnReference(bookingId: string): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("reference") ?? params.get("trxref") ?? localStorage.getItem(storageKey(bookingId));
  } catch {
    return null;
  }
}

/** Retire la référence de l'adresse, pour qu'un rechargement de page ne relance pas la vérification. */
function cleanAddress() {
  try {
    window.history.replaceState(null, "", window.location.pathname);
  } catch {
    // sans importance
  }
}

class PaymentStillPending extends Error {}

export type PaymentReturnState =
  | { phase: "idle" }
  | { phase: "verifying"; waking: boolean; pending: boolean }
  | { phase: "confirmed" }
  | { phase: "failed" }
  /** Toujours pas confirmé après plusieurs minutes d'attente : le voyageur peut relancer à la main. */
  | { phase: "pending" }
  | { phase: "error"; message: string };

export function usePaymentReturn({
  bookingId,
  active,
  onConfirmed,
}: {
  bookingId: string;
  /** Vrai seulement quand une vérification a un sens (voyageur, réservation en attente de paiement). */
  active: boolean;
  onConfirmed: () => void;
}) {
  // Si on arrive avec une référence de paiement, la vérification démarre aussitôt : on affiche donc
  // « vérification en cours » dès le premier affichage plutôt que de passer par un état vide.
  const [state, setState] = useState<PaymentReturnState>(() =>
    active && readReturnReference(bookingId)
      ? { phase: "verifying", waking: false, pending: false }
      : { phase: "idle" },
  );
  const running = useRef(false);
  const mounted = useRef(true);
  const onConfirmedRef = useRef(onConfirmed);

  useEffect(() => {
    onConfirmedRef.current = onConfirmed;
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (reference: string) => {
      running.current = true;
      let lastWasPending = false;
      try {
        const result = await retry(
          async () => {
            try {
              const verification = await verifyPaymentReturn(bookingId, reference);
              if (!verification || typeof verification.paymentStatus !== "string") {
                throw new TypeError("Réponse inattendue du serveur");
              }
              if (verification.paymentStatus === "PENDING") throw new PaymentStillPending();
              return verification;
            } catch (error) {
              lastWasPending = error instanceof PaymentStillPending;
              throw error;
            }
          },
          {
            retries: RETRIES,
            delayMs: RETRY_DELAY_MS,
            shouldRetry: (error) => error instanceof PaymentStillPending || isServerUnavailable(error),
            isCancelled: () => !mounted.current,
            onRetry: () => {
              if (mounted.current) setState({ phase: "verifying", waking: !lastWasPending, pending: lastWasPending });
            },
          },
        );

        if (!mounted.current) return;
        forgetPendingPayment(bookingId);
        cleanAddress();
        if (result.confirmed) {
          setState({ phase: "confirmed" });
          onConfirmedRef.current();
        } else {
          setState({ phase: "failed" });
        }
      } catch (error) {
        if (!mounted.current) return;
        if (error instanceof PaymentStillPending) {
          setState({ phase: "pending" });
        } else if (isServerUnavailable(error)) {
          setState({
            phase: "error",
            message: "Serveur injoignable pour le moment. Réessayez dans un instant : votre paiement n'est pas perdu.",
          });
        } else {
          setState({ phase: "error", message: error instanceof ApiError ? error.message : "Vérification impossible. Réessayez." });
        }
      } finally {
        running.current = false;
      }
    },
    [bookingId],
  );

  /** À l'appel d'un bouton. Renvoie false si rien n'a été lancé (aucune référence connue, ou vérification déjà en cours). */
  const verify = useCallback(async (): Promise<boolean> => {
    const reference = readReturnReference(bookingId);
    if (!reference || running.current) return false;
    setState({ phase: "verifying", waking: false, pending: false });
    await run(reference);
    return true;
  }, [bookingId, run]);

  // Au retour de la page de paiement : vérification automatique, une seule fois.
  useEffect(() => {
    if (!active || running.current) return;
    const reference = readReturnReference(bookingId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- run() ne modifie l'état qu'après des appels réseau, jamais de façon synchrone
    if (reference) void run(reference);
  }, [active, bookingId, run]);

  return { state, verify };
}
