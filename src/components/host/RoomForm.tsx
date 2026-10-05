"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError, type PropertyRoom, type RoomPayload } from "@/lib/api";

const ROOM_TYPES = ["Chambre", "Studio", "Appartement", "Maison entière"];

type Props = {
  initial?: PropertyRoom;
  submitLabel: string;
  onSubmit: (payload: RoomPayload) => Promise<void>;
  onCancel?: () => void;
};

/** Formulaire d'une chambre (ou d'un logement entier représenté par une seule chambre). */
export function RoomForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [roomType, setRoomType] = useState(initial?.roomType ?? "Chambre");
  const [basePrice, setBasePrice] = useState(initial ? String(Number(initial.basePrice)) : "");
  const [maxGuests, setMaxGuests] = useState(String(initial?.maxGuests ?? 2));
  const [bedroomCount, setBedroomCount] = useState(String(initial?.bedroomCount ?? 1));
  const [bedCount, setBedCount] = useState(String(initial?.bedCount ?? 1));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const price = Number(basePrice);
    const guests = Number(maxGuests);
    const bedrooms = Number(bedroomCount);
    const beds = Number(bedCount);

    if (name.trim().length < 2) return setError("Donnez un nom à la chambre (2 caractères minimum).");
    if (basePrice.trim() === "" || !Number.isFinite(price) || price < 0) return setError("Indiquez un prix par nuit valide.");
    if (![guests, bedrooms, beds].every((n) => Number.isInteger(n) && n >= 1)) {
      return setError("Voyageurs, chambres et lits doivent être des nombres entiers d'au moins 1.");
    }

    setError(null);
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        roomType: roomType.trim() || "Chambre",
        basePrice: price,
        maxGuests: guests,
        bedroomCount: bedrooms,
        bedCount: beds,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const numberField = (label: string, value: string, set: (v: string) => void, min = 1) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={min}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
      />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextField placeholder="Nom (ex. Chambre 1, Villa entière)" value={name} onChange={(e) => setName(e.target.value)} required />
      <TextField placeholder="Type" value={roomType} onChange={(e) => setRoomType(e.target.value)} list="room-types" />
      <datalist id="room-types">
        {ROOM_TYPES.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      {numberField("Prix par nuit (FCFA)", basePrice, setBasePrice, 0)}
      <div className="grid grid-cols-3 gap-3">
        {numberField("Voyageurs", maxGuests, setMaxGuests)}
        {numberField("Chambres", bedroomCount, setBedroomCount)}
        {numberField("Lits", bedCount, setBedCount)}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={busy}>
        {submitLabel}
      </Button>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Annuler
        </Button>
      )}
    </form>
  );
}
