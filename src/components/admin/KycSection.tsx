"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { listKycHistory, listPendingKycDetailed, type KycHistoryItem, type PendingKycItem } from "@/lib/admin-api";
import { ApiError, approveKyc, getKycDocumentLink, rejectKyc } from "@/lib/api";
import { formatDay } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

/** Seuls les liens http(s) sont rendus cliquables : ces URL sont saisies par les utilisateurs. */
function safeHttpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");

/**
 * Les documents KYC sont privés : le lien est demandé au serveur au moment du clic
 * (il expire en quelques minutes) et chaque consultation est journalisée côté serveur.
 */
function DocLink({ label, documentId, kind }: { label: string; documentId: string; kind: "id-card" | "proof-of-address" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);

  async function open() {
    setError(null);
    setFallbackHref(null);
    setBusy(true);
    // L'onglet est ouvert tout de suite, pendant le geste de l'utilisateur : les navigateurs
    // mobiles bloquent une ouverture faite après une attente réseau.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const href = safeHttpUrl((await getKycDocumentLink(documentId, kind)).url);
      if (!href) throw new Error("Lien non valide.");
      if (tab) tab.location.href = href;
      else setFallbackHref(href); // fenêtre bloquée : on affiche le lien à toucher
    } catch (err) {
      tab?.close();
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="block text-left text-sm font-semibold text-[var(--color-terracotta)] underline disabled:opacity-60"
      >
        {busy ? "Ouverture…" : label}
      </button>
      {fallbackHref && (
        <a href={fallbackHref} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-[var(--color-teal)] underline">
          Ouvrir le document
        </a>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

// --- KYC en attente ---------------------------------------------------------

export function KycSection() {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  return (
    <section>
      <div role="tablist" aria-label="Accréditations" className="mb-4 flex gap-2">
        {([["pending", "À examiner"], ["history", "Historique"]] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "pending" ? <PendingList /> : <HistoryList />}
    </section>
  );
}

function PendingList() {
  const { data, loading, error } = useAsyncData("admin-kyc", listPendingKycDetailed);
  const [done, setDone] = useState<string[]>([]);
  const items = (data ?? []).filter((item) => !done.includes(item.id));

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-teal)]">Vérifications d&apos;identité{data ? ` (${items.length})` : ""}</h2>
      {loading ? (
        <div className="mt-3 h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Aucune demande en attente.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((item) => (
            <KycCard key={item.id} item={item} onDecided={() => setDone((prev) => [...prev, item.id])} />
          ))}
        </ul>
      )}
    </div>
  );
}

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Douala" }).format(new Date(iso));

function HistoryRow({ item }: { item: KycHistoryItem }) {
  const approved = item.status === "APPROVED";
  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-teal)]">{item.user.fullName}</p>
          <p className="text-sm text-slate-600">{item.user.phone}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${approved ? "bg-[var(--color-teal-100)] text-[var(--color-teal)]" : "bg-red-50 text-red-700"}`}>
          {approved ? "✓ Approuvée" : "✕ Refusée"}
        </span>
      </div>
      {item.reviewerNote && <p className="mt-2 text-sm text-[var(--color-ink)]">Motif : {item.reviewerNote}</p>}
      <p className="mt-2 text-xs text-slate-500">
        {item.reviewedAt ? formatDateTime(item.reviewedAt) : "Date inconnue"} · par {item.reviewer?.fullName ?? "auteur non enregistré"}
      </p>
    </li>
  );
}

function HistoryList() {
  const { data, loading, error } = useAsyncData("admin-kyc-history", () => listKycHistory(50));
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-teal)]">Décisions récentes</h2>
      {loading ? (
        <div className="mt-3 h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      ) : !data || data.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Aucune décision pour le moment.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {data.map((item) => (
            <HistoryRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function KycCard({ item, onDecided }: { item: PendingKycItem; onDecided: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      onDecided();
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="font-display font-semibold text-[var(--color-teal)]">{item.fullName}</p>
      <p className="text-sm text-slate-600">
        {item.phone}
        {item.email ? ` · ${item.email}` : ""}
      </p>
      {item.attempts > 1 && (
        <p className="mt-1 inline-block rounded-full bg-[var(--color-sand,#f2a65a)]/25 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ink)]">
          Nouvelle tentative (demande n°{item.attempts})
        </p>
      )}
      {item.document ? (
        <>
          <p className="mt-1 text-xs text-slate-500">Envoyé le {formatDay(item.document.submittedAt)}</p>
          <div className="mt-3 flex flex-col gap-1">
            <DocLink label="Pièce d'identité" documentId={item.document.id} kind="id-card" />
            {item.document.proofOfAddressUrl && (
              <DocLink label="Justificatif de domicile" documentId={item.document.id} kind="proof-of-address" />
            )}
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Aucun document trouvé.</p>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {rejecting ? (
        <div className="mt-4 flex flex-col gap-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Motif du refus, visible par l'utilisateur (5 caractères minimum)"
            className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none"
          />
          <Button variant="outline" disabled={busy || note.trim().length < 5} onClick={() => decide(() => rejectKyc(item.id, note.trim()))}>
            Confirmer le refus
          </Button>
          <button type="button" onClick={() => setRejecting(false)} disabled={busy} className="text-sm text-slate-500">
            Annuler
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <Button
            loading={busy}
            onClick={() => {
              if (window.confirm(`Approuver la vérification de ${item.fullName} ?`)) decide(() => approveKyc(item.id));
            }}
          >
            Approuver
          </Button>
          <Button variant="outline" onClick={() => setRejecting(true)} disabled={busy}>
            Refuser
          </Button>
        </div>
      )}
    </li>
  );
}
