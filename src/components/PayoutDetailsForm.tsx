"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { getPayoutDetails, PAYOUT_CHANNEL_LABEL, savePayoutDetails, type PayoutChannel, type PayoutDetails } from "@/lib/payouts-api";
import { useAsyncData } from "@/lib/use-async-data";

const inputClass = "rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-[var(--color-ink)]";

function Form({ initial }: { initial: PayoutDetails }) {
  const [channel, setChannel] = useState<PayoutChannel>(initial.channel ?? "cm.mtn");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [accountName, setAccountName] = useState(initial.accountName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const next = await savePayoutDetails({ channel, phone: phone.trim(), accountName: accountName.trim() });
      setPhone(next.phone ?? "");
      setAccountName(next.accountName ?? "");
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-slate-500">Opérateur</legend>
        {(Object.keys(PAYOUT_CHANNEL_LABEL) as PayoutChannel[]).map((value) => (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${value === channel ? "border-[var(--color-terracotta)] bg-[var(--color-cream)]" : "border-[var(--color-border)]"}`}
          >
            <input type="radio" name="channel" value={value} checked={value === channel} onChange={() => setChannel(value)} />
            <span className="font-medium text-[var(--color-ink)]">{PAYOUT_CHANNEL_LABEL[value]}</span>
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Numéro Mobile Money
        <input type="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6 70 00 00 00" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Nom du titulaire du compte
        <input type="text" required minLength={2} maxLength={80} value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Comme enregistré chez l'opérateur" className={inputClass} />
      </label>
      <p className="text-xs text-slate-500">
        Le compte doit être à votre nom. Chaque changement de numéro est signalé à notre équipe avant tout versement.
      </p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Coordonnées enregistrées ✓</p>}
      <Button type="submit" loading={busy}>
        Enregistrer
      </Button>
    </form>
  );
}

/** Où l'hôte reçoit son argent. */
export function PayoutDetailsForm() {
  const { data, loading, error } = useAsyncData("payout-details", getPayoutDetails);
  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error || !data) return <p className="text-sm text-red-500">{error ?? "Impossible de charger vos coordonnées."}</p>;
  return <Form initial={data} />;
}
