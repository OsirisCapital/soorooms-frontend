"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/Button";
import type { PropertyType, SearchRoomsParams } from "@/lib/api";
import { PROPERTY_TYPE_LABEL } from "@/lib/booking-labels";
import { dedupeByProperty, formatNightPrice } from "@/lib/rooms";
import { useExplorerSearch } from "@/lib/use-explorer-search";

type AmenityKey = "hasWifi" | "hasAc" | "hasParking" | "hasGeneratorOrSolar";

const TYPE_CHIPS = Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[];
const AMENITY_CHIPS: { key: AmenityKey; label: string }[] = [
  { key: "hasWifi", label: "Wi-Fi" },
  { key: "hasAc", label: "Climatisation" },
  { key: "hasParking", label: "Parking" },
  { key: "hasGeneratorOrSolar", label: "Groupe électrogène" },
];

const INPUT = "rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)]";

export default function ExplorerPage() {
  // useSearchParams impose une frontière Suspense pour la génération statique.
  return (
    <AppShell title="Explorer">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />}>
        <Explorer />
      </Suspense>
    </AppShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
        active
          ? "border-[var(--color-teal-600)] bg-[var(--color-teal-600)] text-white"
          : "border-[var(--color-teal-600)] bg-white text-[var(--color-teal)]"
      }`}
    >
      {children}
    </button>
  );
}

function Explorer() {
  // Les filtres venant de la barre de recherche de l'accueil servent de valeurs de départ.
  const initial = useSearchParams();
  const [city, setCity] = useState(initial.get("city") ?? "");
  const [checkIn, setCheckIn] = useState(initial.get("checkInDate") ?? "");
  const [checkOut, setCheckOut] = useState(initial.get("checkOutDate") ?? "");
  const [guests, setGuests] = useState("");
  const [type, setType] = useState<PropertyType | undefined>(undefined);
  const [amenities, setAmenities] = useState<AmenityKey[]>([]);

  // Les filtres ne s'appliquent qu'au clic sur « Rechercher » ; les puces, elles, agissent tout de suite.
  const [applied, setApplied] = useState<{ city: string; checkIn: string; checkOut: string; guests: string }>({
    city,
    checkIn,
    checkOut,
    guests,
  });

  const today = new Date().toISOString().slice(0, 10);

  const params: SearchRoomsParams = {
    city: applied.city.trim() || undefined,
    // Les dates ne comptent que par paire, comme l'exige le backend.
    checkInDate: applied.checkIn && applied.checkOut ? applied.checkIn : undefined,
    checkOutDate: applied.checkIn && applied.checkOut ? applied.checkOut : undefined,
    maxGuests: applied.guests ? Number(applied.guests) : undefined,
    propertyType: type,
    ...Object.fromEntries(amenities.map((key) => [key, true])),
  };

  const { rooms, loading, failed, hasMore, loadingMore, loadMore } = useExplorerSearch(params);
  const cards = dedupeByProperty(rooms);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setApplied({ city, checkIn, checkOut, guests });
  }

  const toggleAmenity = (key: AmenityKey) =>
    setAmenities((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <>
      <form onSubmit={submit} className="rounded-2xl bg-white p-3 shadow-md">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Où allez-vous ?"
          aria-label="Destination"
          className={`${INPUT} w-full`}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Du
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) setCheckOut("");
              }}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Au
            <input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={INPUT} />
          </label>
        </div>
        <div className="mt-2 flex gap-2">
          <select
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            aria-label="Voyageurs"
            className={`${INPUT} min-w-0 flex-1`}
          >
            <option value="">Voyageurs</option>
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n} voyageur{n > 1 ? "s" : ""} ou plus
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-[var(--color-teal-600)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-teal)]"
          >
            Rechercher
          </button>
        </div>
      </form>

      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {TYPE_CHIPS.map((value) => (
          <Chip key={value} active={type === value} onClick={() => setType(type === value ? undefined : value)}>
            {PROPERTY_TYPE_LABEL[value]}
          </Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5">
        {AMENITY_CHIPS.map((chip) => (
          <Chip key={chip.key} active={amenities.includes(chip.key)} onClick={() => toggleAmenity(chip.key)}>
            {chip.label}
          </Chip>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl bg-[var(--color-cream-soft)]" />
            ))}
          </div>
        ) : failed ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-red-500 shadow-sm">
            Impossible de charger les logements. Réessayez.
          </p>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-slate-600">Aucun logement ne correspond à votre recherche.</p>
            <p className="mt-2 text-sm text-slate-500">Essayez d&apos;autres dates, une autre ville ou moins de filtres.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {cards.length} logement{cards.length > 1 ? "s" : ""}
              {hasMore ? " affichés" : ""}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {cards.map((room) => (
                <PropertyCard
                  key={room.propertyId}
                  propertyId={room.propertyId}
                  title={room.property.title}
                  subtitle={`${room.property.city} · ${room.property.quarter}`}
                  priceLabel={formatNightPrice(room.basePrice)}
                  photoUrl={room.property.photos?.[0]?.url}
                  className="h-56"
                />
              ))}
            </div>
            {hasMore && (
              <div className="mt-5">
                <Button variant="outline" onClick={loadMore} loading={loadingMore}>
                  Voir plus
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
