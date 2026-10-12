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

/** Prix d'une chambre d'une résidence étudiante : le forfait le plus court proposé. */
export function formatResidencePrice(room: { semesterPrice?: string | number | null; yearPrice?: string | number | null }) {
  const fmt = (n: string | number) => Number(n).toLocaleString("fr-FR");
  if (room.semesterPrice != null) return `${fmt(room.semesterPrice)} FCFA/semestre`;
  if (room.yearPrice != null) return `${fmt(room.yearPrice)} FCFA/an`;
  return "Prix à venir";
}

/** Libellé de prix adapté au type de logement (nuit, ou forfait pour une résidence étudiante). */
export function formatRoomPrice(room: { basePrice: string | number; semesterPrice?: string | number | null; yearPrice?: string | number | null }, propertyType?: string) {
  return propertyType === "STUDENT_RESIDENCE" ? formatResidencePrice(room) : formatNightPrice(room.basePrice);
}

/** Date de fin d'un forfait : 6 ou 12 mois après l'entrée (aperçu — le serveur fait foi). */
export function termEnd(entry: string, term: "SEMESTER" | "YEAR") {
  if (!entry) return "";
  const d = new Date(`${entry}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + (term === "SEMESTER" ? 6 : 12));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
