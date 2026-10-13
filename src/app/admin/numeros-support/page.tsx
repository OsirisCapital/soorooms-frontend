"use client";

import { useState, type FormEvent } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import {
  createSupportContact,
  deleteSupportContact,
  listSupportContactsAdmin,
  updateSupportContact,
  whatsappLink,
  type SupportContactAdmin,
} from "@/lib/support-contacts-api";
import { useAsyncData } from "@/lib/use-async-data";

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
const FIELD = "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none";

function Contacts() {
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useAsyncData(`support-contacts-admin-${version}`, () => listSupportContactsAdmin());
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const refresh = () => setVersion((v) => v + 1);
  const contacts = data ?? [];

  async function add(e: FormEvent) {
    e.preventDefault();
    if (label.trim().length < 2) return setFormError("Donnez un nom à ce contact (par exemple « Support SòôRooms »).");
    if (!phone.trim()) return setFormError("Saisissez le numéro WhatsApp.");
    setBusy(true);
    setFormError(null);
    try {
      await createSupportContact({ label: label.trim(), phone: phone.trim(), hours: hours.trim() || undefined });
      setLabel("");
      setPhone("");
      setHours("");
      refresh();
    } catch (err) {
      setFormError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: SupportContactAdmin) {
    setFormError(null);
    try {
      await updateSupportContact(c.id, { active: !c.active });
      refresh();
    } catch (err) {
      setFormError(messageOf(err));
    }
  }

  async function remove(c: SupportContactAdmin) {
    if (!window.confirm(`Supprimer « ${c.label} » ? Le bouton disparaîtra pour tous les utilisateurs.`)) return;
    setFormError(null);
    try {
      await deleteSupportContact(c.id);
      refresh();
    } catch (err) {
      setFormError(messageOf(err));
    }
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Numéros WhatsApp du support</h1>
      <p className="mb-4 text-sm text-slate-600">
        Ces numéros s&apos;affichent dans « Aide et support » sous forme de boutons WhatsApp. Ils fonctionnent tout de suite, sans API : l&apos;utilisateur ouvre la conversation et votre équipe répond depuis son téléphone.
      </p>

      {loading && contacts.length === 0 ? (
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {contacts.length === 0 && <li className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">Aucun numéro pour l&apos;instant : le bouton WhatsApp n&apos;apparaît pas.</li>}
          {contacts.map((c) => (
            <li key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-ink)]">{c.label}</p>
                  <p className="text-sm text-slate-600">
                    {c.phone}
                    {c.hours ? ` · ${c.hours}` : ""}
                  </p>
                  <p className={`mt-1 text-xs font-semibold ${c.active ? "text-[var(--color-teal)]" : "text-slate-400"}`}>{c.active ? "Affiché aux utilisateurs" : "Masqué"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                  <a href={whatsappLink(c.phone, "Test depuis l'administration SòôRooms")} target="_blank" rel="noopener noreferrer" className="text-[var(--color-teal)] underline">
                    Tester
                  </a>
                  <button type="button" onClick={() => toggle(c)} className="text-slate-600 underline">
                    {c.active ? "Masquer" : "Afficher"}
                  </button>
                  <button type="button" onClick={() => remove(c)} className="text-red-500">
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-5 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Ajouter un numéro</h2>
        <input className={FIELD} placeholder="Nom (ex. Support SòôRooms)" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} />
        <input className={FIELD} placeholder="Numéro WhatsApp (ex. 6 70 00 00 00 ou +237…)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={FIELD} placeholder="Horaires (facultatif : Lun–Sam, 8 h–18 h)" maxLength={80} value={hours} onChange={(e) => setHours(e.target.value)} />
        {formError && <p className="text-sm text-red-500">{formError}</p>}
        <Button type="submit" loading={busy}>Ajouter</Button>
        <p className="text-xs text-slate-500">Les membres du support se créent dans l&apos;onglet « Équipe » : ajoutez le compte et choisissez le niveau « Support ».</p>
      </form>
    </>
  );
}

export default function SupportNumbersPage() {
  return <AdminFrame permission="settings.manage">{() => <Contacts />}</AdminFrame>;
}
