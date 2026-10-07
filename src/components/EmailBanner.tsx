"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ApiError, resendVerification } from "@/lib/api";
import { useMe } from "@/lib/use-me";

/**
 * Rappel affiché sur tous les écrans connectés tant que l'adresse e-mail du compte n'est pas vérifiée.
 * Il ne bloque rien : seule la publication d'un logement exige une adresse vérifiée (le serveur l'impose).
 * Masquable pour la session en cours ; il réapparaît à la prochaine ouverture tant que l'adresse n'est pas confirmée.
 */
const listeners = new Set<() => void>();
const keyFor = (userId: string) => `sooroms.emailBannerDismissed.${userId}`;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isDismissed(userId: string): boolean {
  try {
    return sessionStorage.getItem(keyFor(userId)) === "1";
  } catch {
    return false;
  }
}

function dismiss(userId: string) {
  try {
    sessionStorage.setItem(keyFor(userId), "1");
  } catch {
    // stockage indisponible (navigation privée stricte) : le bandeau reviendra, sans gravité
  }
  listeners.forEach((listener) => listener());
}

export function EmailBanner() {
  const me = useMe();
  // Côté serveur et avant le chargement du profil : masqué, pour éviter tout décalage à l'hydratation.
  const dismissed = useSyncExternalStore(
    subscribe,
    () => (me ? isDismissed(me.id) : true),
    () => true,
  );
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  if (!me || me.emailVerifiedAt || dismissed) return null;

  async function handleResend() {
    setNotice(null);
    setSending(true);
    try {
      const result = await resendVerification();
      setNotice({ text: result.message, ok: true });
    } catch (err) {
      setNotice({
        text: err instanceof ApiError ? err.message : "Envoi impossible pour le moment. Réessayez dans un instant.",
        ok: false,
      });
    } finally {
      setSending(false);
    }
  }

  const hasEmail = Boolean(me.email);

  return (
    <div role="status" className="border-b border-orange-200 bg-orange-50">
      <div className="mx-auto flex max-w-xl items-start gap-3 px-5 py-2.5 text-sm text-[var(--color-terracotta-dark)]">
        <div className="flex-1">
          <p>
            {hasEmail
              ? "Confirmez votre adresse e-mail : elle sert à récupérer votre compte et elle est requise pour publier un logement."
              : "Ajoutez une adresse e-mail : c'est le seul moyen de récupérer votre compte si vous oubliez votre mot de passe."}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            {hasEmail && (
              <button type="button" onClick={handleResend} disabled={sending} className="font-semibold underline disabled:opacity-60">
                {sending ? "Envoi…" : "Renvoyer le lien"}
              </button>
            )}
            <Link href="/profil/informations" className="font-semibold underline">
              {hasEmail ? "Mes informations" : "Ajouter mon adresse"}
            </Link>
          </div>
          {notice && <p className={`mt-1 ${notice.ok ? "text-[var(--color-teal)]" : "text-red-600"}`}>{notice.text}</p>}
        </div>
        <button
          type="button"
          onClick={() => dismiss(me.id)}
          aria-label="Masquer ce rappel"
          className="-mr-1 rounded-full px-2 text-lg leading-none text-[var(--color-terracotta-dark)] hover:bg-orange-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
