"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import { TextField } from "@/components/ui/TextField";
import { ApiError, resetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  // useSearchParams impose une frontière Suspense pour la génération statique.
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const initialToken = useSearchParams().get("token") ?? "";
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError("Le mot de passe doit faire au moins 8 caractères.");
    if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");

    setError(null);
    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      router.replace("/login?reset=1");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Réinitialisation impossible. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-cream px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={72} />
        </div>

        <h1 className="text-center text-2xl font-bold text-[var(--color-teal)]">Nouveau mot de passe</h1>
        <p className="mt-1 text-center text-slate-500">Choisissez un mot de passe d&apos;au moins 8 caractères.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {/* Prérempli quand on arrive par un lien ; à coller ou saisir sinon. */}
          {!initialToken && (
            <TextField
              placeholder="Code reçu"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          )}
          <TextField
            type={showPassword ? "text" : "password"}
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
            required
          />
          <TextField
            type={showPassword ? "text" : "password"}
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" loading={loading}>
            Enregistrer
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-[var(--color-teal)]">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
