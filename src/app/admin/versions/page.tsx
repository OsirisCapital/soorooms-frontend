"use client";

import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { formatDateTime, messageOf } from "@/components/support/parts";
import { Button } from "@/components/ui/Button";
import { APP_VERSION } from "@/lib/app-version";
import { listReleases, publishRelease, setReleaseRequired, type ReleaseItem } from "@/lib/admin-api";
import { useAsyncData } from "@/lib/use-async-data";

const FIELD = "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none";

function Publisher({ onPublished }: { onPublished: (release: ReleaseItem) => void }) {
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const warning = required
      ? `Publier la version ${version} en OBLIGATOIRE ? Toutes les applications plus anciennes seront bloquées tant qu'elles ne sont pas mises à jour. Vérifiez que cette version est bien déployée.`
      : `Publier la version ${version} ? Un bandeau proposera la mise à jour aux utilisateurs.`;
    if (!window.confirm(warning)) return;
    setError(null);
    setBusy(true);
    try {
      onPublished(await publishRelease({ version: version.trim(), notes, required }));
      setVersion("");
      setNotes("");
      setRequired(false);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-[var(--color-teal)]">Publier une version</h2>
      <p className="rounded-2xl bg-[var(--color-cream-soft)] p-3 text-xs text-slate-600">
        Ordre à respecter : 1) changez le numéro de version dans le code et déployez, 2) publiez ici le même numéro. Cette page tourne en version{" "}
        <strong>{APP_VERSION}</strong>.
      </p>
      <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Numéro, ex. 1.1.0" aria-label="Numéro de version" inputMode="decimal" className={FIELD} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} placeholder="Ce qui change, en une ou deux phrases" aria-label="Nouveautés" className={FIELD} />
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="mt-1" />
        <span>
          Mise à jour <strong>obligatoire</strong> : bloque les versions plus anciennes jusqu&apos;à leur mise à jour.
        </span>
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={busy} disabled={!/^\d+\.\d+\.\d+$/.test(version.trim()) || notes.trim().length < 5}>
        Publier
      </Button>
    </form>
  );
}

function ReleaseRow({ release, onChange }: { release: ReleaseItem; onChange: (release: ReleaseItem) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !release.required;
    if (!window.confirm(next ? `Rendre la version ${release.version} obligatoire ?` : `Retirer le caractère obligatoire de la version ${release.version} ? Les applications ne seront plus bloquées.`)) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await setReleaseRequired(release.id, next));
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-[var(--color-teal)]">Version {release.version}</p>
        {release.required && <span className="shrink-0 rounded-full bg-[var(--color-terracotta)]/15 px-3 py-1 text-xs font-semibold text-[var(--color-terracotta-dark,#a24f22)]">Obligatoire</span>}
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{release.notes}</p>
      <p className="mt-2 text-xs text-slate-500">Publiée le {formatDateTime(release.publishedAt)}</p>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-3">
        <Button variant="outline" loading={busy} onClick={toggle}>
          {release.required ? "Retirer l'obligation" : "Rendre obligatoire"}
        </Button>
      </div>
    </li>
  );
}

function Versions() {
  const { loading, data, error } = useAsyncData("admin-releases", listReleases);
  const [local, setLocal] = useState<ReleaseItem[] | null>(null);
  const items = local ?? data;

  return (
    <div>
      <Publisher onPublished={(release) => setLocal([release, ...(items ?? [])])} />
      {loading && !items && <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />}
      {error && !items && <p className="text-sm text-red-500">{error}</p>}
      {items && items.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">Aucune version publiée pour l&apos;instant.</p>}
      {items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((release) => (
            <ReleaseRow key={release.id} release={release} onChange={(next) => setLocal(items.map((r) => (r.id === next.id ? next : r)))} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function VersionsPage() {
  return <AdminFrame permission="releases.manage">{() => <Versions />}</AdminFrame>;
}
