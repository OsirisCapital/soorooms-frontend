"use client";

import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { VisitResultView } from "@/components/VisitResultView";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";
import { assignVisit, listVisitAgents, listVisits, VISIT_STATUS_LABEL, type Visit } from "@/lib/visits-api";
import { CHECKLIST_FALLBACK } from "@/lib/visit-checklist";

const FIELD = "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";

function VisitCard({ visit, agents, onAssigned }: { visit: Visit; agents: Array<{ id: string; fullName: string }>; onAssigned: () => void }) {
  const [agentId, setAgentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const canAssign = visit.status === "PENDING_ASSIGNMENT" || visit.status === "ASSIGNED";

  async function assign() {
    if (!agentId) return setError("Choisissez un agent.");
    setBusy(true);
    setError(null);
    try {
      await assignVisit(visit.id, agentId);
      onAssigned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assignation impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-ink)]">{visit.property?.title}</p>
          <p className="text-xs text-slate-500">
            {visit.property?.city} · {visit.property?.quarter}
            {visit.paidAt ? ` · payée le ${formatDay(visit.paidAt)}` : ""}
            {visit.amount ? ` · ${formatFcfa(visit.amount)}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--color-teal-100)] px-3 py-1 text-xs font-semibold text-[var(--color-teal)]">{VISIT_STATUS_LABEL[visit.status]}</span>
      </div>

      {visit.agentName && <p className="mt-2 text-sm text-slate-600">Agent : {visit.agentName}</p>}

      {canAssign && (
        <div className="mt-3 flex flex-col gap-2">
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} aria-label="Agent" className={FIELD}>
            <option value="">{visit.status === "ASSIGNED" ? "Changer d'agent…" : "Choisir un agent…"}</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.fullName}</option>
            ))}
          </select>
          {agents.length === 0 && (
            <p className="text-xs text-slate-500">Aucun agent pour le moment : dans « Équipe », donnez le niveau « Agent de terrain » à un membre.</p>
          )}
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <Button loading={busy} onClick={assign}>{visit.status === "ASSIGNED" ? "Réassigner" : "Assigner"}</Button>
        </div>
      )}

      {visit.result && (
        <div className="mt-3">
          <button type="button" onClick={() => setOpen((v) => !v)} className="text-sm font-semibold text-[var(--color-teal)]">
            {open ? "Masquer le rapport" : "Voir le rapport"}
          </button>
          {open && (
            <div className="mt-3">
              <VisitResultView result={visit.result} checklist={CHECKLIST_FALLBACK} />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Content() {
  const visits = useAsyncData("admin-visits", listVisits);
  const agents = useAsyncData("admin-visit-agents", listVisitAgents);
  const [fresh, setFresh] = useState<Visit[] | null>(null);
  const list = fresh ?? visits.data;

  if (visits.loading || agents.loading) return <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (visits.error || !list) return <p className="text-sm text-red-500">{visits.error ?? "Visites indisponibles."}</p>;

  const toAssign = list.filter((v) => v.status === "PENDING_ASSIGNMENT").length;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        {toAssign > 0 ? `${toAssign} visite${toAssign > 1 ? "s" : ""} payée${toAssign > 1 ? "s" : ""} à assigner.` : "Aucune visite en attente d'agent."}
      </p>
      {list.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">Aucune visite payée pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((visit) => (
            <VisitCard key={visit.id} visit={visit} agents={agents.data ?? []} onAssigned={() => void listVisits().then(setFresh)} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminVisitsPage() {
  return <AdminFrame permission="visits.manage">{() => <Content />}</AdminFrame>;
}
