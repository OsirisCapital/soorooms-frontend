"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { listMyProperties } from "@/lib/api";
import { PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

export default function HostPropertiesPage() {
  const { data, loading, error } = useAsyncData("my-properties", listMyProperties);

  return (
    <AppShell title="Mes logements">
      <Link
        href="/hote/logements/nouveau"
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-terracotta)] px-5 py-3.5 font-semibold text-white hover:bg-[var(--color-terracotta-dark)]"
      >
        <Icon name="plus" size={20} />
        Ajouter un logement
      </Link>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : data && data.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {data.map((property) => (
            <li key={property.id}>
              <Link href={`/hote/logements/${property.id}`} className="block rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display font-semibold text-[var(--color-teal)]">{property.title}</h2>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      property.status === "ACTIVE"
                        ? "bg-[var(--color-teal-100)] text-[var(--color-teal)]"
                        : "bg-[var(--color-cream-soft)] text-slate-600"
                    }`}
                  >
                    {PROPERTY_STATUS_LABEL[property.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {property.city} · {property.quarter} · {PROPERTY_TYPE_LABEL[property.propertyType]}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {property.rooms.length} chambre{property.rooms.length > 1 ? "s" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-slate-600">Vous n&apos;avez pas encore de logement.</p>
        </div>
      )}
    </AppShell>
  );
}
