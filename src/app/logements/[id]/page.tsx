"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FavoriteStar } from "@/components/FavoriteStar";
import { PropertyPhoto } from "@/components/PropertyPhoto";
import { Button } from "@/components/ui/Button";
import { ApiError, createBooking, getProperty, type PropertyDetail } from "@/lib/api";
import { formatFcfa, nightsBetween, PROPERTY_TYPE_LABEL } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

// Sans photo, une case colorée tient la place de la galerie.
const HERO_GRADIENT = "linear-gradient(160deg, #c1622e, #7a3a18)";

function amenityLabels(amenities: PropertyDetail["amenities"]) {
  if (!amenities) return [];
  const labels: string[] = [];
  if (amenities.hasWifi) labels.push("Wi-Fi");
  if (amenities.hasGeneratorOrSolar) labels.push("Groupe électrogène / solaire");
  if (amenities.hasAc) labels.push("Climatisation");
  if (amenities.hasParking) labels.push("Parking");
  return [...labels, ...amenities.additionalEquipments];
}

export default function PropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, loading, error } = useAsyncData(`property-${id}`, () => getProperty(id));

  return (
    <AppShell backHref="/home">
      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="h-56 animate-pulse rounded-3xl bg-[var(--color-cream-soft)]" />
          <div className="h-8 w-2/3 animate-pulse rounded-xl bg-[var(--color-cream-soft)]" />
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
        </div>
      ) : error || !property ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Logement introuvable."}</p>
      ) : (
        <PropertyContent property={property} />
      )}
    </AppShell>
  );
}

function PropertyContent({ property }: { property: PropertyDetail }) {
  const router = useRouter();
  const [roomId, setRoomId] = useState(property.rooms[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [offer, setOffer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const room = property.rooms.find((r) => r.id === roomId);
  const nights = nightsBetween(checkIn, checkOut);
  const listedTotal = room ? Number(room.basePrice) * nights : 0;
  const amenities = amenityLabels(property.amenities);

  async function handleBook(event: React.FormEvent) {
    event.preventDefault();
    if (!room) return;
    if (nights < 1) return setError("Choisissez une date d'arrivée et une date de départ.");

    const proposedPrice = offer.trim() ? Number(offer.replace(/\s/g, "")) : undefined;
    if (proposedPrice !== undefined && (!Number.isFinite(proposedPrice) || proposedPrice < 0)) {
      return setError("Le montant proposé n'est pas valide.");
    }

    setError(null);
    setBusy(true);
    try {
      const booking = await createBooking({ roomId: room.id, checkInDate: checkIn, checkOutDate: checkOut, proposedPrice });
      router.push(`/profil/reservations/${booking.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Réservation impossible. Réessayez.");
      setBusy(false);
    }
  }

  return (
    <>
      <div className="relative">
        {property.photos && property.photos.length > 0 ? (
          <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto">
            {property.photos.map((photo) => (
              <PropertyPhoto
                key={photo.id}
                url={photo.url}
                width={960}
                widths={[640, 960, 1280]}
                sizes="100vw"
                className="h-56 w-full shrink-0 snap-center rounded-3xl object-cover shadow-md"
              />
            ))}
          </div>
        ) : (
          <div className="h-56 rounded-3xl shadow-md" style={{ background: HERO_GRADIENT }} aria-hidden="true" />
        )}
        <FavoriteStar propertyId={property.id} />
      </div>

      <h1 className="mt-5 text-2xl font-bold text-[var(--color-teal)]">{property.title}</h1>
      <p className="mt-1 text-slate-600">
        {property.city} · {property.quarter} · {PROPERTY_TYPE_LABEL[property.propertyType] ?? property.propertyType}
      </p>

      <p className="mt-4 whitespace-pre-line text-[var(--color-ink)]">{property.description}</p>

      {amenities.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-[var(--color-teal)]">Équipements</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {amenities.map((label) => (
              <li key={label} className="rounded-full bg-[var(--color-teal-100)] px-3 py-1.5 text-sm text-[var(--color-teal)]">
                {label}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={handleBook} className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Réserver</h2>

        {property.rooms.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Aucune chambre n&apos;est disponible pour ce logement.</p>
        ) : (
          <>
            <fieldset className="mt-4 flex flex-col gap-2">
              <legend className="sr-only">Chambre</legend>
              {property.rooms.map((r) => (
                <label
                  key={r.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                    r.id === roomId ? "border-[var(--color-terracotta)] bg-[var(--color-cream)]" : "border-[var(--color-border)]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="room" value={r.id} checked={r.id === roomId} onChange={() => setRoomId(r.id)} />
                    <span>
                      <span className="block font-medium text-[var(--color-ink)]">{r.name}</span>
                      <span className="block text-xs text-slate-500">
                        {r.roomType} · {r.maxGuests} voyageur{r.maxGuests > 1 ? "s" : ""} · {r.bedroomCount} chambre
                        {r.bedroomCount > 1 ? "s" : ""} · {r.bedCount} lit{r.bedCount > 1 ? "s" : ""}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--color-teal)]">
                    {Number(r.basePrice).toLocaleString("fr-FR")} FCFA/nuit
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Arrivée
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut && e.target.value >= checkOut) setCheckOut("");
                  }}
                  required
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Départ
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
                />
              </label>
            </div>

            {nights > 0 && (
              <p className="mt-4 text-sm text-slate-600">
                {nights} nuit{nights > 1 ? "s" : ""} au tarif affiché :{" "}
                <strong className="text-[var(--color-ink)]">{formatFcfa(listedTotal)}</strong>
              </p>
            )}

            <label className="mt-4 flex flex-col gap-1 text-xs font-medium text-slate-500">
              Proposer un autre prix pour le séjour (facultatif)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder={nights > 0 ? String(listedTotal) : "Montant total en FCFA"}
                className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              Le prix n&apos;est définitif que lorsque l&apos;hôte l&apos;a accepté. Vous ne payez qu&apos;ensuite.
            </p>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <div className="mt-4">
              <Button type="submit" loading={busy}>
                {offer.trim() ? "Envoyer ma proposition" : "Demander cette réservation"}
              </Button>
            </div>
          </>
        )}
      </form>
    </>
  );
}
