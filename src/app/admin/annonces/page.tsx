"use client";

import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { formatDateTime, messageOf } from "@/components/support/parts";
import { Button } from "@/components/ui/Button";
import {
  AUDIENCE_LABEL,
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  publishAnnouncement,
  type AnnouncementAudience,
  type AnnouncementItem,
} from "@/lib/admin-api";
import { useAsyncData } from "@/lib/use-async-data";

const FIELD = "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none";

function Composer({ onCreated }: { onCreated: (item: AnnouncementItem) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("ALL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onCreated(await createAnnouncement({ title, body, audience, href: href.trim() || undefined }));
      setTitle("");
      setBody("");
      setHref("");
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-[var(--color-teal)]">Nouvelle annonce</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Titre" aria-label="Titre" className={FIELD} />
      <div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={300} rows={3} placeholder="Message" aria-label="Message" className={FIELD} />
        <p className="mt-1 text-right text-xs text-slate-400">{body.length}/300</p>
      </div>
      <select value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)} aria-label="Public visé" className={FIELD}>
        {(Object.keys(AUDIENCE_LABEL) as AnnouncementAudience[]).map((a) => (
          <option key={a} value={a}>
            Public : {AUDIENCE_LABEL[a]}
          </option>
        ))}
      </select>
      <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="Lien (facultatif), ex. /explorer" aria-label="Lien" className={FIELD} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={busy} disabled={title.trim().length < 3 || body.trim().length < 5}>
        Enregistrer le brouillon
      </Button>
      <p className="text-xs text-slate-500">Rien n&apos;est envoyé tant que vous n&apos;avez pas publié.</p>
    </form>
  );
}

function Row({ item, onChange, onRemove }: { item: AnnouncementItem; onChange: (item: AnnouncementItem) => void; onRemove: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draft = item.status === "DRAFT";

  async function publish() {
    if (!window.confirm(`Publier cette annonce ? Elle sera envoyée à : ${AUDIENCE_LABEL[item.audience]}. Cette action est définitive.`)) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await publishAnnouncement(item.id));
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm("Supprimer ce brouillon ?")) return;
    setError(null);
    setBusy(true);
    try {
      await deleteAnnouncement(item.id);
      onRemove(item.id);
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-[var(--color-teal)]">{item.title}</p>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${draft ? "bg-amber-100 text-amber-900" : "bg-[var(--color-teal-100)] text-[var(--color-teal)]"}`}>
          {draft ? "Brouillon" : "Publiée"}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{item.body}</p>
      <p className="mt-2 text-xs text-slate-500">
        {AUDIENCE_LABEL[item.audience]}
        {item.href ? ` · lien ${item.href}` : ""}
        {item.publishedAt ? ` · publiée le ${formatDateTime(item.publishedAt)} à ${item.recipientCount} personne${item.recipientCount > 1 ? "s" : ""}` : ` · créée le ${formatDateTime(item.createdAt)}`}
      </p>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {draft && (
        <div className="mt-3 flex gap-2">
          <Button loading={busy} onClick={publish}>
            Publier
          </Button>
          <Button variant="outline" disabled={busy} onClick={remove}>
            Supprimer
          </Button>
        </div>
      )}
    </li>
  );
}

function Announcements() {
  const { loading, data, error } = useAsyncData("admin-announcements", listAnnouncements);
  const [local, setLocal] = useState<AnnouncementItem[] | null>(null);
  const items = local ?? data;

  return (
    <div>
      <Composer onCreated={(item) => setLocal([item, ...(items ?? [])])} />
      {loading && !items && <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />}
      {error && !items && <p className="text-sm text-red-500">{error}</p>}
      {items && items.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">Aucune annonce pour l&apos;instant.</p>}
      {items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <Row
              key={item.id}
              item={item}
              onChange={(next) => setLocal(items.map((i) => (i.id === next.id ? { ...i, ...next } : i)))}
              onRemove={(id) => setLocal(items.filter((i) => i.id !== id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AnnouncementsPage() {
  return <AdminFrame permission="announcements.manage">{() => <Announcements />}</AdminFrame>;
}
