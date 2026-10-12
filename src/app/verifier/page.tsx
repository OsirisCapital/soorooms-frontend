"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

/** Page publique : saisir le code d'une attestation pour en vérifier l'authenticité. */
export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = code.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length >= 6) router.push(`/verifier/${clean}`);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-[var(--color-cream)] px-5 pb-10 pt-6">
      <div className="flex justify-center">
        <Logo withWordmark size={36} />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-[var(--color-teal)]">Vérifier une attestation</h1>
      <p className="mt-2 text-sm text-slate-600">Saisissez le code indiqué sur l&apos;attestation de réservation, ou scannez son QR code.</p>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code de vérification"
          aria-label="Code de vérification"
          autoCapitalize="characters"
          className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm uppercase tracking-widest"
        />
        <Button type="submit">Vérifier</Button>
      </form>
    </main>
  );
}
