"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import { TextField } from "@/components/ui/TextField";
import { ApiError, googleAuthUrl, loginUser } from "@/lib/api";
import { saveTokens } from "@/lib/auth-storage";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tokens = await loginUser({ phone, password });
      saveTokens(tokens);
      router.push("/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible. Réessayez.");
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

        <h1 className="text-center text-2xl font-bold text-[var(--color-teal)]">Bon retour !</h1>
        <p className="mt-1 text-center text-slate-500">Connectez-vous pour continuer</p>

        <Suspense fallback={null}>
          <AuthNotice />
        </Suspense>

        <a
          href={googleAuthUrl()}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white py-3.5 font-medium text-[var(--color-ink)] hover:bg-[var(--color-cream-soft)]"
        >
          <GoogleIcon />
          Continuer avec Google
        </a>

        <div className="my-6 flex items-center gap-3 text-slate-400">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-sm">Ou</span>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/*
            Les maquettes demandent un e-mail ici — le backend actuel
            n'authentifie que par téléphone (identifiant technique retenu,
            voir décision produit). Champ adapté en conséquence.
          */}
          <TextField
            type="tel"
            placeholder="Téléphone (+237...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<PhoneIcon />}
            required
          />
          <TextField
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<LockIcon />}
            trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
            required
          />

          <Link href="/forgot-password" className="self-end text-sm font-medium text-[var(--color-teal-600)]">
            Mot de passe oublié ?
          </Link>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" loading={loading}>
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Vous n&apos;avez pas de compte ?{" "}
          <Link href="/register" className="font-semibold text-[var(--color-teal)]">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}

/** Messages de retour : échec ou annulation de Google, ou mot de passe tout juste changé. */
function AuthNotice() {
  const params = useSearchParams();

  if (params.get("reset") === "1") {
    return (
      <p className="mt-6 rounded-2xl bg-[var(--color-teal-100)] px-4 py-3 text-sm text-[var(--color-teal)]">
        Mot de passe modifié. Connectez-vous avec le nouveau.
      </p>
    );
  }
  if (params.get("error") === "google") {
    return (
      <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-red-500 shadow-sm">
        La connexion avec Google a échoué ou a été annulée. Réessayez.
      </p>
    );
  }
  return null;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
