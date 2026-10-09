"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { Conversation, messageOf, ReplyBox, StatusBadge } from "@/components/support/parts";
import {
  assignTicket,
  CATEGORY_LABEL,
  getStaffTicket,
  replyAsStaff,
  setTicketStatus,
  STAFF_STATUS_LABEL,
  ticketRef,
  type StaffTicket,
  type TicketStatus,
} from "@/lib/support-api";
import { useAsyncData } from "@/lib/use-async-data";

const STATUSES = Object.keys(STAFF_STATUS_LABEL) as TicketStatus[];

function Detail({ initial, myId }: { initial: StaffTicket; myId: string }) {
  const [ticket, setTicket] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<StaffTicket>) {
    setError(null);
    setBusy(true);
    try {
      setTicket(await action());
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  const mine = ticket.assignee?.id === myId;
  return (
    <>
      <p className="text-xs text-slate-500">
        {ticketRef(ticket.number)} · {CATEGORY_LABEL[ticket.category]}
      </p>
      <h2 className="mt-1 text-2xl font-bold text-[var(--color-teal)]">{ticket.subject}</h2>

      <section className="mt-4 rounded-2xl bg-white p-4 text-sm shadow-sm">
        <p className="font-semibold text-[var(--color-ink)]">{ticket.user.fullName}</p>
        <p className="text-slate-600">
          {ticket.user.phone}
          {ticket.user.email ? ` · ${ticket.user.email}` : ""}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Compte {ticket.user.role === "HOST" ? "hôte" : ticket.user.role === "ADMIN" ? "équipe" : "voyageur"}
          {ticket.bookingId ? ` · réservation ${ticket.bookingId.slice(0, 8)}` : ""}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Statut</span>
            <select
              value={ticket.status}
              disabled={busy}
              onChange={(e) => run(() => setTicketStatus(ticket.id, e.target.value as TicketStatus))}
              className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STAFF_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <StatusBadge status={ticket.status} labels={STAFF_STATUS_LABEL} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-600">{ticket.assignee ? `Prise en charge par ${mine ? "vous" : ticket.assignee.fullName}` : "Non assignée"}</span>
          {!mine && (
            <button type="button" disabled={busy} onClick={() => run(() => assignTicket(ticket.id, myId))} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold text-[var(--color-teal)] disabled:opacity-60">
              Me l&apos;attribuer
            </button>
          )}
          {mine && (
            <button type="button" disabled={busy} onClick={() => run(() => assignTicket(ticket.id, null))} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold text-slate-600 disabled:opacity-60">
              Retirer
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </section>

      <div className="mt-6">
        <Conversation
          messages={ticket.messages.map((m) => ({
            id: m.id,
            // Côté équipe : les messages de l'équipe sont « à moi » (à droite).
            mine: m.isStaff,
            author: m.author.fullName,
            body: m.body,
            createdAt: m.createdAt,
            internal: m.internal,
          }))}
        />
      </div>

      {ticket.status === "CLOSED" ? (
        <p className="mt-6 rounded-2xl bg-white p-4 text-center text-sm text-slate-600 shadow-sm">Demande clôturée : rouvrez-la via le statut pour répondre.</p>
      ) : (
        <ReplyBox
          allowInternal
          placeholder="Votre réponse à l'utilisateur…"
          onSend={async (body, internal) => {
            setTicket(await replyAsStaff(ticket.id, body, internal));
          }}
        />
      )}
    </>
  );
}

function Loader({ myId }: { myId: string }) {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAsyncData(`staff-ticket-${id}`, () => getStaffTicket(id));
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error || !data) return <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Demande introuvable."}</p>;
  return <Detail initial={data} myId={myId} />;
}

export default function AdminTicketPage() {
  return <AdminFrame permission="support.manage">{(access) => <Loader myId={access.id} />}</AdminFrame>;
}
