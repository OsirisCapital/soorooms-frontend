import type { BookingStatus } from "./api";

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  NEGOTIATING: "Négociation en cours",
  PENDING_PAYMENT: "Paiement en attente",
  CONFIRMED_ESCROW: "Confirmée",
  COMPLETED: "Terminée",
  DISPUTED: "Litige",
  CANCELLED: "Annulée",
};

export function formatDay(isoDate: string) {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatFcfa(amount: string | number) {
  return `${Number(amount).toLocaleString("fr-FR")} FCFA`;
}

export const PROPERTY_TYPE_LABEL: Record<string, string> = {
  HOTEL: "Hôtel",
  FURNISHED_APARTMENT: "Appartement meublé",
  STUDENT_ROOM: "Chambre étudiante",
  GUEST_HOUSE: "Maison d'hôtes",
};

/** Nombre de nuits entre deux dates YYYY-MM-DD (0 si invalide). */
export function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime();
  return Math.max(0, Math.round(diff / 86_400_000));
}

export const PROPERTY_STATUS_LABEL: Record<string, string> = {
  PENDING_KYC: "Non publié",
  ACTIVE: "En ligne",
  SUSPENDED: "Suspendu",
};
