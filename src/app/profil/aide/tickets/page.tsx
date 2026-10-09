"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { messageOf, StatusBadge } from "@/components/support/parts";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { CATEGORY_LABEL, createTicket, listMyTickets, ticketRef, USER_STATUS_LABEL, type TicketCategory } from "@/lib/support-api";
import { useAsyncData } from "@/lib/use-async-data";
import { useRouter } from "next/navigation";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as TicketCategory[];

function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("OTHER");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const ticket = await createTicket({ subject: subject.trim(), category, message: message.trim() });
      router.push(`/profil/aide/tickets/${ticket.id}`);
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  }

  const valid = subject.trim().length >= 5 && message.trim().length >= 10;
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[var(--color-teal)]">Nouvelle demande</h2>
      <TextField placeholder="Objet (ex : mon paiement n'a pas abouti)" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} aria-label="Objet" />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as TicketCategory)}
        aria-label="Catégorie"
        className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 text-[var(--color-ink)] focus:border-[var(--color-teal)] focus:outline-none"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABEL[c]}
          </option>
        ))}
      </select>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        maxLength={4000}
        placeholder="Décrivez votre problème : que s'est-il passé, avec quel logement ou quelle réservation ?"
        aria-label="Message"
        className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button loading={busy} disabled={!valid} onClick={submit}>
        Envoyer ma demande
      </Button>
    </section>
  );
}

function MyTickets() {
  const { data, loading, error } = useAsyncData("my-tickets", listMyTickets);
  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error || !data) return <p className="text-sm text-red-500">{error ?? "Demandes indisponibles."}</p>;
  if (data.length === 0) return <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Vous n&apos;avez encore envoyé aucune demande.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {data.map((t) => (
        <li key={t.id}>
          <Link href={`/profil/aide/tickets/${t.id}`} className="block rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-[var(--color-teal)]">{t.subject}</p>
              <StatusBadge status={t.status} labels={USER_STATUS_LABEL} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {ticketRef(t.number)} · {CATEGORY_LABEL[t.category]}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function TicketsPage() {
  const [creating, setCreating] = useState(false);
  return (
    <AppShell title="Mes demandes" backHref="/profil/aide">
      <div className="flex flex-col gap-6">
        {creating ? (
          <NewTicketForm />
        ) : (
          <Button onClick={() => setCreating(true)}>Contacter le support</Button>
        )}
        <MyTickets />
      </div>
    </AppShell>
  );
}
