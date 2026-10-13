import type { RoomSearchResult } from "./api";

/**
 * La recherche renvoie des chambres : un logement à plusieurs chambres
 * apparaît plusieurs fois. On garde une carte par logement, avec sa chambre la
 * moins chère, dans l'ordre d'apparition.
 */
export function dedupeByProperty(rooms: RoomSearchResult[], nap = false): RoomSearchResult[] {
  const best = new Map<string, RoomSearchResult>();
  const priceOf = (r: RoomSearchResult) => Number(nap ? (r.napPrice ?? r.basePrice) : r.basePrice);
  for (const room of rooms) {
    const known = best.get(room.propertyId);
    if (!known || priceOf(room) < priceOf(known)) best.set(room.propertyId, room);
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

/** Les hôtels et auberges peuvent proposer des siestes. */
export const canOfferNaps = (propertyType?: string) => propertyType === "HOTEL" || propertyType === "HOSTEL";

/** « 14 h – 17 h » */
export function napRange(startHour: number, hours: number) {
  return `${startHour} h – ${startHour + hours} h`;
}

export function formatNapPrice(room: { napPrice?: string | number | null; napHours?: number | null }) {
  const price = Number(room.napPrice ?? 0).toLocaleString("fr-FR");
  return `${price} FCFA/sieste${room.napHours ? ` (${room.napHours} h)` : ""}`;
}
