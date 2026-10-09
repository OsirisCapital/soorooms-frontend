"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BookingPanel } from "@/components/BookingPanel";
import { getBooking } from "@/lib/api";
import { useAsyncData } from "@/lib/use-async-data";
import Link from "next/link";

export default function HostBookingPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAsyncData(`host-booking-${id}`, () => getBooking(id));

  return (
    <AppShell backHref="/hote/reservations">
      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
        </div>
      ) : error || !data ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Réservation introuvable."}</p>
      ) : (
           <>
     <BookingPanel initial={data} viewer="HOST" />
     <Link href={`/messages/${id}`} className="mt-4 block rounded-full border border-[var(--color-teal)] px-5 py-3 text-center font-semibold text-[var(--color-teal)]">
       Envoyer un message au voyageur
     </Link>
   </>
      )}
    </AppShell>
  );
}
