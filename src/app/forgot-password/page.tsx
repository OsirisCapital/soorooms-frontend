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
              // Hors production, le backend renvoie le jeton au lieu d'envoyer un SMS.
              <div className="rounded-2xl border border-[var(--color-terracotta)] bg-white p-4 text-sm text-slate-600">
                <p className="font-semibold text-[var(--color-terracotta)]">Mode développement</p>
                <p className="mt-1">Aucun SMS n&apos;est envoyé : vous pouvez continuer directement.</p>
                <Link
                  href={`/reset-password?token=${encodeURIComponent(result.devResetToken)}`}
                  className="mt-3 inline-block font-semibold text-[var(--color-teal)] underline"
                >
                  Choisir un nouveau mot de passe
                </Link>
              </div>
            ) : (
              <Link href="/reset-password" className="text-center text-sm font-semibold text-[var(--color-teal)] underline">
                J&apos;ai reçu mon code
              </Link>
            )}

            <Link href="/login" className="text-center text-sm text-slate-500">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-center text-slate-500">
              Indiquez le numéro de votre compte pour recevoir de quoi choisir un nouveau mot de passe.
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
                Saisissez le numéro de votre compte (avec ou sans l&apos;indicatif +237).
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
