import type { BookingStatus } from "./api";

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  NEGOTIATING: "Négociation en cours",
  PENDING_PAYMENT: "Paiement en attente",
  DEPOSIT_PAID: "Acompte payé · solde à régler",
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
  EVENT_HALL: "Salle de fêtes",
  STUDENT_RESIDENCE: "Résidence étudiante",
};

export const STAY_TERM_LABEL: Record<string, string> = {
  SEMESTER: "Semestre (6 mois)",
  YEAR: "Année (12 mois)",
};

export const EVENT_SLOT_LABEL: Record<string, string> = {
  DAY: "Journée",
  EVENING: "Soirée",
  FULL: "24 h (jour et soir)",
};

export const EVENT_TYPES = ["Mariage", "Anniversaire", "Baptême", "Réunion / conférence", "Cérémonie", "Autre"];

/** Lendemain d'une date YYYY-MM-DD (une salle est réservée pour une date). */
export function nextDay(date: string) {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

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
