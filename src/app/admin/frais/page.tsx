"use client";

import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { formatPercent, getAdminFees, updateAdminFees, type AdminFeesView, type FeeSettings } from "@/lib/fees-api";
import { useAsyncData } from "@/lib/use-async-data";

const EXAMPLE = 30000;
const round = (value: number, percent: number) => Math.round((value * percent) / 100);

const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text.replace(",", ".")));
/** « 2027-01-12 » → fin de journée à l'heure du Cameroun (UTC+1). */
const endOfDay = (day: string) => `${day}T23:59:59+01:00`;
const dayInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 10) : "");

function Preview({ host, traveler }: { host: number; traveler: number }) {
  if (![host, traveler].every((n) => Number.isFinite(n))) return null;
  const hostFee = round(EXAMPLE, host);
  const travelerFee = round(EXAMPLE, traveler);
  return (
    <p className="rounded-xl bg-[var(--color-teal-100)] px-3 py-2 text-sm text-[var(--color-teal)]">
      Exemple pour un séjour de {formatFcfa(EXAMPLE)} : le voyageur paie {formatFcfa(EXAMPLE + travelerFee)}, l&apos;hôte reçoit{" "}
      {formatFcfa(EXAMPLE - hostFee)}, SòôRooms garde {formatFcfa(hostFee + travelerFee)}.
    </p>
  );
}

function FeesEditor({ view, onSaved }: { view: AdminFeesView; onSaved: (next: AdminFeesView) => void }) {
  const c = view.current;
  const [host, setHost] = useState(String(c?.hostCommissionPercent ?? 10));
  const [launch, setLaunch] = useState(c?.launchHostCommissionPercent != null ? String(c.launchHostCommissionPercent) : "");
  const [launchEnd, setLaunchEnd] = useState(dayInput(c?.launchEndsAt ?? null));
  const [traveler, setTraveler] = useState(String(c?.travelerFeePercent ?? 3));
  const [visitPrice, setVisitPrice] = useState(String(c?.verificationVisitPrice ?? 10000));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hostN = toNumber(host);
  const travelerN = toNumber(traveler);
  const launchN = toNumber(launch);
  const visitPriceN = toNumber(visitPrice);
  const hasLaunch = Number.isFinite(launchN) || launchEnd !== "";

  async function save() {
    setError(null);
    setSaved(false);
    if (!Number.isFinite(hostN) || !Number.isFinite(travelerN)) return setError("Renseignez la commission hôte et les frais voyageur.");
    if (!Number.isFinite(visitPriceN) || visitPriceN < 1000 || visitPriceN > 200000) return setError("Le prix d'une visite doit être compris entre 1 000 et 200 000 FCFA.");
    if (hasLaunch && (!Number.isFinite(launchN) || launchEnd === "")) return setError("L'offre de lancement demande un pourcentage ET une date de fin (ou aucun des deux).");
    const summary = `Commission hôte ${formatPercent(hostN)}${hasLaunch ? `, offre de lancement ${formatPercent(launchN)} jusqu'au ${launchEnd}` : ""}, frais voyageur ${formatPercent(travelerN)}.`;
    if (!window.confirm(`Appliquer ces réglages aux prochaines réservations ?\n\n${summary}\n\nLes hôtes seront prévenus si leur commission change.`)) return;
    setBusy(true);
    try {
      onSaved(
        await updateAdminFees({
          hostCommissionPercent: hostN,
          launchHostCommissionPercent: hasLaunch ? launchN : null,
          launchEndsAt: hasLaunch ? endOfDay(launchEnd) : null,
          travelerFeePercent: travelerN,
          verificationVisitPrice: Math.round(visitPriceN),
          note: note.trim() || undefined,
        }),
      );
      setNote("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const label = "mb-1.5 block text-sm font-semibold text-[var(--color-ink)]";
  const applied = view.applied;
  const previewHost = hasLaunch && Number.isFinite(launchN) ? launchN : hostN;

  return (
    <div className="flex flex-col gap-5">
      {applied && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Appliqué maintenant</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-teal)]">
            Hôte {formatPercent(applied.hostCommissionPercent)} · Voyageur {formatPercent(applied.travelerFeePercent)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{applied.launchActive ? "Offre de lancement en cours." : "Tarif normal."}</p>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <label className={label} htmlFor="fee-host">Commission hôte normale (%)</label>
          <TextField id="fee-host" inputMode="decimal" value={host} onChange={(e) => setHost(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="fee-launch">Offre de lancement (%)</label>
            <TextField id="fee-launch" inputMode="decimal" placeholder="Aucune" value={launch} onChange={(e) => setLaunch(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="fee-launch-end">Jusqu&apos;au</label>
            <TextField id="fee-launch-end" type="date" value={launchEnd} onChange={(e) => setLaunchEnd(e.target.value)} />
          </div>
        </div>
        <p className="-mt-2 text-xs text-slate-500">Laissez les deux champs vides pour retirer l&apos;offre de lancement.</p>
        <div>
          <label className={label} htmlFor="fee-traveler">Frais de service voyageur (%)</label>
          <TextField id="fee-traveler" inputMode="decimal" value={traveler} onChange={(e) => setTraveler(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="fee-visit">Prix d&apos;une visite de vérification (FCFA)</label>
          <TextField id="fee-visit" inputMode="numeric" value={visitPrice} onChange={(e) => setVisitPrice(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">Payé par l&apos;hôte pour obtenir le badge « Vérifié par SòôRooms ». Une demande déjà créée mais non payée prend le nouveau prix.</p>
        </div>
        <div>
          <label className={label} htmlFor="fee-note">Motif (facultatif)</label>
          <TextField id="fee-note" maxLength={300} placeholder="Ex. fin de l'offre de lancement" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Preview host={previewHost} traveler={travelerN} />
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        {saved && <p role="status" className="text-sm text-[var(--color-teal)]">Réglages enregistrés. Ils s&apos;appliquent aux prochaines réservations ; les réservations déjà payées gardent leurs taux.</p>}
        <Button loading={busy} onClick={save}>Enregistrer</Button>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Historique des modifications</h2>
        <ul className="mt-3 divide-y divide-[var(--color-border)]">
          {view.history.map((h: FeeSettings) => (
            <li key={h.id} className="py-3 text-sm">
              <p className="font-semibold text-[var(--color-ink)]">
                Hôte {formatPercent(h.hostCommissionPercent)}
                {h.launchHostCommissionPercent != null && h.launchEndsAt ? ` (lancement ${formatPercent(h.launchHostCommissionPercent)} jusqu'au ${formatDay(h.launchEndsAt)})` : ""} · Voyageur {formatPercent(h.travelerFeePercent)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDay(h.createdAt)}
                {h.by ? ` · ${h.by}` : ""}
                {h.note ? ` · ${h.note}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Content() {
  const { data, loading, error } = useAsyncData("admin-fees", getAdminFees);
  const [override, setOverride] = useState<AdminFeesView | null>(null);
  const view = override ?? data;
  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error || !view) return <p className="text-sm text-red-500">{error ?? "Réglages indisponibles."}</p>;
  return <FeesEditor key={view.history[0]?.id ?? "none"} view={view} onSaved={setOverride} />;
}

export default function AdminFeesPage() {
  return <AdminFrame permission="settings.manage">{() => <Content />}</AdminFrame>;
}
