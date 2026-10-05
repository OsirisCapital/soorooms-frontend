"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BookingPanel } from "@/components/BookingPanel";
import { getBooking } from "@/lib/api";
import { useAsyncData } from "@/lib/use-async-data";

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAsyncData(`booking-${id}`, () => getBooking(id));

  return (
    <AppShell backHref="/profil/reservations">
      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
        </div>
      ) : error || !data ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Réservation introuvable."}</p>
      ) : (
        <BookingPanel initial={data} viewer="TRAVELER" />
      )}
    </AppShell>
  );
}
