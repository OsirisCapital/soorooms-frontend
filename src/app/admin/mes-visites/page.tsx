"use client";

import Link from "next/link";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { formatDay } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";
import { listMyVisits, VISIT_STATUS_LABEL } from "@/lib/visits-api";

function Content() {
  const { data, loading, error } = useAsyncData("my-visits", listMyVisits);
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error || !data) return <p className="text-sm text-red-500">{error ?? "Visites indisponibles."}</p>;
  if (data.length === 0) return <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">Aucune visite ne vous est confiée pour le moment.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {data.map((visit) => (
        <li key={visit.id}>
          <Link href={`/admin/mes-visites/${visit.id}`} className="block rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{visit.property?.title}</p>
                <p className="text-xs text-slate-500">
                  {visit.property?.city} · {visit.property?.quarter}
                  {visit.assignedAt ? ` · confiée le ${formatDay(visit.assignedAt)}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  visit.status === "ASSIGNED" ? "bg-[var(--color-terracotta)] text-white" : "bg-[var(--color-teal-100)] text-[var(--color-teal)]"
                }`}
              >
                {visit.status === "ASSIGNED" ? "À faire" : VISIT_STATUS_LABEL[visit.status]}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MyVisitsPage() {
  return <AdminFrame permission="visits.perform">{() => <Content />}</AdminFrame>;
}
