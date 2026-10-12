"use client";

import { useState } from "react";
import { ApiError, createPayLink, revokePayLink } from "@/lib/api";

/**
 * « Un proche paie pour moi » : le voyageur génère un lien secret à envoyer à un parent ou un ami
 * (souvent à l'étranger). Cette personne paie sans compte ; la réservation et le reçu restent au voyageur.
 */
export function PayLinkCard({ bookingId, initiallyActive, propertyTitle }: { bookingId: string; initiallyActive: boolean; propertyTitle: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [active, setActive] = useState(initiallyActive);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setBusy(true);
    try {
      const { token } = await createPayLink(bookingId);
      setUrl(`${window.location.origin}/payer/${token}`);
      setActive(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de créer le lien. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setError(null);
    setBusy(true);
    try {
      await revokePayLink(bookingId);
      setUrl(null);
      setActive(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de désactiver le lien. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copie impossible : sélectionnez le lien et copiez-le à la main.");
    }
  }

  const message = url ? `Bonjour, pourrais-tu régler ma réservation « ${propertyTitle} » sur SòôRooms ? Voici le lien de paiement sécurisé : ${url}` : "";

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] p-4">
      <p className="text-sm font-semibold text-[var(--color-ink)]">Un proche paie pour moi</p>
      <p className="mt-1 text-xs text-slate-500">
        Envoyez un lien à un parent ou un ami (à l&apos;étranger aussi). Il paie sans compte, vous gardez la réservation et le reçu.
      </p>
      {url ? (
        <div className="mt-3 flex flex-col gap-2">
          <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Lien de paiement" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-ink)]" />
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <button type="button" onClick={copy} className="rounded-full bg-[var(--color-teal-100)] px-4 py-1.5 text-[var(--color-teal)]">
              {copied ? "Copié ✓" : "Copier le lien"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--color-teal-100)] px-4 py-1.5 text-[var(--color-teal)]">
              Envoyer sur WhatsApp
            </a>
            <button type="button" onClick={revoke} disabled={busy} className="px-2 py-1.5 text-red-500">
              Désactiver le lien
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold">
          <button type="button" onClick={generate} disabled={busy} className="rounded-full bg-[var(--color-teal-100)] px-4 py-1.5 text-[var(--color-teal)]">
            {active ? "Afficher le lien" : "Créer un lien de paiement"}
          </button>
          {active && (
            <button type="button" onClick={revoke} disabled={busy} className="text-red-500">
              Désactiver le lien
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
