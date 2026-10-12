"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { verifyAttestation } from "@/lib/api";
import { formatDay } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

/** Résultat public d'une vérification : strictement le nécessaire, sans prix ni coordonnées. */
export default function VerifyResultPage() {
  const { code } = useParams<{ code: string }>();
  const { data, loading, error } = useAsyncData(`verify-${code}`, () => verifyAttestation(code));

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-[var(--color-cream)] px-5 pb-10 pt-6">
      <div className="flex justify-center">
        <Logo withWordmark size={36} />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-[var(--color-teal)]">Vérification d&apos;attestation</h1>

      {loading ? (
        <div className="mt-5 h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error || !data ? (
        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <p className="font-semibold text-red-500">✗ Aucune attestation ne correspond à ce code.</p>
          <p className="mt-2 text-sm text-slate-600">Vérifiez le code ou méfiez-vous : le document n&apos;est peut-être pas authentique.</p>
        </section>
      ) : (
        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <p className={`font-semibold ${data.valid ? "text-[var(--color-teal)]" : "text-red-500"}`}>
            {data.valid ? "✓ Attestation authentique et réservation valide" : "✗ Attestation authentique, mais réservation annulée ou remboursée"}
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-500">Occupant</dt>
            <dd className="text-right">{data.occupantName}</dd>
            <dt className="text-slate-500">Logement</dt>
            <dd className="text-right">
              {data.property.title}
              <span className="block text-xs text-slate-500">
                {data.property.quarter}, {data.property.city}
              </span>
            </dd>
            <dt className="text-slate-500">Séjour</dt>
            <dd className="text-right">
              {formatDay(data.checkInDate)} → {formatDay(data.checkOutDate)}
              <span className="block text-xs text-slate-500">
                {data.nights} nuit{data.nights > 1 ? "s" : ""}
              </span>
            </dd>
            <dt className="text-slate-500">Signée par</dt>
            <dd className="text-right">{data.signerName}</dd>
            <dt className="text-slate-500">Signée le</dt>
            <dd className="text-right">{formatDay(data.signedAt)}</dd>
          </dl>
        </section>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/verifier" className="font-semibold text-[var(--color-teal-600)]">
          Vérifier un autre code
        </Link>
      </p>
    </main>
  );
}
