"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BookingPanel } from "@/components/BookingPanel";
import { getBooking } from "@/lib/api";
import { useAsyncData } from "@/lib/use-async-data";
import Link from "next/link";

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
           <>
     <BookingPanel initial={data} viewer="TRAVELER" />
     {["CONFIRMED_ESCROW", "COMPLETED", "DISPUTED"].includes(data.status) && (
       <Link href={`/profil/reservations/${id}/recu`} className="mt-4 block rounded-full bg-[var(--color-teal-600)] px-5 py-3 text-center font-semibold text-white">
         Voir mon reçu
       </Link>
     )}
     {["CONFIRMED_ESCROW", "COMPLETED"].includes(data.status) && (
       <Link href={`/profil/reservations/${id}/attestation`} className="mt-3 block rounded-full border border-[var(--color-teal)] px-5 py-3 text-center font-semibold text-[var(--color-teal)]">
         Attestation de réservation
       </Link>
     )}
     <Link href={`/messages/${id}`} className="mt-4 block rounded-full border border-[var(--color-teal)] px-5 py-3 text-center font-semibold text-[var(--color-teal)]">
       Envoyer un message à l&apos;hôte
     </Link>
   </>
      )}
    </AppShell>
  );
}
