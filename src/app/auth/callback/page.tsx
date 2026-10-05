"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { saveTokens } from "@/lib/auth-storage";

/**
 * Arrivée après la connexion Google. Le backend redirige ici avec les tokens
 * dans le fragment de l'URL (#accessToken=…&refreshToken=…) : on les range,
 * on efface aussitôt le fragment de la barre d'adresse, puis on entre dans l'app.
 */
export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    // Le fragment ne doit pas rester dans l'historique du navigateur.
    window.history.replaceState(null, "", window.location.pathname);

    if (accessToken && refreshToken) {
      saveTokens({ accessToken, refreshToken });
      router.replace("/home");
    } else {
      router.replace("/login?error=google");
    }
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-cream px-6 text-center">
      <Logo size={72} />
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-terracotta)] border-t-transparent" />
      <p className="text-sm text-slate-500">Connexion en cours…</p>
    </main>
  );
}
