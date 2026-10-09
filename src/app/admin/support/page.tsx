"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { formatDateTime, StatusBadge } from "@/components/support/parts";
import { CATEGORY_LABEL, listStaffTickets, STAFF_STATUS_LABEL, ticketRef, type StaffScope } from "@/lib/support-api";
import { useAsyncData } from "@/lib/use-async-data";

const FILTERS: Array<{ id: string; label: string; status: string; scope: StaffScope }> = [
  { id: "active", label: "À traiter", status: "active", scope: "all" },
  { id: "mine", label: "À moi", status: "active", scope: "mine" },
  { id: "unassigned", label: "Non assignées", status: "active", scope: "unassigned" },
  { id: "all", label: "Toutes", status: "all", scope: "all" },
];

function Inbox() {
  const [filterId, setFilterId] = useState("active");
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const filter = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0];
  const { data, loading, error } = useAsyncData(`staff-tickets-${filter.id}-${q}`, () => listStaffTickets({ status: filter.status, scope: filter.scope, q }));

  return (
    <div>
      <div role="group" aria-label="Filtrer les demandes" className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filterId === f.id}
            onClick={() => setFilterId(f.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${filterId === f.id ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Numéro (SR-0042) ou mot de l'objet"
          aria-label="Rechercher une demande"
          className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none"
        />
        <button type="submit" className="rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-teal)]">
          Chercher
        </button>
      </form>

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error || !data ? (
        <p className="text-sm text-red-500">{error ?? "Demandes indisponibles."}</p>
      ) : data.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Aucune demande ici.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/support/${t.id}`} className="block rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[var(--color-teal)]">{t.subject}</p>
                  <StatusBadge status={t.status} labels={STAFF_STATUS_LABEL} />
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {ticketRef(t.number)} · {t.user.fullName} · {CATEGORY_LABEL[t.category]}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t.assignee ? `Prise en charge par ${t.assignee.fullName}` : "Non assignée"} · dernier message {formatDateTime(t.lastMessageAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminSupportPage() {
  return <AdminFrame permission="support.manage">{() => <Inbox />}</AdminFrame>;
}
