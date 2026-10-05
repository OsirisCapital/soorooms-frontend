"use client";

import { AppShell } from "@/components/AppShell";
import { getMyBookings, type BookingStatus } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

// Le backend n'a pas (encore) d'endpoint d'historique de paiements : on
// déduit la liste des réservations qui ont un prix retenu.
const PAYMENT_LABEL: Partial<Record<BookingStatus, string>> = {
  PENDING_PAYMENT: "À payer",
  CONFIRMED_ESCROW: "Payé · en séquestre",
  COMPLETED: "Payé · séjour terminé",
  DISPUTED: "Payé · litige en cours",
};

export default function PaiementsPage() {
  const { data, loading, error } = useAsyncData("my-bookings", getMyBookings);
  const payments = (data ?? []).filter((b) => b.totalPrice != null && PAYMENT_LABEL[b.status]);

  return (
    <AppShell title="Mes paiements" backHref="/profil">
      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : payments.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {payments.map((booking) => (
            <li key={booking.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-[var(--color-teal)]">{booking.room.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDay(booking.checkInDate)} → {formatDay(booking.checkOutDate)}
                </p>
                <p className="mt-1 text-xs font-medium text-[var(--color-teal-600)]">{PAYMENT_LABEL[booking.status]}</p>
              </div>
              <p className="shrink-0 font-semibold text-[var(--color-ink)]">{formatFcfa(booking.totalPrice!)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-slate-600">Aucun paiement pour le moment.</p>
        </div>
      )}
      <p className="mt-6 text-sm text-slate-500">L&apos;historique détaillé et les moyens de paiement arriveront bientôt.</p>
    </AppShell>
  );
}
