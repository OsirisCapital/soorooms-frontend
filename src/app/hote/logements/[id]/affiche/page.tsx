"use client";

import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { getMyProperty } from "@/lib/api";
import { useAsyncData } from "@/lib/use-async-data";

const SITE = "https://www.soorooms.com";

/** Affiche imprimable avec le QR code du logement (gares, aéroports, réception d'hôtel). */
export default function PosterPage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, loading, error } = useAsyncData(`poster-${id}`, () => getMyProperty(id));
  const [qr, setQr] = useState<string | null>(null);
  const link = `${SITE}/q/${id}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(link, { width: 720, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1e4a4a", light: "#ffffff" } })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [link]);

  return (
    <AppShell backHref={`/hote/logements/${id}`}>
      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error || !property ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Logement introuvable."}</p>
      ) : (
        <>
          {property.status !== "ACTIVE" && (
            <p className="no-print mb-4 rounded-2xl bg-white p-4 text-sm text-[var(--color-terracotta-dark)] shadow-sm">
              Ce logement n&apos;est pas encore publié : le QR code ne fonctionnera qu&apos;après la publication.
            </p>
          )}
          <article className="rounded-3xl bg-white p-8 text-center shadow-sm print:shadow-none">
            <p className="font-display text-2xl font-bold text-[var(--color-teal)]">SòôRooms</p>
            <h1 className="mt-4 text-2xl font-bold text-[var(--color-ink)]">{property.title}</h1>
            <p className="mt-1 text-slate-600">
              {property.city} · {property.quarter}
            </p>
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt={`QR code de réservation : ${property.title}`} className="mx-auto mt-6 h-72 w-72" />
            ) : (
              <div className="mx-auto mt-6 h-72 w-72 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
            )}
            <p className="mt-4 text-lg font-semibold text-[var(--color-teal)]">Scannez pour réserver</p>
            <p className="mt-1 text-sm text-slate-600">Chambres disponibles ce soir · paiement Mobile Money sécurisé</p>
            <p className="mt-4 break-all text-xs text-slate-400">{link}</p>
          </article>
          <div className="no-print mt-4 flex flex-col gap-3">
            <Button onClick={() => window.print()}>Imprimer l&apos;affiche</Button>
            {qr && (
              <a
                href={qr}
                download={`qr-${id}.png`}
                className="rounded-full border border-[var(--color-teal)] px-5 py-3 text-center font-semibold text-[var(--color-teal)]"
              >
                Télécharger le QR code (PNG)
              </a>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
