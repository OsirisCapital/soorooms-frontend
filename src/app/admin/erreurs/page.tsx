"use client";

import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { ApiError } from "@/lib/api";
import { listErrors, resolveError, type ErrorEventView } from "@/lib/errors-api";
import { useAsyncData } from "@/lib/use-async-data";

const formatDateTime = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Douala" }).format(new Date(iso));
const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");

function ErrorRow({ item, onResolved }: { item: ErrorEventView; onResolved: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolve() {
    setBusy(true);
    setError(null);
    try {
      await resolveError(item.id);
      onResolved();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`rounded-2xl bg-white p-4 shadow-sm ${item.resolvedAt ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-[var(--color-teal)]">
            {item.method} {item.path}
          </p>
          <p className="mt-1 break-words text-sm text-[var(--color-ink)]">{item.message}</p>
          <p className="mt-1 text-xs text-slate-500">
            {item.count} fois · dernière : {formatDateTime(item.lastSeenAt)} · première : {formatDateTime(item.firstSeenAt)}
          </p>
        </div>
        {!item.resolvedAt && (
          <button type="button" onClick={resolve} disabled={busy} className="shrink-0 rounded-full border border-[var(--color-teal)] px-3 py-1.5 text-xs font-semibold text-[var(--color-teal)] disabled:opacity-60">
            Marquer résolue
          </button>
        )}
      </div>
      {item.stack && (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 text-xs text-slate-500 underline">
            {open ? "Masquer le détail technique" : "Voir le détail technique"}
          </button>
          {open && <pre className="mt-2 max-h-60 overflow-auto rounded-xl bg-[var(--color-cream-soft)] p-3 text-[11px] leading-snug text-slate-700">{item.stack}</pre>}
        </>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </li>
  );
}

function Errors() {
  const [version, setVersion] = useState(0);
  const [showResolved, setShowResolved] = useState(false);
  const { data, loading, error } = useAsyncData(`admin-errors-${showResolved}-${version}`, () => listErrors(showResolved));

  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Erreurs du serveur</h1>
      <p className="mb-4 text-sm text-slate-600">
        Chaque erreur 5xx est enregistrée ici, regroupée par cause. Vous êtes prévenu à la première occurrence, quand une erreur résolue revient, puis à 10, 100 et 1 000 répétitions.
      </p>
      {data && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${data.open > 0 ? "text-[var(--color-terracotta)]" : "text-[var(--color-teal)]"}`}>{data.open}</p>
            <p className="text-xs text-slate-600">erreur(s) ouverte(s)</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[var(--color-ink)]">{data.last24h}</p>
            <p className="text-xs text-slate-600">vue(s) ces dernières 24 h</p>
          </div>
        </div>
      )}
      <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
        Afficher aussi les erreurs résolues
      </label>
      {loading && !data ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 shadow-sm">Aucune erreur. Tout va bien ✓</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.items.map((item) => (
            <ErrorRow key={item.id} item={item} onResolved={() => setVersion((v) => v + 1)} />
          ))}
        </ul>
      )}
    </>
  );
}

export default function ErrorsPage() {
  return <AdminFrame permission="audit.view">{() => <Errors />}</AdminFrame>;
}
