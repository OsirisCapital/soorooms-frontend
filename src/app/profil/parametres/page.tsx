"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { setMode, useAccount } from "@/lib/account";
import { getMyKyc } from "@/lib/api";
import { useAsyncData } from "@/lib/use-async-data";

export default function ParametresPage() {
  const router = useRouter();
  const { hostEnabled, mode } = useAccount();
  const { data: kyc, loading, error } = useAsyncData("my-kyc", getMyKyc);
  const status = kyc?.kycStatus;

  const lastNote = kyc?.documents.find((d) => d.status === "REJECTED")?.reviewerNote;

  return (
    <AppShell title="Paramètres" backHref="/profil">
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Compte hôte</h2>

        {loading ? (
          <div className="mt-4 h-12 animate-pulse rounded-xl bg-[var(--color-cream-soft)]" />
        ) : error ? (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        ) : status === "PENDING_REVIEW" ? (
          <p className="mt-3 text-sm text-slate-600">
            Vos documents sont en cours de vérification. Vous pourrez publier un logement dès leur validation.
          </p>
        ) : status === "APPROVED" ? (
          <p className="mt-3 text-sm text-slate-600">Votre compte hôte est vérifié.</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-600">
              {status === "REJECTED"
                ? `Vos documents ont été refusés${lastNote ? ` : ${lastNote}` : "."} Vous pouvez les renvoyer.`
                : "Proposez vos logements : activez votre compte hôte et complétez la vérification d'identité en 3 étapes."}
            </p>
            <div className="mt-4">
              <Button onClick={() => router.push("/profil/parametres/hote")}>
                {status === "REJECTED" ? "Renvoyer mes documents" : "Activer mon compte hôte"}
              </Button>
            </div>
          </>
        )}

        {hostEnabled && (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <p className="text-sm text-slate-600">
              Mode actuel : <strong>{mode === "HOST" ? "hôte" : "voyageur"}</strong>. Utilisez la flèche à côté du logo pour
              basculer.
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                const next = mode === "HOST" ? "TRAVELER" : "HOST";
                setMode(next);
                router.push(next === "HOST" ? "/hote" : "/home");
              }}
            >
              {mode === "HOST" ? "Passer en mode voyageur" : "Passer en mode hôte"}
            </Button>
          </div>
        )}
      </section>

      <p className="mt-6 text-sm text-slate-500">
        Langue, notifications et sécurité du compte arriveront dans une prochaine version.{" "}
        <Link href="/profil/aide" className="font-semibold text-[var(--color-teal)]">
          Aide
        </Link>
      </p>
    </AppShell>
  );
}
