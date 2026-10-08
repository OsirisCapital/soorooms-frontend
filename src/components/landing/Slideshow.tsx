"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { RoomSearchResult } from "@/lib/api";
import { imageSrcSet, optimizedImageUrl } from "@/lib/images";
import { dedupeByProperty } from "@/lib/rooms";
import { TUTORIAL_SLIDES, type TutorialSlide } from "./tutorial-slides";

const AUTOPLAY_MS = 6000;
const SWIPE_PX = 40;

const TONE_BACKGROUND: Record<TutorialSlide["tone"], string> = {
  teal: "linear-gradient(160deg, #2c6363 0%, #1e4a4a 100%)",
  terracotta: "linear-gradient(160deg, #c1622e 0%, #8a3f17 100%)",
  deep: "linear-gradient(160deg, #1e4a4a 0%, #12302f 100%)",
};

type PropertySlide = {
  kind: "property";
  id: string;
  city: string;
  quarter: string;
  title: string;
  price: number;
  photo: string;
};
type TutorialItem = { kind: "tutorial"; slide: TutorialSlide };
type Slide = PropertySlide | TutorialItem;

/** Petits messages d'invitation, en rotation d'un logement à l'autre. */
const INVITATIONS = [
  (city: string) => `Venez découvrir ${city} depuis ce logement.`,
  (city: string) => `Un séjour inoubliable vous attend à ${city}.`,
  (city: string) => `Réservez ce coin de ${city} avant qu'il ne soit pris.`,
  (city: string) => `Poussez la porte : ${city} vous attend.`,
];

/**
 * Ordre du diaporama : on commence par l'accueil (qui ne dépend d'aucun chargement), puis
 * un vrai logement, un diapo tutoriel, un logement, etc. Les logements arrivent après, depuis
 * le serveur : le diaporama est utilisable immédiatement et se complète tout seul.
 */
function buildSlides(rooms: RoomSearchResult[]): Slide[] {
  const properties: PropertySlide[] = dedupeByProperty(rooms)
    .filter((room) => room.property.photos && room.property.photos.length > 0)
    .slice(0, 5)
    .map((room) => ({
      kind: "property" as const,
      id: room.propertyId,
      city: room.property.city,
      quarter: room.property.quarter,
      title: room.property.title,
      price: Number(room.basePrice),
      photo: room.property.photos![0].url,
    }));

  const [welcome, ...tutorials] = TUTORIAL_SLIDES;
  const slides: Slide[] = [{ kind: "tutorial", slide: welcome }];
  const rounds = Math.max(properties.length, tutorials.length);
  for (let i = 0; i < rounds; i++) {
    if (properties[i]) slides.push(properties[i]);
    if (tutorials[i]) slides.push({ kind: "tutorial", slide: tutorials[i] });
  }
  return slides;
}

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
    </svg>
  );
}

function SlideView({ slide, active, position }: { slide: Slide; active: boolean; position: number }) {
  if (slide.kind === "property") {
    const invitation = INVITATIONS[position % INVITATIONS.length](slide.city);
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#12302f]">
        {/* eslint-disable-next-line @next/next/no-img-element -- photos Cloudinary, tailles fournies par optimizedImageUrl */}
        <img
          src={optimizedImageUrl(slide.photo, 960)}
          srcSet={imageSrcSet(slide.photo, [640, 960, 1280])}
          sizes="100vw"
          alt={`${slide.title}, ${slide.quarter}, ${slide.city}`}
          className={`absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-[8000ms] motion-safe:ease-out ${active ? "motion-safe:scale-110" : "motion-safe:scale-100"}`}
          loading={position === 1 ? "eager" : "lazy"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-60 text-white">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cream)] px-3 py-1.5 text-xs font-semibold text-[var(--color-teal)]">
            <PinIcon /> {slide.city} · {slide.quarter}
          </p>
          <h2 className="mt-3 line-clamp-2 font-display text-3xl font-bold leading-tight">{slide.title}</h2>
          <p className="mt-1 text-lg font-semibold text-[var(--color-sand,#f2a65a)]">
            dès {slide.price.toLocaleString("fr-FR")} FCFA / nuit
          </p>
          <p className="mt-3 max-w-sm text-base text-white/90">{invitation}</p>
        </div>
      </div>
    );
  }

  const { slide: s } = slide;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: TONE_BACKGROUND[s.tone] }}>
      {s.image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- image éditoriale facultative */}
          <img src={optimizedImageUrl(s.image, 960)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div aria-hidden="true" className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-white/10" />
      <div className="relative flex h-full flex-col items-center justify-center px-8 pb-52 pt-24 text-center text-white">
        <div className="drop-shadow-lg">{s.illustration}</div>
        <p className="mt-6 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{s.label}</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight">{s.title}</h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-white/90">{s.text}</p>
      </div>
    </div>
  );
}

export function Slideshow({ rooms }: { rooms: RoomSearchResult[] }) {
  const slides = useMemo(() => buildSlides(rooms), [rooms]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const startX = useRef<number | null>(null);

  const current = index % slides.length;
  const go = useCallback((target: number) => setIndex((target + slides.length) % slides.length), [slides.length]);

  // Défilement automatique : suspendu pendant un toucher, onglet masqué ou « réduire les animations ».
  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, slides.length, current]);

  function onPointerUp(event: React.PointerEvent) {
    const from = startX.current;
    startX.current = null;
    setPaused(false);
    if (from === null) return;
    const delta = event.clientX - from;
    if (Math.abs(delta) > SWIPE_PX) go(current + (delta < 0 ? 1 : -1));
  }

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Présentation de SòôRooms"
      tabIndex={0}
      className="relative h-[100dvh] w-full touch-pan-y select-none overflow-hidden outline-none"
      onPointerDown={(event) => {
        startX.current = event.clientX;
        setPaused(true);
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        startX.current = null;
        setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(current + 1);
        if (event.key === "ArrowLeft") go(current - 1);
      }}
    >
      {slides.map((slide, position) => (
        <div
          key={slide.kind === "property" ? `p-${slide.id}` : `t-${slide.slide.id}`}
          role="group"
          aria-roledescription="diapositive"
          aria-label={`${position + 1} sur ${slides.length}`}
          aria-hidden={position !== current}
          className={`absolute inset-0 motion-safe:transition-opacity motion-safe:duration-700 ${position === current ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <SlideView slide={slide} active={position === current} position={position} />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-44 z-10 flex items-center justify-center gap-2" aria-label="Choisir une diapositive">
        {slides.map((slide, position) => (
          <button
            key={slide.kind === "property" ? `d-${slide.id}` : `d-${slide.slide.id}`}
            type="button"
            onClick={() => go(position)}
            aria-label={`Aller à la diapositive ${position + 1}`}
            aria-current={position === current}
            className={`h-2 rounded-full transition-all ${position === current ? "w-6 bg-white" : "w-2 bg-white/50"}`}
          />
        ))}
      </div>
    </section>
  );
}
