/** Calendrier de l'hôte : occupation jour par jour et fermeture de dates (côté hôte). */
import { authRequest } from "./api";

export interface CalendarDay {
  /** AAAA-MM-JJ */
  date: string;
  booked: number;
  blocked: number;
  free: number;
}

export interface RoomCalendar {
  unitCount: number;
  days: CalendarDay[];
}

export interface RoomBlockView {
  id: string;
  /** Premier jour fermé (AAAA-MM-JJ). */
  startDate: string;
  /** Dernier jour fermé, inclus (AAAA-MM-JJ). */
  endDate: string;
  /** null = toutes les unités du type de chambre. */
  units: number | null;
  reason: string | null;
}

const base = (propertyId: string, roomId: string) => `/properties/${encodeURIComponent(propertyId)}/rooms/${encodeURIComponent(roomId)}`;

export const getRoomCalendar = (propertyId: string, roomId: string, from: string, days = 35) =>
  authRequest<RoomCalendar>(`${base(propertyId, roomId)}/calendar?from=${encodeURIComponent(from)}&days=${days}`);

export const listRoomBlocks = (propertyId: string, roomId: string) => authRequest<RoomBlockView[]>(`${base(propertyId, roomId)}/blocks`);

export const createRoomBlock = (propertyId: string, roomId: string, payload: { startDate: string; endDate: string; units?: number; reason?: string }) =>
  authRequest<RoomBlockView>(`${base(propertyId, roomId)}/blocks`, { method: "POST", body: JSON.stringify(payload) });

export const deleteRoomBlock = (propertyId: string, roomId: string, blockId: string) =>
  authRequest<null>(`${base(propertyId, roomId)}/blocks/${encodeURIComponent(blockId)}`, { method: "DELETE" });
