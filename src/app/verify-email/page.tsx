"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ApiError, isServerUnavailable, verifyEmail } from "@/lib/api";
import { retry } from "@/lib/retry";
import { loadMe } from "@/lib/use-me";

// Le backend gratuit met environ une minute à se réveiller : on réessaie pendant à peu près ce temps-là.
const RETRIES = 7;
const RETRY_DELAY_MS = 8000;

type State =
  | { status: "loading"; waking: boolean }
  | { status: "success"; message: string }
  /** Le serveur a répondu et refusé le lien (inconnu, expiré, adresse changée…). */
  | { status: "invalid"; message: string }
  /** Aucune réponse du serveur après plusieurs essais : le lien n'est PAS en cause. */
  | { status: "unreachable" };

export default function VerifyEmailPage() {
  // useSearchParams impose une frontière Suspense pour la génération statique.
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}

function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>(
    token
      ? { status: "loading", waking: false }
      : { status: "invalid", message: "Ce lien est incomplet. Ouvrez-le depuis l'e-mail que nous vous avons envoyé." },
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    retry(
      async () => {
        const result = await verifyEmail(token);
        // Une réponse vide ou qui n'est pas du JSON (page d'attente d'un hébergeur) n'est pas un succès.
        if (!result || typeof result.message !== "string") throw new TypeError("Réponse inattendue du serveur");
        return result;
      },
      {
        retries: RETRIES,
        delayMs: RETRY_DELAY_MS,
        shouldRetry: isServerUnavailable,
        isCancelled: () => cancelled,
        onRetry: () => {
          if (!cancelled) setState({ status: "loading", waking: true });
        },
      },
    )
      .then((result) => {
        if (cancelled) return;
        setState({ status: "success", message: result.message });
        void loadMe(true); // le profil affichera l'adresse comme vérifiée
      })
      .catch((err) => {
        if (cancelled) return;
        setState(
          isServerUnavailable(err)
            ? { status: "unreachable" }
            : { status: "invalid", message: err instanceof ApiError ? err.message : "Lien de vérification refusé." },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  function handleRetry() {
    setState({ status: "loading", waking: false });
    setAttempt((n) => n + 1);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-cream px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <Logo size={72} />
        </div>

        {state.status === "loading" && (
          <>
            <h1 className="text-2xl font-bold text-[var(--color-teal)]">Vérification en cours…</h1>
            <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-terracotta)] border-t-transparent" />
            {state.waking && (
              <p className="mt-6 text-sm text-slate-500">
                Le serveur se réveille, cela peut prendre jusqu&apos;à une minute. Ne fermez pas cette page.
              </p>
            )}
          </>
        )}

        {state.status === "success" && (
          <>
            <h1 className="text-2xl font-bold text-[var(--color-teal)]">Adresse confirmée</h1>
            <p className="mt-2 text-slate-500">{state.message} Vous pourrez désormais réinitialiser votre mot de passe par e-mail.</p>
            <Link
              href="/home"
              className="mt-6 inline-block w-full rounded-2xl bg-[var(--color-terracotta)] px-5 py-3.5 font-semibold text-white hover:bg-[var(--color-terracotta-dark)]"
            >
              Continuer
            </Link>
          </>
        )}

        {state.status === "unreachable" && (
          <>
            <h1 className="text-2xl font-bold text-[var(--color-teal)]">Serveur injoignable</h1>
            <p className="mt-2 text-slate-500">
              Nous n&apos;avons pas réussi à joindre le serveur. Votre lien n&apos;est pas en cause : il reste valable.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-6 inline-block w-full rounded-2xl bg-[var(--color-terracotta)] px-5 py-3.5 font-semibold text-white hover:bg-[var(--color-terracotta-dark)]"
            >
              Réessayer
            </button>
          </>
        )}

        {state.status === "invalid" && (
          <>
            <h1 className="text-2xl font-bold text-[var(--color-teal)]">Lien non valide</h1>
            <p className="mt-2 text-slate-500">{state.message}</p>
            <p className="mt-2 text-sm text-slate-500">
              Connectez-vous, puis demandez un nouveau lien depuis « Mes informations » dans votre profil.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3.5 font-semibold text-[var(--color-ink)] hover:bg-[var(--color-cream-soft)]"
            >
              Se connecter
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
