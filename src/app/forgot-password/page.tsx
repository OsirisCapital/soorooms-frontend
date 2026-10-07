"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError, forgotPassword, type ForgotPasswordResponse } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      setResult(await forgotPassword(phone.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Demande impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-cream px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={72} />
        </div>

        <h1 className="text-center text-2xl font-bold text-[var(--color-teal)]">Mot de passe oublié</h1>

        {result ? (
          <div className="mt-6 flex flex-col gap-4">
            <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">{result.message}</p>

            {result.devResetToken ? (
              // Hors production, le backend renvoie aussi le jeton, pour tester sans boîte e-mail.
              <div className="rounded-2xl border border-[var(--color-terracotta)] bg-white p-4 text-sm text-slate-600">
                <p className="font-semibold text-[var(--color-terracotta)]">Mode développement</p>
                <p className="mt-1">Le jeton est affiché ici pour tester : vous pouvez continuer directement.</p>
                <Link
                  href={`/reset-password?token=${encodeURIComponent(result.devResetToken)}`}
                  className="mt-3 inline-block font-semibold text-[var(--color-teal)] underline"
                >
                  Choisir un nouveau mot de passe
                </Link>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500">
                Consultez votre boîte de réception, sans oublier les courriers indésirables. Le lien est valable 30 minutes.
              </p>
            )}

            <Link href="/login" className="text-center text-sm text-slate-500">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-center text-slate-500">
              Indiquez le numéro de votre compte. Si une adresse e-mail vérifiée y est associée, nous vous enverrons un
              lien pour choisir un nouveau mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <TextField
                type="tel"
                placeholder="Téléphone (+237...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="-mt-2 text-xs text-slate-500">
                Saisissez le numéro de votre compte (avec ou sans l&apos;indicatif +237). Sans adresse e-mail vérifiée sur
                le compte, aucun lien ne peut être envoyé : contactez alors le support.
              </p>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" loading={loading}>
                Envoyer
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              <Link href="/login" className="font-semibold text-[var(--color-teal)]">
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
