"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { PropertyPhoto } from "@/components/PropertyPhoto";
import { Button } from "@/components/ui/Button";
import { getProperty, type PropertyDetail } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { formatRoomPrice } from "@/lib/rooms";
import { rememberNext } from "@/lib/post-login";
import { useAsyncData } from "@/lib/use-async-data";

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Page d'arrivée d'un QR code : sans compte, sans menu, pensée pour un téléphone en main.
 * Elle montre ce qui est libre CE SOIR ; le bouton mène à la réservation (inscription si besoin,
 * puis retour automatique sur la fiche avec la chambre et les dates déjà choisies).
 */
export default function ArrivalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { checkIn, checkOut } = useMemo(() => {
    const now = new Date();
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    return { checkIn: isoDay(now), checkOut: isoDay(next) };
  }, []);
  const { data: property, loading, error } = useAsyncData(`arrival-${id}-${checkIn}`, () =>
    getProperty(id, { checkInDate: checkIn, checkOutDate: checkOut }),
  );
  const [roomId, setRoomId] = useState<string | null>(null);

  function book(property: PropertyDetail) {
    const room = property.rooms.find((r) => r.id === (roomId ?? firstFree(property)));
    if (!room) return;
    const target = `/logements/${property.id}?room=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`;
    if (getAccessToken()) {
      router.push(target);
    } else {
      rememberNext(target);
      router.push("/register");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-[var(--color-cream)] px-5 pb-10 pt-6">
      <div className="flex justify-center">
        <Logo withWordmark size={36} />
      </div>

      {loading ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-[var(--color-cream-soft)]" />
      ) : error || !property ? (
        <p className="mt-6 rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Logement introuvable."}</p>
      ) : (
        <>
          {property.photos && property.photos[0] ? (
            <PropertyPhoto url={property.photos[0].url} width={960} sizes="100vw" className="mt-6 h-52 w-full rounded-3xl object-cover shadow-md" />
          ) : null}
          <h1 className="mt-5 text-2xl font-bold text-[var(--color-teal)]">{property.title}</h1>
          <p className="mt-1 text-slate-600">
            {property.city} · {property.quarter}
          </p>
          {(property.isVerifiedByAgent || property.identityVerified) && (
            <p className="mt-2 text-xs font-semibold text-[var(--color-teal)]">
              ✓ {property.isVerifiedByAgent ? "Logement vérifié par SòôRooms" : "Identité de l'hôte vérifiée"}
            </p>
          )}

          <h2 className="mt-6 font-display text-lg font-semibold text-[var(--color-teal)]">Disponible ce soir</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {property.rooms.map((r) => {
              const left = r.unitsLeft ?? r.unitCount;
              const selected = (roomId ?? firstFree(property)) === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={left < 1}
                    onClick={() => setRoomId(r.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-left disabled:opacity-50 ${
                      selected && left > 0 ? "border-[var(--color-terracotta)]" : "border-[var(--color-border)]"
                    }`}
                  >
                    <span>
                      <span className="block font-medium text-[var(--color-ink)]">{r.name}</span>
                      <span className={`block text-xs ${left < 1 ? "font-semibold text-red-500" : "text-slate-500"}`}>
                        {left < 1 ? "Complet" : `${left} disponible${left > 1 ? "s" : ""} sur ${r.unitCount}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-[var(--color-teal)]">{formatRoomPrice(r, property.propertyType)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {firstFree(property) ? (
            <div className="mt-6">
              <Button onClick={() => book(property)}>Réserver pour ce soir</Button>
              <p className="mt-2 text-center text-xs text-slate-500">Vous pourrez négocier le prix et payer par Mobile Money.</p>
            </div>
          ) : (
            <p className="mt-6 rounded-2xl bg-white p-4 text-center text-sm text-slate-600 shadow-sm">
              Plus de chambre ce soir.{" "}
              <Link href={`/logements/${property.id}`} className="font-semibold text-[var(--color-terracotta)]">
                Voir d&apos;autres dates
              </Link>
            </p>
          )}
          <p className="mt-6 text-center text-sm text-slate-500">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              onClick={() => rememberNext(`/logements/${property.id}?checkIn=${checkIn}&checkOut=${checkOut}`)}
              className="font-semibold text-[var(--color-teal-600)]"
            >
              Se connecter
            </Link>
          </p>
        </>
      )}
    </main>
  );
}

function firstFree(property: PropertyDetail): string | undefined {
  return property.rooms.find((r) => (r.unitsLeft ?? r.unitCount) > 0)?.id;
}
