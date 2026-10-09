"use client";

import Link from "next/link";
import { useState } from "react";
import { getNotificationPreferences, setEmailNotifications, type NotificationPreferences } from "@/lib/notification-prefs-api";
import { useAsyncData } from "@/lib/use-async-data";

/** Interrupteur des e-mails de notification. La cloche de l'application reste active dans tous les cas. */
export function EmailPreference() {
  const { data } = useAsyncData("notification-prefs", () => getNotificationPreferences());
  const [override, setOverride] = useState<NotificationPreferences | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefs = override ?? data;
  if (!prefs) return null;

  async function toggle() {
    if (!prefs) return;
    const next = !prefs.emailEnabled;
    setError(null);
    setBusy(true);
    setOverride({ ...prefs, emailEnabled: next }); // affichage immédiat, annulé si l'enregistrement échoue
    try {
      setOverride(await setEmailNotifications(next));
    } catch {
      setOverride(prefs);
      setError("Impossible d'enregistrer ce réglage. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-ink)]">Recevoir aussi par e-mail</p>
          <p className="mt-0.5 text-sm text-slate-600">Réservations, paiements, messages, réponses du support…</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.emailEnabled}
          aria-label="Notifications par e-mail"
          onClick={toggle}
          disabled={busy}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${prefs.emailEnabled ? "bg-[var(--color-teal)]" : "bg-slate-300"}`}
        >
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${prefs.emailEnabled ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
      {prefs.emailEnabled && !prefs.emailVerified && (
        <p className="mt-3 text-sm text-[var(--color-terracotta-dark)]">
          Votre adresse e-mail n&apos;est pas vérifiée : aucun e-mail ne vous sera envoyé tant qu&apos;elle ne l&apos;est pas.{" "}
          <Link href="/profil/informations" className="font-semibold underline">
            Vérifier mon adresse
          </Link>
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </section>
  );
}
