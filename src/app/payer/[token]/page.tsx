"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { ApiError, getPayLink, initiatePayLink, verifyPayLink, type PayLinkSummary } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { formatEuro, formatUsd } from "@/lib/fx";

const STAGE_LABEL = { FULL: "Montant à payer", DEPOSIT: "Acompte à payer", BALANCE: "Solde à payer" } as const;
const POLLS = 8;
const POLL_DELAY_MS = 5000;

/**
 * Page publique « payer pour un proche » : ouverte par la personne qui reçoit le lien, souvent à l'étranger,
 * sans compte. Elle montre le strict nécessaire, l'équivalent en euros, puis envoie vers la page de paiement.
 */
export default function PayForRelativePage() {
  const { token } = useParams<{ token: string }>();
  const [summary, setSummary] = useState<PayLinkSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState<"confirmed" | "failed" | "pending" | null>(null);
  const started = useRef(false);

  const load = useCallback(async () => {
    try {
      setSummary(await getPayLink(token));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Impossible de charger ce lien. Réessayez.");
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement réseau au montage
    void load();
  }, [load]);

  // Retour de la page de paiement : l'adresse porte la référence, on la fait vérifier par le serveur.
  useEffect(() => {
    if (started.current) return;
    const reference = new URLSearchParams(window.location.search).get("reference") ?? new URLSearchParams(window.location.search).get("trxref");
    if (!reference) return;
    started.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- démarre la vérification au retour du paiement
    setChecking(true);
    (async () => {
      for (let i = 0; i < POLLS; i += 1) {
        try {
          const result = await verifyPayLink(token, reference);
          if (result.paymentStatus === "SUCCESS") return setDone("confirmed");
          if (result.paymentStatus === "FAILED") return setDone("failed");
        } catch (err) {
          if (err instanceof ApiError && err.status < 500) break;
        }
        await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
      }
      setDone("pending");
    })().finally(() => {
      setChecking(false);
      void load();
    });
  }, [token, load]);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setError("Indiquez votre nom.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Indiquez une adresse e-mail valide.");
    setError(null);
    setBusy(true);
    try {
      const result = await initiatePayLink(token, { payerName: name.trim(), payerEmail: email.trim(), payerPhone: phone.trim() || undefined });
      window.location.assign(result.paymentUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Paiement impossible. Réessayez.");
      setBusy(false);
    }
  }

  const amount = summary?.amount ?? null;
  const usd = amount != null ? formatUsd(amount) : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-[var(--color-cream)] px-5 pb-10 pt-6">
      <div className="flex justify-center">
        <Logo withWordmark size={36} />
      </div>

      {loadError ? (
        <p className="mt-6 rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{loadError}</p>
      ) : !summary ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-[var(--color-cream-soft)]" />
      ) : (
        <>
          <h1 className="mt-6 text-2xl font-bold text-[var(--color-teal)]">Payer pour {summary.travelerFirstName}</h1>
          <p className="mt-1 text-slate-600">
            {summary.propertyTitle} · {summary.city}
          </p>
          <p className="text-sm text-slate-500">
            {summary.roomName} · {formatDay(summary.checkInDate)} → {formatDay(summary.checkOutDate)}
          </p>

          {checking && <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">Vérification de votre paiement en cours… ne fermez pas cette page.</p>}
          {done === "confirmed" && (
            <p className="mt-4 rounded-2xl bg-[var(--color-teal-100)] p-4 text-sm font-semibold text-[var(--color-teal)]">
              Merci, votre paiement est confirmé. {summary.travelerFirstName} en est informé(e) et retrouve le reçu dans son compte.
            </p>
          )}
          {done === "failed" && <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-red-500 shadow-sm">Le paiement n&apos;a pas abouti. Vous pouvez réessayer ci-dessous.</p>}
          {done === "pending" && (
            <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
              Votre paiement n&apos;est pas encore confirmé par l&apos;opérateur. S&apos;il a été débité, il sera pris en compte automatiquement ; sinon, réessayez ci-dessous.
            </p>
          )}

          {summary.payable && amount != null ? (
            <form onSubmit={pay} className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{summary.stage ? STAGE_LABEL[summary.stage] : "Montant à payer"}</p>
              <p className="text-3xl font-bold text-[var(--color-teal)]">{formatFcfa(amount)}</p>
              <p className="text-sm text-slate-600">
                soit environ <strong className="text-[var(--color-ink)]">{formatEuro(amount)}</strong>
                {usd ? <> · {usd}</> : null}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Le paiement est prélevé en FCFA ; votre banque peut appliquer son propre taux de change. Le montant en euros est indicatif.
              </p>

              <div className="mt-4 grid gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  aria-label="Votre nom"
                  autoComplete="name"
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse e-mail"
                  aria-label="Votre adresse e-mail"
                  autoComplete="email"
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Votre téléphone (facultatif)"
                  aria-label="Votre téléphone"
                  inputMode="tel"
                  autoComplete="tel"
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
                />
              </div>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              <div className="mt-4">
                <Button type="submit" loading={busy}>
                  Payer {formatFcfa(amount)}
                </Button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Paiement sécurisé par Notch Pay (carte bancaire ou Mobile Money selon les options proposées). L&apos;argent est conservé en séquestre jusqu&apos;à la confirmation du séjour.
              </p>
            </form>
          ) : (
            done === null && (
              <p className="mt-6 rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">Cette réservation n&apos;attend aucun paiement pour le moment.</p>
            )
          )}
        </>
      )}
    </main>
  );
}
