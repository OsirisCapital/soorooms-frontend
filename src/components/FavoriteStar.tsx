"use client";

import { Icon } from "@/components/Icon";
import { toggleFavorite, useFavoriteIds } from "@/lib/use-favorites";

/** Étoile de favori, posée en haut à droite d'une image (le parent doit être `relative`). */
export function FavoriteStar({ propertyId }: { propertyId: string }) {
  const favorites = useFavoriteIds();
  const active = favorites?.has(propertyId) ?? false;

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(propertyId).catch(() => {})}
      aria-pressed={active}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow ${
        active ? "bg-white text-[var(--color-terracotta)]" : "bg-black/35 text-white hover:bg-black/50"
      }`}
    >
      <Icon name="star" size={20} filled={active} />
    </button>
  );
}
