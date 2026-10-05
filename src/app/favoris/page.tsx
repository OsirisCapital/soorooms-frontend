"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PropertyCard } from "@/components/PropertyCard";
import { getFavorites } from "@/lib/api";
import { formatNightPrice } from "@/lib/rooms";
import { useAsyncData } from "@/lib/use-async-data";
import { useFavoriteIds } from "@/lib/use-favorites";

export default function FavorisPage() {
  const { data, loading, error } = useAsyncData("favorites", getFavorites);
  const favoriteIds = useFavoriteIds();

  // Retirer une étoile fait disparaître la carte tout de suite, sans recharger la liste.
  const properties = (data ?? []).filter((property) => favoriteIds == null || favoriteIds.has(property.id));

  return (
    <AppShell title="Favoris">
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-3xl bg-[var(--color-cream-soft)]" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-red-500 shadow-sm">{error}</p>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-slate-600">Vous n&apos;avez pas encore de favori.</p>
          <p className="mt-2 text-sm text-slate-500">Touchez l&apos;étoile d&apos;un logement pour le retrouver ici.</p>
          <Link href="/explorer" className="mt-3 inline-block font-semibold text-[var(--color-terracotta)]">
            Explorer les logements
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {properties.map((property) => {
            const cheapest = property.rooms.length > 0 ? Math.min(...property.rooms.map((room) => Number(room.basePrice))) : null;
            return (
              <PropertyCard
                key={property.id}
                propertyId={property.id}
                title={property.title}
                subtitle={`${property.city} · ${property.quarter}`}
                priceLabel={cheapest != null ? formatNightPrice(cheapest) : "Prix à venir"}
                photoUrl={property.photos[0]?.url}
                className="h-56"
              />
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
