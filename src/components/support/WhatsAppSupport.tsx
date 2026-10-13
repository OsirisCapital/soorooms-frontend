"use client";

import { listSupportContacts, whatsappLink } from "@/lib/support-contacts-api";
import { useAsyncData } from "@/lib/use-async-data";

/**
 * Boutons « Écrire au support sur WhatsApp ». Aucune API WhatsApp n'est nécessaire : le bouton ouvre la
 * conversation avec un message déjà écrit, et le support répond depuis son téléphone. Rien ne s'affiche
 * tant que le super administrateur n'a ajouté aucun numéro.
 */
export function WhatsAppSupport({ message = "Bonjour, j'ai besoin d'aide sur SòôRooms." }: { message?: string }) {
  const { data } = useAsyncData("support-contacts", () => listSupportContacts());
  if (!data || data.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
      <p className="font-semibold text-[var(--color-ink)]">Écrire au support sur WhatsApp</p>
      <ul className="mt-3 flex flex-col gap-2">
        {data.map((c) => (
          <li key={c.id}>
            <a
              href={whatsappLink(c.phone, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-full bg-[#25D366] px-5 py-3 text-center font-semibold text-white"
            >
              {c.label}
            </a>
            <p className="mt-1 text-center text-xs text-slate-500">
              {c.phone}
              {c.hours ? ` · ${c.hours}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
