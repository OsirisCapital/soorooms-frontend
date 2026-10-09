"use client";

import { AdminFrame } from "@/components/admin/AdminFrame";
import { listAuditLog } from "@/lib/admin-api";
import { useAsyncData } from "@/lib/use-async-data";

/** Libellés lisibles des actions écrites dans le journal ; une action inconnue s'affiche telle quelle. */
const ACTION_LABEL: Record<string, string> = {
  "kyc.document.view": "A ouvert un document d'identité",
  "kyc.approve": "A approuvé une vérification d'identité",
  "kyc.reject": "A refusé une vérification d'identité",
  "support.assign": "A assigné une demande de support",
  "support.status": "A changé le statut d'une demande de support",
  "announcement.publish": "A publié une annonce",
  "release.publish": "A publié une version de l'application",
  "staff.add": "A ajouté un membre à l'équipe",
  "staff.update": "A modifié le niveau ou les accès d'un membre",
  "staff.remove": "A retiré un membre de l'équipe",
  "task.assign": "A confié une tâche",
  "release.required": "A changé le caractère obligatoire d'une version",
};

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Douala" }).format(new Date(iso));

function AuditList() {
  const { data, loading, error } = useAsyncData("admin-audit", () => listAuditLog(100));

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data || data.length === 0) {
    return <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Aucune action enregistrée pour le moment.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {data.map((entry) => (
        <li key={entry.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--color-teal)]">{entry.actor?.fullName ?? "Compte supprimé"}</p>
          <p className="text-sm text-[var(--color-ink)]">{ACTION_LABEL[entry.action] ?? entry.action}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(entry.createdAt)}
            {entry.targetId ? ` · réf. ${entry.targetId.slice(0, 8)}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function AuditPage() {
  return (
    <AdminFrame permission="audit.view">
      {() => (
        <section>
          <h2 className="text-xl font-bold text-[var(--color-teal)]">Journal des actions</h2>
          <p className="mt-1 mb-4 text-sm text-slate-500">Qui a fait quoi, et quand. Les 100 dernières actions de l&apos;équipe.</p>
          <AuditList />
        </section>
      )}
    </AdminFrame>
  );
}
