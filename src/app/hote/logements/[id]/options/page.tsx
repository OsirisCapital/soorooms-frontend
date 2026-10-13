"use client";

import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError, type HallOption } from "@/lib/api";
import { formatFcfa } from "@/lib/booking-labels";
import { addHallOption, listHallOptions, removeHallOption } from "@/lib/hall-api";
import { useAsyncData } from "@/lib/use-async-data";

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
const SUGGESTIONS = ["Navette aéroport", "Petit-déjeuner", "Ménage supplémentaire", "Blanchisserie", "Sono et DJ", "Traiteur", "Décoration", "Chaises et tables", "Groupe électrogène", "Vidéo / photo"];

export default function HallOptionsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: loaded, loading, error } = useAsyncData(`hall-options-${id}`, () => listHallOptions(id));
  const [fresh, setFresh] = useState<HallOption[] | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [perNight, setPerNight] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const options = fresh ?? loaded ?? [];

  async function add(e: FormEvent) {
    e.preventDefault();
    const amount = Number(price);
    if (name.trim().length < 2) return setFormError("Donnez un nom à l'option.");
    if (price.trim() === "" || !Number.isInteger(amount) || amount < 0) return setFormError("Indiquez un prix en FCFA (nombre entier).");
    setBusy(true);
    setFormError(null);
    try {
      await addHallOption(id, { name: name.trim(), price: amount, perNight });
      setFresh(await listHallOptions(id));
      setName("");
      setPrice("");
      setPerNight(false);
    } catch (err) {
      setFormError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(option: HallOption) {
    if (!window.confirm(`Supprimer l'option « ${option.name} » ? Les réservations déjà faites la conservent.`)) return;
    setFormError(null);
    try {
      await removeHallOption(id, option.id);
      setFresh(await listHallOptions(id));
    } catch (err) {
      setFormError(messageOf(err));
    }
  }

  return (
    <AppShell backHref={`/hote/logements/${id}`}>
      <h1 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Options payantes</h1>
      <p className="mb-4 text-sm text-slate-600">Navette, petit-déjeuner, sono, traiteur… Le client les coche à la réservation ; leur prix s&apos;ajoute à celui de la réservation.</p>

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {options.length === 0 && <li className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">Aucune option pour l&apos;instant.</li>}
            {options.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div>
                  <p className="font-medium text-[var(--color-ink)]">{o.name}</p>
                  <p className="text-sm font-semibold text-[var(--color-teal)]">
                    {formatFcfa(o.price)}
                    {o.perNight ? " / nuit" : ""}
                  </p>
                </div>
                <button type="button" onClick={() => remove(o)} className="text-sm text-red-500">
                  Supprimer
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={add} className="mt-5 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-[var(--color-ink)]">Ajouter une option</h2>
            <TextField placeholder="Nom (ex. Sono et DJ)" value={name} onChange={(e) => setName(e.target.value)} list="hall-option-names" maxLength={80} />
            <datalist id="hall-option-names">
              {SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <TextField placeholder="Prix en FCFA" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
            <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
              <input type="checkbox" checked={perNight} onChange={(e) => setPerNight(e.target.checked)} />
              Facturé chaque nuit (ex. petit-déjeuner). Sinon, une seule fois (ex. navette).
            </label>
            <p className="-mt-1 text-xs text-slate-500">Le prix couvre toute la réservation, quel que soit le nombre de chambres. Sans effet pour une salle de fêtes.</p>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <Button type="submit" loading={busy}>
              Ajouter
            </Button>
          </form>
        </>
      )}
    </AppShell>
  );
}
