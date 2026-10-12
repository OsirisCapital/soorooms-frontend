"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError, type PropertyRoom, type RoomPayload } from "@/lib/api";
import { ACCEPT_ATTRIBUTE } from "@/lib/upload";

const ROOM_TYPES = ["Chambre", "Studio", "Appartement", "Maison entière"];
const RESIDENCE_TYPES = ["Lit en chambre partagée", "Chambre entière"];

type Props = {
  initial?: PropertyRoom;
  submitLabel: string;
  /** Photos choisies à la création (le parent les envoie une fois la chambre créée). */
  onSubmit: (payload: RoomPayload, photos: File[]) => Promise<void>;
  /** Création : au moins une photo est demandée dès le départ. */
  requirePhotos?: boolean;
  /** Salle de fêtes : tarif par événement et capacité, sans chambres ni lits. */
  hall?: boolean;
  /** Résidence étudiante : forfaits semestre / année, et nombre de places (lits ou chambres). */
  residence?: boolean;
  onCancel?: () => void;
};

/** Formulaire d'une chambre (ou d'un logement entier représenté par une seule chambre). */
export function RoomForm({ initial, submitLabel, onSubmit, onCancel, requirePhotos = false, hall = false, residence = false }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [roomType, setRoomType] = useState(initial?.roomType ?? "Chambre");
  const [basePrice, setBasePrice] = useState(initial ? String(Number(initial.basePrice)) : "");
  const [semesterPrice, setSemesterPrice] = useState(initial?.semesterPrice != null ? String(Number(initial.semesterPrice)) : "");
  const [yearPrice, setYearPrice] = useState(initial?.yearPrice != null ? String(Number(initial.yearPrice)) : "");
  const [maxGuests, setMaxGuests] = useState(String(initial?.maxGuests ?? 2));
  const [bedroomCount, setBedroomCount] = useState(String(initial?.bedroomCount ?? 1));
  const [bedCount, setBedCount] = useState(String(initial?.bedCount ?? 1));
  const [unitCount, setUnitCount] = useState(String(initial?.unitCount ?? 1));
  const [photos, setPhotos] = useState<File[]>([]);
  const photoInput = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const semester = semesterPrice.trim() === "" ? null : Number(semesterPrice);
    const year = yearPrice.trim() === "" ? null : Number(yearPrice);
    // Résidence : le prix de référence est celui du forfait le plus court proposé.
    const price = residence ? Number(semester ?? year) : Number(basePrice);
    const guests = Number(maxGuests);
    const bedrooms = hall || residence ? 1 : Number(bedroomCount);
    const beds = hall || residence ? 1 : Number(bedCount);
    const units = hall ? 1 : Number(unitCount);

    if (name.trim().length < 2) return setError("Donnez un nom à la chambre (2 caractères minimum).");
    if (residence) {
      if (semester == null && year == null) return setError("Indiquez le prix du semestre et/ou de l'année.");
      for (const p of [semester, year]) {
        if (p != null && (!Number.isFinite(p) || p < 1)) return setError("Les prix des forfaits doivent être supérieurs à 0.");
      }
    } else if (basePrice.trim() === "" || !Number.isFinite(price) || price < 0) return setError(hall ? "Indiquez un tarif valide." : "Indiquez un prix par nuit valide.");
    if (![guests, bedrooms, beds].every((n) => Number.isInteger(n) && n >= 1)) {
      return setError(hall ? "La capacité doit être un nombre entier d'au moins 1." : "Voyageurs, chambres et lits doivent être des nombres entiers d'au moins 1.");
    }

    if (!Number.isInteger(units) || units < 1 || units > 500) {
      return setError("Le nombre d'unités doit être un entier entre 1 et 500.");
    }

    if (requirePhotos && photos.length === 0) return setError("Ajoutez au moins une photo de cette chambre.");

    setError(null);
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        roomType: roomType.trim() || (hall ? "Salle" : "Chambre"),
        basePrice: price,
        maxGuests: guests,
        bedroomCount: bedrooms,
        bedCount: beds,
        unitCount: units,
        ...(residence ? { semesterPrice: semester, yearPrice: year } : {}),
      }, photos);
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
      <TextField placeholder={hall ? "Nom (ex. Grande salle, Salle VIP)" : residence ? "Nom (ex. Chambre 3 lits, Chambre individuelle)" : "Nom (ex. Chambre 1, Villa entière)"} value={name} onChange={(e) => setName(e.target.value)} required />
      <TextField placeholder="Type" value={roomType} onChange={(e) => setRoomType(e.target.value)} list="room-types" />
      <datalist id="room-types">
        {(residence ? RESIDENCE_TYPES : ROOM_TYPES).map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      {residence ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {numberField("Prix du semestre (FCFA)", semesterPrice, setSemesterPrice, 0)}
            {numberField("Prix de l'année (FCFA)", yearPrice, setYearPrice, 0)}
          </div>
          <p className="-mt-1 text-xs text-slate-500">
            Un seul des deux suffit. Le semestre dure 6 mois, l&apos;année 12 mois, à partir de la date d&apos;entrée de l&apos;étudiant.
          </p>
          <div>
            {numberField("Nombre de places de ce type (lits ou chambres)", unitCount, setUnitCount)}
            <p className="mt-1 text-xs text-slate-500">Ex. : 12 lits dans des chambres partagées = une ligne avec 12. Chaque étudiant réserve une place.</p>
          </div>
        </>
      ) : (
        numberField(hall ? "Tarif par événement (FCFA)" : "Prix par nuit (FCFA)", basePrice, setBasePrice, 0)
      )}
      {residence ? null : hall ? (
        numberField("Capacité (nombre d'invités)", maxGuests, setMaxGuests)
      ) : (
        <>
      <div>
        {numberField("Nombre de chambres de ce type", unitCount, setUnitCount)}
        <p className="mt-1 text-xs text-slate-500">
          Ex. : 20 chambres identiques à 15 000 FCFA = une seule ligne avec 20. Les voyageurs voient « X disponibles sur 20 ».
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {numberField("Voyageurs", maxGuests, setMaxGuests)}
        {numberField("Chambres", bedroomCount, setBedroomCount)}
        {numberField("Lits", bedCount, setBedCount)}
      </div>
        </>
      )}
      {requirePhotos && (
        <div>
          <input
            ref={photoInput}
            type="file"
            accept={ACCEPT_ATTRIBUTE.property_photo}
            multiple
            className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              e.target.value = "";
              setPhotos((prev) => [...prev, ...picked]);
            }}
          />
          {previews.length > 0 && (
            <ul className="mb-2 grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <li key={src} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-16 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    aria-label="Retirer la photo"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            className="w-full rounded-2xl border border-dashed border-[var(--color-teal-600)] px-4 py-3 text-sm font-semibold text-[var(--color-teal)]"
          >
            {photos.length === 0 ? "Ajouter des photos de cette chambre (obligatoire)" : "Ajouter d'autres photos"}
          </button>
        </div>
      )}
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
