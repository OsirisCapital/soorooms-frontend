/** Options payantes d'une salle de fêtes (côté hôte). */
import { authRequest, type HallOption } from "./api";

const base = (propertyId: string) => `/properties/${encodeURIComponent(propertyId)}/hall-options`;

export const listHallOptions = (propertyId: string) => authRequest<HallOption[]>(base(propertyId));

export const addHallOption = (propertyId: string, payload: { name: string; price: number }) =>
  authRequest<HallOption>(base(propertyId), { method: "POST", body: JSON.stringify(payload) });

export const removeHallOption = (propertyId: string, optionId: string) =>
  authRequest<null>(`${base(propertyId)}/${encodeURIComponent(optionId)}`, { method: "DELETE" });
