/** Rapports financiers : un pour l'équipe finance (admin), un pour l'hôte connecté. Montants en FCFA. */
import { authRequest } from "./api";
import type { PayoutStatus } from "./payouts-api";

export type EscrowStatus = "HELD_IN_ESCROW" | "RELEASED_TO_HOST" | "REFUNDED_TO_TRAVELER";

export const ESCROW_STATUS_LABEL: Record<EscrowStatus, string> = {
  HELD_IN_ESCROW: "En séquestre",
  RELEASED_TO_HOST: "Versé à l'hôte",
  REFUNDED_TO_TRAVELER: "Remboursé au voyageur",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  MTN_MOMO: "MTN Mobile Money",
  ORANGE_MONEY: "Orange Money",
  CREDIT_CARD: "Carte bancaire",
  INCONNU: "Non précisé",
};

export interface CountAmount {
  count: number;
  amount: number;
}

export interface FinanceLine {
  /** Jour du paiement « AAAA-MM-JJ ». */
  date: string;
  bookingId: string;
  property: string;
  city: string;
  room: string;
  amount: number;
  fee: number;
  net: number;
  escrowStatus: EscrowStatus;
  payoutStatus: PayoutStatus | null;
}

export interface FinanceReport {
  generatedAt: string;
  days: string[];
  period: {
    /** Argent reçu des voyageurs sur la période. */
    collected: number;
    bookings: number;
    /** Commission des réservations dont le versement à l'hôte est terminé. */
    commissionEarned: number;
    /** Part des hôtes effectivement versée sur la période. */
    hostNetReleased: number;
    refunded: number;
    refundedCount: number;
    /** Boosts payés (admin uniquement ; 0 côté hôte). */
    boosts: number;
    /** Admin : commissions + boosts. Hôte : net reçu. */
    revenue: number;
  };
  /** Situation actuelle, indépendante de la période. */
  now: { held: number; heldFee: number; heldNet: number; disputedCount: number; disputedAmount: number };
  payouts: { toSend: CountAmount; inFlight: CountAmount; failed: CountAmount; paid: CountAmount };
  series: { collected: number[]; settled: number[] };
  byMethod: Array<{ method: string; count: number; amount: number }>;
  byProperty: Array<{ propertyId: string; title: string; city: string; bookings: number; amount: number; fee: number; net: number }>;
  lines: FinanceLine[];
}

export const getAdminFinanceReport = (days: number) => authRequest<FinanceReport>(`/admin/finance/report?days=${days}`);
export const getHostFinanceReport = (days: number) => authRequest<FinanceReport>(`/finance/me?days=${days}`);

/** CSV prêt pour Excel en français : séparateur « ; », accents conservés (BOM UTF-8). */
export function financeCsv(lines: FinanceLine[]): string {
  const cell = (value: string | number | null) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = ["Date", "Logement", "Ville", "Chambre", "Montant payé (FCFA)", "Commission (FCFA)", "Net hôte (FCFA)", "Séquestre", "Versement"];
  const body = lines.map((line) =>
    [line.date, line.property, line.city, line.room, line.amount, line.fee, line.net, ESCROW_STATUS_LABEL[line.escrowStatus], line.payoutStatus ?? ""].map(cell).join(";"),
  );
  return `﻿${[header.map(cell).join(";"), ...body].join("\r\n")}`;
}
