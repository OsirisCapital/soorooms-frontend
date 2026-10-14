"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { Logo } from "@/components/Logo";
import { getAccessToken } from "@/lib/auth-storage";
import { rememberReferral } from "@/lib/referral-storage";

/**
 * Page d'arrivée d'un lien de parrainage (soorooms.com/r/CODE). Elle mémorise le code, puis invite à créer un
 * compte ou à se connecter : le rattachement au partenaire est fait ensuite, automatiquement (ReferralClaimer).
 */
export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>();
  const clean = decodeURIComponent(code ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);

  useEffect(() => {
    if (clean) rememberReferral(clean);
  }, [clean]);

  const connected = useSyncExternalStore(
    () => () => {},
    () => !!getAccessToken(),
    () => false,
  );

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-10">
      <div className="flex justify-center">
        <Logo size={64} />
      </div>
      <h1 className="font-display mt-6 text-center text-3xl font-bold text-[var(--color-teal)]">Vous êtes invité sur SòôRooms</h1>
      <p className="mt-3 text-center text-slate-600">
        Un partenaire SòôRooms vous recommande la plateforme camerounaise pour trouver ou proposer un logement en toute confiance.
      </p>

      <ul className="mt-6 flex flex-col gap-3 rounded-3xl bg-white p-5 text-sm text-slate-700 shadow-sm">
        <li>🏠 <strong>Voyageur :</strong> des logements vérifiés, un prix négocié, et votre argent en séquestre jusqu&apos;à votre arrivée.</li>
        <li>🔑 <strong>Hôte :</strong> publiez votre logement gratuitement et recevez vos paiements par Mobile Money.</li>
      </ul>

      {connected ? (
        <div className="mt-6 flex flex-col gap-3">
          <p className="text-center text-sm text-slate-600">Vous êtes déjà connecté. Le parrainage est enregistré si votre compte est récent.</p>
          <Link href="/home" className="rounded-2xl bg-[var(--color-terracotta)] px-5 py-3.5 text-center font-semibold text-white">
            Ouvrir SòôRooms
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/login" className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3.5 text-center font-semibold text-[var(--color-ink)]">
            Connexion
          </Link>
          <Link href="/register" className="rounded-2xl bg-[var(--color-terracotta)] px-5 py-3.5 text-center font-semibold text-white">
            Créer mon compte
          </Link>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-400">Code de parrainage : {clean || "—"}</p>
    </main>
  );
}
