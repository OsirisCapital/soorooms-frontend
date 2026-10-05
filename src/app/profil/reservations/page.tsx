"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getMyBookings } from "@/lib/api";
import { BOOKING_STATUS_LABEL, formatDay, formatFcfa } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

export default function ReservationsPage() {
  const { data, loading, error } = useAsyncData("my-bookings", getMyBookings);

  return (
    <AppShell title="Mes réservations" backHref="/profil">
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : data && data.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {data.map((booking) => (
            <li key={booking.id}>
             <Link href={`/profil/reservations/${booking.id}`} className="block rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display font-semibold text-[var(--color-teal)]">{booking.room.name}</h2>
                <span className="shrink-0 rounded-full bg-[var(--color-teal-100)] px-3 py-1 text-xs font-semibold text-[var(--color-teal)]">
                  {BOOKING_STATUS_LABEL[booking.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {formatDay(booking.checkInDate)} → {formatDay(booking.checkOutDate)}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {booking.totalPrice != null ? formatFcfa(booking.totalPrice) : "Prix en cours de négociation"}
              </p>
             </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-slate-600">Vous n&apos;avez pas encore de réservation.</p>
          <Link href="/home" className="mt-3 inline-block font-semibold text-[var(--color-terracotta)]">
            Découvrir des logements
          </Link>
        </div>
      )}
    </AppShell>
  );
}
