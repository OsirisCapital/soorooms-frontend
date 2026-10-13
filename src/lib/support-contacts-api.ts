/** Numéros WhatsApp du support : liste publique, et gestion par le super administrateur. */
import { authRequest, publicRequest } from "./api";

export interface SupportContactPublic {
  id: string;
  label: string;
  /** Format international « +237… ». */
  phone: string;
  hours: string | null;
}

export interface SupportContactAdmin extends SupportContactPublic {
  active: boolean;
  position: number;
}

export const listSupportContacts = () => publicRequest<SupportContactPublic[]>("/support/contacts");

/** Lien qui ouvre la conversation WhatsApp avec un message déjà écrit. */
export const whatsappLink = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export const listSupportContactsAdmin = () => authRequest<SupportContactAdmin[]>("/admin/support-contacts");

export const createSupportContact = (payload: { label: string; phone: string; hours?: string }) =>
  authRequest<SupportContactAdmin>("/admin/support-contacts", { method: "POST", body: JSON.stringify(payload) });

export const updateSupportContact = (id: string, payload: Partial<{ label: string; phone: string; hours: string; active: boolean; position: number }>) =>
  authRequest<SupportContactAdmin>(`/admin/support-contacts/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteSupportContact = (id: string) => authRequest<null>(`/admin/support-contacts/${encodeURIComponent(id)}`, { method: "DELETE" });
