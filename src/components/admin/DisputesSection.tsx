"use client";

import { type AdminDispute, listDisputes } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

// --- Litiges (lecture seule) --------------------------------------------------

export function DisputesSection() {
  const { data, loading, error } = useAsyncData("admin-disputes", listDisputes);

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--color-teal)]">Litiges ouverts{data ? ` (${data.length})` : ""}</h2>
      <p className="mt-1 text-sm text-slate-500">
        Les fonds restent bloqués en séquestre. La résolution (remboursement ou reversement) arrivera avec l&apos;intégration du
        paiement.
      </p>
      {loading ? (
        <div className="mt-3 h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      ) : !data || data.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Aucun litige ouvert.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {data.map((dispute: AdminDispute) => (
            <li key={dispute.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-display font-semibold text-[var(--color-teal)]">{dispute.room.property.title}</p>
              <p className="text-sm text-slate-600">
                {dispute.room.name} · {dispute.room.property.city}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatDay(dispute.checkInDate)} → {formatDay(dispute.checkOutDate)}
                {dispute.totalPrice != null ? ` · ${formatFcfa(dispute.totalPrice)}` : ""}
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink)]">
                <strong>Voyageur :</strong> {dispute.traveler.fullName} ({dispute.traveler.phone})
              </p>
              <p className="mt-2 rounded-xl bg-[var(--color-cream)] px-3 py-2 text-sm text-[var(--color-ink)]">
                {dispute.disputeReason ?? "Aucun motif renseigné."}
              </p>
              {dispute.escrowVault && (
                <p className="mt-2 text-xs text-slate-500">
                  Séquestre : {formatFcfa(dispute.escrowVault.amountHeld)} ({dispute.escrowVault.status})
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
