"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ApiError, verifyEmail } from "@/lib/api";
import { loadMe } from "@/lib/use-me";

type State = { status: "loading" } | { status: "success"; message: string } | { status: "error"; message: string };

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
  const [state, setState] = useState<State>(
    token
      ? { status: "loading" }
      : { status: "error", message: "Ce lien est incomplet. Ouvrez-le depuis l'e-mail que nous vous avons envoyé." },
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmail(token)
      .then((result) => {
        if (cancelled) return;
        setState({ status: "success", message: result.message });
        void loadMe(true); // le profil affichera l'adresse comme vérifiée
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof ApiError ? err.message : "Vérification impossible. Réessayez dans un instant.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

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

        {state.status === "error" && (
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
