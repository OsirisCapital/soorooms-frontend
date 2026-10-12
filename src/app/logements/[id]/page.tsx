"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FavoriteStar } from "@/components/FavoriteStar";
import { PropertyPhoto } from "@/components/PropertyPhoto";
import { Button } from "@/components/ui/Button";
import { ApiError, createBooking, getProperty, type EventSlot, type PropertyDetail } from "@/lib/api";
import { EVENT_SLOT_LABEL, EVENT_TYPES, formatFcfa, nextDay, nightsBetween, PROPERTY_TYPE_LABEL } from "@/lib/booking-labels";
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
        <Suspense fallback={null}>
          <PropertyContent property={property} />
        </Suspense>
      )}
    </AppShell>
  );
}

function PropertyContent({ property }: { property: PropertyDetail }) {
  const router = useRouter();
  // Un lien (QR code, page d'arrivée) peut pré-remplir la chambre et les dates.
  const initial = useSearchParams();
  const wantedRoom = initial.get("room");
  const [roomId, setRoomId] = useState(
    property.rooms.find((r) => r.id === wantedRoom)?.id ?? property.rooms[0]?.id ?? "",
  );
  const [checkIn, setCheckIn] = useState(initial.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(initial.get("checkOut") ?? "");
  const isHall = property.propertyType === "EVENT_HALL";
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventSlot, setEventSlot] = useState<EventSlot>("EVENING");
  const [eventGuests, setEventGuests] = useState("");
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [offer, setOffer] = useState("");
  const [forSomeone, setForSomeone] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  // Une salle est réservée pour une date : le lendemain sert seulement de borne de fin.
  const endDate = isHall ? nextDay(checkIn) : checkOut;
  const nights = isHall ? (checkIn ? 1 : 0) : nightsBetween(checkIn, checkOut);

  // Une fois les deux dates choisies, on redemande les unités libres sur ce séjour précis.
  const [leftByRoom, setLeftByRoom] = useState<Record<string, number>>({});
  useEffect(() => {
    if (nights < 1) return;
    let cancelled = false;
    getProperty(property.id, { checkInDate: checkIn, checkOutDate: endDate })
      .then((fresh) => {
        if (!cancelled) setLeftByRoom(Object.fromEntries(fresh.rooms.map((r) => [r.id, r.unitsLeft ?? r.unitCount])));
      })
      .catch(() => {
        if (!cancelled) setLeftByRoom({});
      });
    return () => {
      cancelled = true;
    };
  }, [property.id, checkIn, endDate, nights]);

  const leftOf = (r: PropertyDetail["rooms"][number]) => (nights >= 1 ? leftByRoom[r.id] : undefined) ?? r.unitsLeft ?? r.unitCount;
  const room = property.rooms.find((r) => r.id === roomId);
  const roomFull = room ? leftOf(room) < 1 : false;
  const hallOptions = property.hallOptions ?? [];
  const optionsTotal = hallOptions.filter((o) => optionIds.includes(o.id)).reduce((sum, o) => sum + Number(o.price), 0);
  const listedTotal = room ? (isHall ? Number(room.basePrice) + optionsTotal : Number(room.basePrice) * nights) : 0;
  const amenities = amenityLabels(property.amenities);

  async function handleBook(event: React.FormEvent) {
    event.preventDefault();
    if (!room) return;
    if (nights < 1) return setError(isHall ? "Choisissez la date de l'événement." : "Choisissez une date d'arrivée et une date de départ.");
    const guests = Number(eventGuests);
    if (isHall) {
      if (!Number.isInteger(guests) || guests < 1) return setError("Indiquez le nombre d'invités.");
      if (guests > room.maxGuests) return setError(`Cette salle accueille ${room.maxGuests} personnes au maximum.`);
    }

    const proposedPrice = offer.trim() ? Number(offer.replace(/\s/g, "")) : undefined;
    if (proposedPrice !== undefined && (!Number.isFinite(proposedPrice) || proposedPrice < 0)) {
      return setError("Le montant proposé n'est pas valide.");
    }

    if (forSomeone && guestName.trim().length < 2) {
      return setError("Indiquez le nom de la personne qui séjournera.");
    }

    setError(null);
    setBusy(true);
    try {
      const booking = await createBooking({
        roomId: room.id,
        checkInDate: checkIn,
        ...(isHall ? { eventType, eventSlot, eventGuests: guests, optionIds } : { checkOutDate: checkOut }),
        proposedPrice,
        ...(forSomeone ? { guestName: guestName.trim(), guestPhone: guestPhone.trim() || undefined } : {}),
      });
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
      {(property.isVerifiedByAgent || property.identityVerified) && (
        <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[var(--color-teal)]">
          {property.isVerifiedByAgent && <span className="rounded-full bg-[var(--color-teal-100)] px-3 py-1">✓ Logement vérifié par SòôRooms</span>}
          {property.identityVerified && <span className="rounded-full bg-[var(--color-teal-100)] px-3 py-1">✓ Identité de l&apos;hôte vérifiée</span>}
        </p>
      )}

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
                      {r.photos && r.photos.length > 0 && (
                        <span className="mb-2 mt-1 flex gap-1.5">
                          {r.photos.slice(0, 3).map((photo) => (
                            <PropertyPhoto key={photo.id} url={photo.url} width={200} className="h-14 w-20 rounded-lg object-cover" />
                          ))}
                        </span>
                      )}
                      <span className="block text-xs text-slate-500">
                        {isHall
                          ? `${r.roomType} · jusqu'à ${r.maxGuests} invités`
                          : `${r.roomType} · ${r.maxGuests} voyageur${r.maxGuests > 1 ? "s" : ""} · ${r.bedroomCount} chambre${r.bedroomCount > 1 ? "s" : ""} · ${r.bedCount} lit${r.bedCount > 1 ? "s" : ""}`}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-[var(--color-teal)]">
                      {Number(r.basePrice).toLocaleString("fr-FR")} FCFA/{isHall ? "événement" : "nuit"}
                    </span>
                    <span className={`block text-xs ${leftOf(r) < 1 ? "font-semibold text-red-500" : "text-slate-500"}`}>
                      {leftOf(r) < 1 ? (isHall ? "Déjà réservée" : "Complet") : isHall ? "Disponible" : `${leftOf(r)} disponible${leftOf(r) > 1 ? "s" : ""} sur ${r.unitCount}`}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            {isHall ? (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                  Date de l&apos;événement
                  <input
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                    Créneau
                    <select
                      value={eventSlot}
                      onChange={(e) => setEventSlot(e.target.value as EventSlot)}
                      className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
                    >
                      {Object.entries(EVENT_SLOT_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                    Type d&apos;événement
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                  Nombre d&apos;invités{room ? ` (max ${room.maxGuests})` : ""}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={room?.maxGuests}
                    value={eventGuests}
                    onChange={(e) => setEventGuests(e.target.value)}
                    required
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
                  />
                </label>
                {hallOptions.length > 0 && (
                  <fieldset>
                    <legend className="text-xs font-medium text-slate-500">Options (facultatif)</legend>
                    <ul className="mt-1 flex flex-col gap-2">
                      {hallOptions.map((o) => (
                        <li key={o.id}>
                          <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]">
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={optionIds.includes(o.id)}
                                onChange={(e) => setOptionIds((prev) => (e.target.checked ? [...prev, o.id] : prev.filter((x) => x !== o.id)))}
                              />
                              {o.name}
                            </span>
                            <span className="text-slate-500">+ {formatFcfa(o.price)}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                )}
              </div>
            ) : (
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
            )}

            {nights > 0 && (
              <p className="mt-4 text-sm text-slate-600">
                {isHall ? "Au tarif affiché (salle + options)" : `${nights} nuit${nights > 1 ? "s" : ""} au tarif affiché`} :{" "}
                <strong className="text-[var(--color-ink)]">{formatFcfa(listedTotal)}</strong>
              </p>
            )}

            <label className="mt-4 flex items-center gap-2 text-sm text-[var(--color-ink)]">
              <input type="checkbox" checked={forSomeone} onChange={(e) => setForSomeone(e.target.checked)} />
              Je réserve pour quelqu&apos;un d&apos;autre
            </label>
            {forSomeone && (
              <div className="mt-2 grid grid-cols-1 gap-2">
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nom de la personne qui séjournera"
                  aria-label="Nom de l'occupant"
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
                />
                <input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Son téléphone (facultatif)"
                  aria-label="Téléphone de l'occupant"
                  inputMode="tel"
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
                />
                <p className="text-xs text-slate-500">Vous restez le payeur et le contact de l&apos;hôte ; le reçu est à votre nom.</p>
              </div>
            )}

            <label className="mt-4 flex flex-col gap-1 text-xs font-medium text-slate-500">
              {isHall ? "Proposer un autre prix pour l'événement (facultatif)" : "Proposer un autre prix pour le séjour (facultatif)"}
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
              {roomFull && (
                <p className="mb-2 text-sm text-red-500">{isHall ? "Cette salle est déjà réservée à cette date. Choisissez une autre date." : "Ce type de chambre est complet sur ces dates. Choisissez d'autres dates ou une autre chambre."}</p>
              )}
              <Button type="submit" loading={busy} disabled={roomFull}>
                {offer.trim() ? "Envoyer ma proposition" : "Demander cette réservation"}
              </Button>
            </div>
          </>
        )}
      </form>
    </>
  );
}
