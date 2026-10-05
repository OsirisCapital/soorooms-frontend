"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BOOKING_STATUS_LABEL, formatDay, formatFcfa } from "@/lib/booking-labels";
import { loadHostOverview, needsHostAction } from "@/lib/host-data";
import { useAsyncData } from "@/lib/use-async-data";

export default function HostBookingsPage() {
  const { data, loading, error } = useAsyncData("host-overview", loadHostOverview);
  const bookings = data?.bookings ?? [];

  return (
    <AppShell title="Réservations">
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-slate-600">Aucune réservation reçue pour le moment.</p>
          <p className="mt-2 text-sm text-slate-500">Les demandes des voyageurs apparaîtront ici.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((booking) => {
            const action = needsHostAction(booking);
            return (
              <li key={booking.id}>
                <Link href={`/hote/reservations/${booking.id}`} className="block rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display font-semibold text-[var(--color-teal)]">{booking.propertyTitle}</h2>
                      <p className="text-xs text-slate-500">{booking.room.name}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--color-teal-100)] px-3 py-1 text-xs font-semibold text-[var(--color-teal)]">
                      {BOOKING_STATUS_LABEL[booking.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDay(booking.checkInDate)} → {formatDay(booking.checkOutDate)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                    {booking.totalPrice != null
                      ? formatFcfa(booking.totalPrice)
                      : booking.offers[0]
                        ? `Offre : ${formatFcfa(booking.offers[0].amount)}`
                        : "—"}
                  </p>
                  {action && (
                    <p className="mt-2 inline-block rounded-full bg-[var(--color-terracotta)] px-3 py-1 text-xs font-semibold text-white">
                      Action requise
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
