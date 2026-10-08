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
 * Une tentative ABANDONNÉE (le voyageur a quitté la page de paiement avant la fin) reste « en cours »
 * chez Notch Pay indéfiniment. La vérification AUTOMATIQUE ne doit donc jamais enfermer le voyageur :
 *  - elle ne porte que sur un retour explicite, ou sur une tentative récente, et une seule fois ;
 *  - elle a une durée maximale, même si le serveur gratuit met du temps à se réveiller ;
 *  - elle ne bloque jamais le bouton « Payer », qui crée un nouveau paiement.
 * La vérification manuelle (bouton) reste possible à tout moment.
 */
const RETRIES = 10;
const RETRY_DELAY_MS = 6000;
/** Durée maximale de l'attente automatique, réveil du serveur compris. */
const MAX_WAIT_MS = 90_000;
/** Une requête qui ne répond pas dans ce délai est traitée comme un serveur injoignable. */
const ATTEMPT_TIMEOUT_MS = 20_000;
/** Au-delà, une tentative mémorisée est considérée comme abandonnée : plus de vérification automatique. */
const FRESH_FOR_MS = 15 * 60_000;

const storageKey = (bookingId: string) => `sooroms.pendingPayment.${bookingId}`;

interface PendingPayment {
  reference: string;
  /** Moment du lancement du paiement. */
  at: number;
  /** La vérification automatique a déjà eu lieu une fois : un rechargement ne la relance pas. */
  autoChecked: boolean;
}

function readPending(bookingId: string): PendingPayment | null {
  try {
    const raw = localStorage.getItem(storageKey(bookingId));
    if (!raw) return null;
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw) as Partial<PendingPayment>;
      if (typeof parsed.reference !== "string") return null;
      return { reference: parsed.reference, at: Number(parsed.at) || 0, autoChecked: Boolean(parsed.autoChecked) };
    }
    // Ancienne forme (simple texte) : on la garde pour la vérification manuelle, jamais pour l'automatique.
    return { reference: raw, at: 0, autoChecked: true };
  } catch {
    return null;
  }
}

function writePending(bookingId: string, pending: PendingPayment) {
  try {
    localStorage.setItem(storageKey(bookingId), JSON.stringify(pending));
  } catch {
    // stockage indisponible : le retour fournira la référence dans l'adresse
  }
}

export function rememberPendingPayment(bookingId: string, reference: string) {
  writePending(bookingId, { reference, at: Date.now(), autoChecked: false });
}

function forgetPendingPayment(bookingId: string) {
  try {
    localStorage.removeItem(storageKey(bookingId));
  } catch {
    // sans importance
  }
}

function markAutoChecked(bookingId: string) {
  const pending = readPending(bookingId);
  if (pending) writePending(bookingId, { ...pending, autoChecked: true });
}

/** La référence à vérifier, et la vérification doit-elle partir toute seule ? */
function resolveReference(bookingId: string): { reference: string; automatic: boolean } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromAddress = params.get("reference") ?? params.get("trxref");
    // Retour explicite depuis la page de paiement : on vérifie.
    if (fromAddress) return { reference: fromAddress, automatic: true };
  } catch {
    // pas d'adresse lisible : on regarde la mémoire
  }
  const pending = readPending(bookingId);
  if (!pending) return null;
  const fresh = Date.now() - pending.at <= FRESH_FOR_MS;
  return { reference: pending.reference, automatic: fresh && !pending.autoChecked };
}

/** Retire la référence de l'adresse, pour qu'un rechargement de page ne relance pas la vérification. */
function cleanAddress() {
  try {
    window.history.replaceState(null, "", window.location.pathname);
  } catch {
    // sans importance
  }
}

/** Fait échouer (comme un serveur injoignable) une requête qui traîne, au lieu d'attendre indéfiniment. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TypeError("Délai dépassé")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

class PaymentStillPending extends Error {}

export type PaymentReturnState =
  | { phase: "idle" }
  | { phase: "verifying"; waking: boolean; pending: boolean }
  | { phase: "confirmed" }
  | { phase: "failed" }
  /** Toujours pas confirmé après l'attente : le voyageur peut vérifier à la main, ou recommencer le paiement. */
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
  // Si on arrive avec une référence à vérifier automatiquement, la vérification démarre aussitôt : on
  // affiche donc « vérification en cours » dès le premier affichage plutôt que de passer par un état vide.
  const [state, setState] = useState<PaymentReturnState>(() =>
    active && resolveReference(bookingId)?.automatic
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
    async (reference: string, automatic: boolean) => {
      running.current = true;
      let lastWasPending = false;
      try {
        const result = await retry(
          async () => {
            try {
              const verification = await withTimeout(verifyPaymentReturn(bookingId, reference), ATTEMPT_TIMEOUT_MS);
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
            maxElapsedMs: MAX_WAIT_MS,
            shouldRetry: (error) => error instanceof PaymentStillPending || isServerUnavailable(error),
            isCancelled: () => !mounted.current,
            onRetry: () => {
              if (mounted.current) setState({ phase: "verifying", waking: !lastWasPending, pending: lastWasPending });
            },
          },
        );

        forgetPendingPayment(bookingId);
        if (!mounted.current) return;
        cleanAddress();
        if (result.confirmed) {
          setState({ phase: "confirmed" });
          onConfirmedRef.current();
        } else {
          setState({ phase: "failed" });
        }
      } catch (error) {
        // Verdict non concluant : une vérification automatique ne se relancera plus d'elle-même.
        if (automatic) markAutoChecked(bookingId);
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
    const target = resolveReference(bookingId);
    if (!target || running.current) return false;
    setState({ phase: "verifying", waking: false, pending: false });
    await run(target.reference, false);
    return true;
  }, [bookingId, run]);

  // Au retour de la page de paiement : vérification automatique, une seule fois.
  useEffect(() => {
    if (!active || running.current) return;
    const target = resolveReference(bookingId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- run() ne modifie l'état qu'après des appels réseau, jamais de façon synchrone
    if (target?.automatic) void run(target.reference, true);
  }, [active, bookingId, run]);

  return { state, verify };
}
