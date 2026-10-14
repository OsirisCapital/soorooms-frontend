"use client";

import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { NapBulb } from "@/components/NapBulb";
import { Button } from "@/components/ui/Button";
import { getMyProperty } from "@/lib/api";
import { formatFcfa } from "@/lib/booking-labels";
import { canvasToBlob, CARD_SIZE, drawCard, loadImage, type CardFormat, type CardMode } from "@/lib/share-card";
import { useAsyncData } from "@/lib/use-async-data";

const SITE = "https://www.soorooms.com";

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, loading, error } = useAsyncData(`share-${id}`, () => getMyProperty(id));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<CardFormat>("story");
  const [chosenMode, setChosenMode] = useState<CardMode>("stay");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [qr, setQr] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const link = `${SITE}/q/${id}`;

  // Photos proposées : celles du logement, puis celles des chambres.
  const photos = useMemo(() => {
    if (!property) return [] as string[];
    const urls = [...(property.photos ?? []).map((p) => p.url), ...property.rooms.flatMap((r) => (r.photos ?? []).map((p) => p.url))];
    return [...new Set(urls)];
  }, [property]);

  const fromPrice = useMemo(() => {
    if (!property || property.rooms.length === 0) return null;
    return Math.min(...property.rooms.map((r) => Number(r.basePrice)));
  }, [property]);

  // Siestes : chambres qui en acceptent, avec un prix. La carte « sieste » n'existe que s'il y en a.
  const nap = useMemo(() => {
    const rooms = (property?.rooms ?? []).filter((r) => r.allowsNap && r.napPrice != null && Number(r.napPrice) > 0);
    if (rooms.length === 0) return null;
    const cheapest = rooms.reduce((a, b) => (Number(b.napPrice) < Number(a.napPrice) ? b : a));
    return { price: Number(cheapest.napPrice), hours: cheapest.napHours ?? null, bulb: rooms.some((r) => r.napBulb) };
  }, [property]);
  const mode: CardMode = nap ? chosenMode : "stay";

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(link, { width: 600, margin: 1, errorCorrectionLevel: "M", color: { dark: "#1e4a4a", light: "#ffffff" } })
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

  useEffect(() => {
    if (!property || !canvasRef.current || !qr) return;
    let cancelled = false;
    (async () => {
      let photo: HTMLImageElement | null = null;
      const url = photos[photoIndex];
      if (url) {
        try {
          photo = await loadImage(url);
        } catch {
          photo = null;
        }
      }
      if (cancelled || !canvasRef.current) return;
      setPhotoFailed(Boolean(url) && !photo);
      await drawCard(canvasRef.current, format, {
        title: property.title,
        city: property.city,
        quarter: property.quarter,
        fromPrice,
        mode,
        napFromPrice: nap?.price ?? null,
        napHours: nap?.hours ?? null,
        napBulb: nap?.bulb ?? false,
        verified: Boolean(property.isVerifiedByAgent),
        qrDataUrl: qr,
        photo,
        link,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [property, photos, photoIndex, format, qr, fromPrice, link, mode, nap]);

  const priceParts = [
    mode !== "nap" && fromPrice != null ? `dès ${formatFcfa(fromPrice)} / nuit` : null,
    mode !== "stay" && nap ? `sieste dès ${formatFcfa(nap.price)}${nap.hours ? ` (${nap.hours} h)` : ""}${nap.bulb ? " 💡" : ""}` : null,
  ].filter(Boolean);
  const caption = property
    ? `${property.title} — ${property.city}, ${property.quarter}${priceParts.length ? ` · ${priceParts.join(" · ")}` : ""}. Réservez en ligne avec paiement Mobile Money sécurisé : ${link}`
    : link;

  async function share() {
    setNotice(null);
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToBlob(canvasRef.current);
      const file = new File([blob], `soorooms-${id}-${mode}-${format}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        return;
      }
      setNotice("Le partage direct n'est pas disponible ici : téléchargez l'image puis envoyez-la.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setNotice("Export impossible. Si la photo vient d'un autre site, choisissez une autre photo.");
    }
  }

  async function download() {
    setNotice(null);
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToBlob(canvasRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `soorooms-${id}-${mode}-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setNotice("Export impossible. Si la photo vient d'un autre site, choisissez une autre photo.");
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setNotice("Texte copié.");
    } catch {
      setNotice("Copie impossible : sélectionnez le texte à la main.");
    }
  }

  return (
    <AppShell backHref={`/hote/logements/${id}`}>
      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error || !property ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Logement introuvable."}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-ink)]">Carte à partager</h1>
            <p className="mt-1 text-sm text-slate-600">Une image prête pour WhatsApp, Facebook ou Instagram, avec un QR code qui mène à la réservation.</p>
          </div>

          {property.status !== "ACTIVE" && (
            <p className="rounded-2xl bg-white p-4 text-sm text-[var(--color-terracotta-dark)] shadow-sm">
              Ce logement n&apos;est pas encore publié : le lien ne fonctionnera qu&apos;après la publication.
            </p>
          )}

          {nap && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Mettre en avant</p>
              <div className="flex gap-2">
                {([
                  ["stay", "Le séjour"],
                  ["nap", "La sieste"],
                  ["both", "Les deux"],
                ] as const).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChosenMode(m)}
                    aria-pressed={mode === m}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
                      mode === m ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode !== "stay" && (
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <NapBulb on={nap.bulb} size={16} /> {nap.bulb ? "L'ampoule allumée apparaît sur la carte." : "Ampoule éteinte : elle n'apparaît pas sur la carte."}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {(Object.keys(CARD_SIZE) as CardFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
                  format === f ? "bg-[var(--color-terracotta)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"
                }`}
              >
                {f === "story" ? "Story" : "Publication"}
              </button>
            ))}
          </div>

          <canvas ref={canvasRef} className="mx-auto w-full max-w-xs rounded-2xl bg-[var(--color-cream-soft)] shadow-sm" aria-label="Aperçu de la carte" />

          {photos.length > 1 && (
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
              {photos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setPhotoIndex(i)}
                  aria-label={`Utiliser la photo ${i + 1}`}
                  aria-pressed={photoIndex === i}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${photoIndex === i ? "border-[var(--color-terracotta)]" : "border-transparent"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {photos.length === 0 && <p className="text-sm text-slate-500">Ajoutez des photos au logement pour une carte plus attirante.</p>}
          {photoFailed && <p className="text-sm text-red-500">Cette photo n&apos;a pas pu être chargée : choisissez-en une autre.</p>}

          <div className="flex flex-col gap-2">
            <Button onClick={share}>Partager l&apos;image</Button>
            <Button variant="outline" onClick={download}>Télécharger (PNG)</Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(caption)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--color-teal)] px-5 py-3 text-center font-semibold text-[var(--color-teal)]"
            >
              Envoyer le texte sur WhatsApp
            </a>
          </div>

          {notice && <p role="status" className="text-sm text-[var(--color-teal)]">{notice}</p>}

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Texte à publier avec l&apos;image</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{caption}</p>
            <button type="button" onClick={copyCaption} className="mt-3 text-sm font-semibold text-[var(--color-teal)]">Copier le texte</button>
          </section>
        </div>
      )}
    </AppShell>
  );
}
