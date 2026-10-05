import type { RoomSearchResult } from "./api";

/**
 * La recherche renvoie des chambres : un logement à plusieurs chambres
 * apparaît plusieurs fois. On garde une carte par logement, avec sa chambre la
 * moins chère, dans l'ordre d'apparition.
 */
export function dedupeByProperty(rooms: RoomSearchResult[]): RoomSearchResult[] {
  const best = new Map<string, RoomSearchResult>();
  for (const room of rooms) {
    const known = best.get(room.propertyId);
    if (!known || Number(room.basePrice) < Number(known.basePrice)) best.set(room.propertyId, room);
  }
  return [...best.values()];
}

export const formatNightPrice = (price: string | number) => `${Number(price).toLocaleString("fr-FR")} FCFA/nuit`;
