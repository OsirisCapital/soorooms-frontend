/** Commissions et frais : taux en vigueur (tout utilisateur) et réglages (super administrateur). */
import { authRequest } from "./api";

export interface CurrentFees {
  /** Commission appliquée aux hôtes maintenant (offre de lancement comprise). */
  hostCommissionPercent: number;
  travelerFeePercent: number;
  launchActive: boolean;
  launchEndsAt: string | null;
  standardHostCommissionPercent: number;
}

export interface FeeSettings {
  id: string;
  hostCommissionPercent: number;
  launchHostCommissionPercent: number | null;
  launchEndsAt: string | null;
  travelerFeePercent: number;
  verificationVisitPrice: number | null;
  note: string | null;
  by: string | null;
  createdAt: string;
}

export interface AdminFeesView {
  current: FeeSettings | null;
  applied: { hostCommissionPercent: number; travelerFeePercent: number; launchActive: boolean } | null;
  history: FeeSettings[];
}

export interface FeesUpdate {
  hostCommissionPercent: number;
  launchHostCommissionPercent: number | null;
  launchEndsAt: string | null;
  travelerFeePercent: number;
  verificationVisitPrice?: number;
  note?: string;
}

export const getCurrentFees = () => authRequest<CurrentFees | null>("/fees/current");
export const getAdminFees = () => authRequest<AdminFeesView>("/admin/fees");
export const updateAdminFees = (body: FeesUpdate) => authRequest<AdminFeesView>("/admin/fees", { method: "PUT", body: JSON.stringify(body) });

/** 5 → « 5 % », 2.5 → « 2,5 % ». */
export const formatPercent = (value: number) => `${String(value).replace(".", ",")} %`;

/** Même arrondi que le serveur : frais voyageur d'un séjour. */
export const travelerFeeFor = (stayPrice: number, percent: number) => Math.round((stayPrice * percent) / 100);
