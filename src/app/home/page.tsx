"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ListingCarousel } from "@/components/home/ListingCarousel";
import { SearchBar } from "@/components/home/SearchBar";
import { getAccessToken } from "@/lib/auth-storage";
import { firstNameOf, useMe } from "@/lib/use-me";
import { useRoomSearch } from "@/lib/use-room-search";

// STATIQUE — liste de villes proposée en filtre ; pas d'endpoint dédié.
const CITIES = ["Douala", "Yaoundé", "Kribi", "Bafoussam"];

export default function HomePage() {
  const router = useRouter();
  const [city, setCity] = useState<string | undefined>(undefined);
  const firstName = firstNameOf(useMe());

  useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
  }, [router]);

  // « Destinations populaires » : le backend n'a pas de notion de
  // popularité — on prend les logements actifs, filtrés par ville si une
  // puce est sélectionnée.
  const popular = useRoomSearch({ city, limit: 10 });

  // « Séjours uniques » : même logique, restreinte aux maisons d'hôtes.
  const unique = useRoomSearch({ propertyType: "GUEST_HOUSE", limit: 10 });

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-xl flex-1 pb-28 pt-6">
        <header className="flex flex-col items-center px-5 text-center">
          <p className="font-display text-2xl font-bold tracking-tight">
            <span className="text-[var(--color-terracotta)]">Sòô</span>
            <span className="text-[var(--color-teal)]">Rooms</span>
          </p>
          <h1 className="mt-4 text-3xl font-bold text-[var(--color-teal)]">{firstName ? `Bonjour, ${firstName} !` : "Bonjour !"}</h1>
          <p className="mt-2 text-slate-600">Bienvenue sur SòôRooms. Prêt à explorer ?</p>
        </header>

        <div className="mt-8">
          <SearchBar />
        </div>

        <ListingCarousel
          title="Destinations populaires"
          rooms={popular.rooms}
          loading={popular.loading}
          failed={popular.failed}
          emptyLabel={city ? `Aucun logement disponible à ${city} pour le moment.` : "Aucun logement disponible pour le moment."}
        />

        {/* Puces de ville : filtrent « Destinations populaires ». */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5">
          {[undefined, ...CITIES].map((name) => {
            const active = name === city;
            return (
              <button
                key={name ?? "all"}
                type="button"
                onClick={() => setCity(name)}
                aria-pressed={active}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  active
                    ? "bg-[var(--color-terracotta)] text-white"
                    : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"
                }`}
              >
                {name ?? "Toutes"}
              </button>
            );
          })}
        </div>

        <ListingCarousel
          title="Séjours uniques"
          rooms={unique.rooms}
          loading={unique.loading}
          failed={unique.failed}
          emptyLabel="Aucune maison d'hôtes disponible pour le moment."
        />
      </main>
      <BottomNav />
    </>
  );
}
