"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Conversation, messageOf, ReplyBox, StatusBadge } from "@/components/support/parts";
import { Button } from "@/components/ui/Button";
import { CATEGORY_LABEL, closeMyTicket, getMyTicket, replyToMyTicket, ticketRef, USER_STATUS_LABEL, type UserTicket } from "@/lib/support-api";
import { useAsyncData } from "@/lib/use-async-data";

function Ticket({ initial }: { initial: UserTicket }) {
  const [ticket, setTicket] = useState(initial);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function close() {
    if (!window.confirm("Clôturer cette demande ? Vous ne pourrez plus y répondre.")) return;
    setError(null);
    setClosing(true);
    try {
      setTicket(await closeMyTicket(ticket.id));
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setClosing(false);
    }
  }

  const closed = ticket.status === "CLOSED";
  return (
    <>
      <p className="text-xs text-slate-500">
        {ticketRef(ticket.number)} · {CATEGORY_LABEL[ticket.category]}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--color-teal)]">{ticket.subject}</h1>
      <div className="mb-6 mt-3">
        <StatusBadge status={ticket.status} labels={USER_STATUS_LABEL} />
      </div>

      <Conversation
        messages={ticket.messages.map((m) => ({ id: m.id, mine: !m.isStaff, author: m.isStaff ? "Support SòôRooms" : "Vous", body: m.body, createdAt: m.createdAt }))}
      />

      {closed ? (
        <p className="mt-6 rounded-2xl bg-white p-4 text-center text-sm text-slate-600 shadow-sm">Cette demande est clôturée. Pour un nouveau sujet, ouvrez une nouvelle demande.</p>
      ) : (
        <>
          <ReplyBox
            onSend={async (body) => {
              setTicket(await replyToMyTicket(ticket.id, body));
            }}
          />
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <Button variant="outline" className="mt-3" loading={closing} onClick={close}>
            Clôturer la demande
          </Button>
        </>
      )}
    </>
  );
}

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAsyncData(`my-ticket-${id}`, () => getMyTicket(id));
  return (
    <AppShell backHref="/profil/aide/tickets">
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error || !data ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Demande introuvable."}</p>
      ) : (
        <Ticket initial={data} />
      )}
    </AppShell>
  );
}
