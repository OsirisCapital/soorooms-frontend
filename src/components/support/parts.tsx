"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import type { TicketStatus } from "@/lib/support-api";

export const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Douala" }).format(new Date(iso));

const STATUS_STYLE: Record<TicketStatus, string> = {
  OPEN: "bg-[var(--color-terracotta)]/15 text-[var(--color-terracotta-dark,#a24f22)]",
  IN_PROGRESS: "bg-[var(--color-teal-100)] text-[var(--color-teal)]",
  WAITING_USER: "bg-amber-100 text-amber-900",
  RESOLVED: "bg-slate-100 text-slate-700",
  CLOSED: "bg-slate-100 text-slate-500",
};

/** Pastille de statut : le texte porte le sens, la couleur n'est qu'un renfort. */
export function StatusBadge({ status, labels }: { status: TicketStatus; labels: Record<TicketStatus, string> }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>{labels[status]}</span>;
}

export type Bubble = { id: string; mine: boolean; author: string; body: string; createdAt: string; internal?: boolean };

/** Fil de conversation. `mine` = du côté de la personne qui regarde (à droite). */
export function Conversation({ messages }: { messages: Bubble[] }) {
  return (
    <ol className="flex flex-col gap-3" aria-label="Conversation">
      {messages.map((m) => (
        <li key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              m.internal
                ? "border border-dashed border-amber-400 bg-amber-50 text-amber-950"
                : m.mine
                  ? "bg-[var(--color-teal)] text-white"
                  : "bg-white text-[var(--color-ink)]"
            }`}
          >
            <p className={`mb-1 text-xs font-semibold ${m.mine && !m.internal ? "text-white/80" : "text-slate-500"}`}>
              {m.internal ? "Note interne · " : ""}
              {m.author}
            </p>
            {/* whitespace-pre-wrap garde les retours à la ligne ; React échappe le texte (aucun HTML interprété). */}
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
            <p className={`mt-1 text-[11px] ${m.mine && !m.internal ? "text-white/70" : "text-slate-400"}`}>{formatDateTime(m.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Zone de réponse. `onSend` rejette avec un message lisible en cas d'échec. */
export function ReplyBox({
  onSend,
  allowInternal = false,
  placeholder = "Votre message…",
}: {
  onSend: (body: string, internal: boolean) => Promise<void>;
  allowInternal?: boolean;
  placeholder?: string;
}): ReactNode {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await onSend(body.trim(), internal);
      setBody("");
      setInternal(false);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder={internal ? "Note visible de l'équipe seulement…" : placeholder}
        aria-label="Votre message"
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none ${internal ? "border-amber-400" : "border-[var(--color-border)]"}`}
      />
      {allowInternal && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
          Note interne (l&apos;utilisateur ne la verra pas)
        </label>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button loading={busy} disabled={body.trim().length < 2} onClick={submit}>
        {internal ? "Ajouter la note" : "Envoyer"}
      </Button>
    </div>
  );
}
