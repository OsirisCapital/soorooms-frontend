"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError, type PropertyPayload, type PropertyType } from "@/lib/api";
import { PROPERTY_TYPE_LABEL } from "@/lib/booking-labels";
import { CITY_COORDS, coordsForCity } from "@/lib/cities";

const TYPES = Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[];

type Props = {
  initial?: Partial<PropertyPayload>;
  submitLabel: string;
  onSubmit: (payload: PropertyPayload) => Promise<void>;
};

/**
 * Formulaire de fiche logement. Le backend exige une latitude et une longitude :
 * elles se pré-remplissent depuis la ville choisie, ou depuis la position de l'appareil.
 */
export function PropertyForm({ initial, submitLabel, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [propertyType, setPropertyType] = useState<PropertyType>(initial?.propertyType ?? "GUEST_HOUSE");
  const [city, setCity] = useState(initial?.city ?? "");
  const [quarter, setQuarter] = useState(initial?.quarter ?? "");
  const [latitude, setLatitude] = useState(initial?.latitude != null ? String(initial.latitude) : "");
  const [longitude, setLongitude] = useState(initial?.longitude != null ? String(initial.longitude) : "");
  const [coordsEdited, setCoordsEdited] = useState(initial?.latitude != null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleCityChange(value: string) {
    setCity(value);
    const coords = coordsForCity(value);
    if (coords && !coordsEdited) {
      setLatitude(String(coords.latitude));
      setLongitude(String(coords.longitude));
    }
  }

  function useMyPosition() {
    if (!navigator.geolocation) return setError("La géolocalisation n'est pas disponible sur cet appareil.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setCoordsEdited(true);
        setError(null);
      },
      () => setError("Position indisponible : autorisez la localisation ou saisissez les coordonnées."),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (title.trim().length < 3) return setError("Le titre doit contenir au moins 3 caractères.");
    if (description.trim().length < 20) return setError("Décrivez le logement un peu plus en détail (20 caractères minimum).");
    if (!city.trim() || !quarter.trim()) return setError("Indiquez la ville et le quartier.");
    if (latitude.trim() === "" || longitude.trim() === "" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return setError("Indiquez la position du logement (latitude et longitude).");
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return setError("Les coordonnées ne sont pas valides.");

    setError(null);
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        propertyType,
        city: city.trim(),
        quarter: quarter.trim(),
        country: "Cameroun",
        latitude: lat,
        longitude: lng,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField placeholder="Titre (ex. Villa Bord de Mer)" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        placeholder="Décrivez votre logement : espaces, ambiance, ce qui le rend unique… (20 caractères minimum)"
        className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 text-[var(--color-ink)] placeholder:text-slate-400 focus:border-[var(--color-teal)] focus:outline-none"
      />

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Type de logement
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value as PropertyType)}
          className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 text-base text-[var(--color-ink)]"
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {PROPERTY_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          placeholder="Ville"
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          list="city-suggestions"
          required
        />
        <TextField placeholder="Quartier" value={quarter} onChange={(e) => setQuarter(e.target.value)} required />
      </div>
      <datalist id="city-suggestions">
        {Object.keys(CITY_COORDS).map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <legend className="px-1 text-xs font-medium text-slate-500">Position sur la carte</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Latitude
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => {
                setLatitude(e.target.value);
                setCoordsEdited(true);
              }}
              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Longitude
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => {
                setLongitude(e.target.value);
                setCoordsEdited(true);
              }}
              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
            />
          </label>
        </div>
        <button type="button" onClick={useMyPosition} className="mt-3 text-sm font-semibold text-[var(--color-teal-600)]">
          Utiliser ma position actuelle
        </button>
      </fieldset>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" loading={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
