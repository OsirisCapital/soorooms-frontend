"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { messageOf } from "@/components/support/parts";
import { Button } from "@/components/ui/Button";
import {
  assignTask,
  createTask,
  deleteTask,
  listStaff,
  listTasks,
  setTaskStatus,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  type AdminAccess,
  type StaffMember,
  type StaffTask,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/admin-api";
import { useAsyncData } from "@/lib/use-async-data";

const FIELD = "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none";

/** Date du jour au Cameroun, AAAA-MM-JJ : sert à repérer les tâches en retard. */
const today = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Africa/Douala" }).format(new Date());
const frDate = (iso: string) => iso.split("-").reverse().join("/");

function Composer({ staff, onCreated }: { staff: StaffMember[]; onCreated: (t: StaffTask) => void }) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [href, setHref] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onCreated(await createTask({ title, details: details || undefined, assigneeId, priority, dueDate: dueDate || undefined, href: href.trim() || undefined }));
      setTitle("");
      setDetails("");
      setDueDate("");
      setHref("");
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-[var(--color-teal)]">Confier une tâche</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Titre" aria-label="Titre" className={FIELD} />
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={2} placeholder="Détails (facultatif)" aria-label="Détails" className={FIELD} />
      <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} aria-label="Confier à" className={FIELD}>
        <option value="">Confier à…</option>
        {staff.map((m) => (
          <option key={m.id} value={m.id}>
            {m.fullName}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} aria-label="Priorité" className={FIELD}>
          {(Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              {TASK_PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
        <input type="date" value={dueDate} min={today()} onChange={(e) => setDueDate(e.target.value)} aria-label="Pour le" className={FIELD} />
      </div>
      <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="Lien (facultatif), ex. /admin/support" aria-label="Lien" className={FIELD} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={busy} disabled={title.trim().length < 3 || !assigneeId}>
        Confier la tâche
      </Button>
    </form>
  );
}

function Task({ task, canManage, staff, onChange, onRemove }: { task: StaffTask; canManage: boolean; staff: StaffMember[]; onChange: (t: StaffTask) => void; onRemove: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overdue = task.status !== "DONE" && task.dueDate !== null && task.dueDate < today();

  async function run(action: () => Promise<StaffTask | { ok: true }>, removed = false) {
    setError(null);
    setBusy(true);
    try {
      const result = await action();
      if (removed) onRemove(task.id);
      else onChange(result as StaffTask);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  const move = (status: TaskStatus, label: string, primary = false) => (
    <Button key={status} variant={primary ? "primary" : "outline"} disabled={busy} onClick={() => run(() => setTaskStatus(task.id, status))}>
      {label}
    </Button>
  );

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className={`font-semibold ${task.status === "DONE" ? "text-slate-500 line-through" : "text-[var(--color-teal)]"}`}>{task.title}</p>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${task.priority === "HIGH" ? "bg-[var(--color-terracotta)]/15 text-[var(--color-terracotta-dark,#a24f22)]" : "bg-slate-100 text-slate-600"}`}>
          {TASK_PRIORITY_LABEL[task.priority]}
        </span>
      </div>
      {task.details && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{task.details}</p>}
      <p className="mt-2 text-xs text-slate-500">
        {TASK_STATUS_LABEL[task.status]} · {task.assignee ? task.assignee.fullName : "Non assignée"}
        {task.createdBy ? ` · confiée par ${task.createdBy.fullName}` : ""}
      </p>
      {task.dueDate && (
        <p className={`mt-1 text-xs ${overdue ? "font-semibold text-red-600" : "text-slate-500"}`}>
          {overdue ? "En retard · " : ""}Pour le {frDate(task.dueDate)}
        </p>
      )}
      {task.href && (
        <Link href={task.href} className="mt-2 inline-block text-sm font-semibold text-[var(--color-teal)] underline">
          Ouvrir
        </Link>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {task.status === "TODO" && move("IN_PROGRESS", "Commencer")}
        {task.status !== "DONE" && move("DONE", "Terminer", true)}
        {task.status === "DONE" && move("TODO", "Rouvrir")}
      </div>
      {canManage && (
        <div className="mt-3 flex gap-2">
          <select
            value={task.assignee?.id ?? ""}
            disabled={busy}
            aria-label="Réassigner"
            onChange={(e) => e.target.value && run(() => assignTask(task.id, e.target.value))}
            className={FIELD}
          >
            <option value="">{task.assignee ? "Réassigner à…" : "Assigner à…"}</option>
            {staff.filter((m) => m.id !== task.assignee?.id).map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => window.confirm("Supprimer cette tâche ?") && run(() => deleteTask(task.id), true)}
          >
            Supprimer
          </Button>
        </div>
      )}
    </li>
  );
}

function Tasks({ access }: { access: AdminAccess }) {
  const canManage = access.permissions.includes("staff.manage");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [filter, setFilter] = useState<"open" | "done">("open");
  const { loading, data, error } = useAsyncData(`admin-tasks-${scope}-${filter}`, () => listTasks(scope, filter));
  const staffState = useAsyncData<StaffMember[]>(canManage ? "admin-staff-for-tasks" : "admin-staff-skip", () => (canManage ? listStaff() : Promise.resolve([])));
  const staff = staffState.data ?? [];
  const [overrides, setOverrides] = useState<{ key: string; items: StaffTask[] } | null>(null);
  const key = `${scope}-${filter}`;
  const items = overrides?.key === key ? overrides.items : data;
  const set = (next: StaffTask[]) => setOverrides({ key, items: next });

  const pill = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`;

  return (
    <div>
      {canManage && <Composer staff={staff} onCreated={(t) => (scope === "all" || t.assignee?.id === access.id ? set([t, ...(items ?? [])]) : undefined)} />}
      <div role="group" aria-label="Filtrer les tâches" className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
        <button type="button" aria-pressed={scope === "mine"} onClick={() => setScope("mine")} className={pill(scope === "mine")}>
          Mes tâches
        </button>
        {canManage && (
          <button type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")} className={pill(scope === "all")}>
            Toute l&apos;équipe
          </button>
        )}
        <button type="button" aria-pressed={filter === "open"} onClick={() => setFilter("open")} className={pill(filter === "open")}>
          À faire
        </button>
        <button type="button" aria-pressed={filter === "done"} onClick={() => setFilter("done")} className={pill(filter === "done")}>
          Terminées
        </button>
      </div>
      {loading && !items && <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />}
      {error && !items && <p className="text-sm text-red-500">{error}</p>}
      {items && items.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{filter === "open" ? "Rien à faire pour l'instant." : "Aucune tâche terminée."}</p>}
      {items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((t) => (
            <Task
              key={t.id}
              task={t}
              canManage={canManage}
              staff={staff}
              onChange={(next) => set(filter === "open" && next.status === "DONE" ? items.filter((x) => x.id !== next.id) : filter === "done" && next.status !== "DONE" ? items.filter((x) => x.id !== next.id) : items.map((x) => (x.id === next.id ? next : x)))}
              onRemove={(id) => set(items.filter((x) => x.id !== id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TasksPage() {
  return <AdminFrame permission="dashboard.view">{(access) => <Tasks access={access} />}</AdminFrame>;
}
