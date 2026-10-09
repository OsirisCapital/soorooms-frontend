"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { type ConversationSummary, listConversations } from "@/lib/messages-api";
import { useAsyncData } from "@/lib/use-async-data";

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  const tz = "Africa/Douala";
  const day = (d: Date) => new Intl.DateTimeFormat("fr-CA", { timeZone: tz }).format(d);
  return day(date) === day(new Date())
    ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(date)
    : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", timeZone: tz }).format(date);
};

function Row({ c }: { c: ConversationSummary }) {
  return (
    <li>
      <Link href={`/messages/${c.bookingId}`} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[var(--color-teal)] ${c.unread > 0 ? "font-bold" : "font-semibold"}`}>{c.counterpart}</p>
          <p className="truncate text-xs text-slate-500">{c.propertyTitle}</p>
          <p className={`mt-1 truncate text-sm ${c.unread > 0 ? "font-medium text-[var(--color-ink)]" : "text-slate-600"}`}>
            {c.lastMessage.mine ? "Vous : " : ""}
            {c.lastMessage.preview}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-slate-400">{formatWhen(c.lastMessage.sentAt)}</span>
          {c.unread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-terracotta)] px-1 text-[11px] font-bold text-white" aria-label={`${c.unread} non lu${c.unread > 1 ? "s" : ""}`}>
              {c.unread > 9 ? "9+" : c.unread}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

export default function MessagesPage() {
  const { loading, data, error } = useAsyncData("conversations", listConversations);
  return (
    <AppShell title="Messages">
      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {data && data.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-[var(--color-teal)]">Aucune conversation pour l&apos;instant</p>
          <p className="mt-2 text-sm text-slate-600">
            Les échanges avec l&apos;hôte (ou le voyageur) se font depuis une réservation : ouvrez-la et touchez « Envoyer un message ».
          </p>
        </div>
      )}
      {data && data.length > 0 && <ul className="flex flex-col gap-3">{data.map((c) => <Row key={c.bookingId} c={c} />)}</ul>}
    </AppShell>
  );
}
