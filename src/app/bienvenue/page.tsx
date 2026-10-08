"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Slideshow } from "@/components/landing/Slideshow";
import { Logo } from "@/components/Logo";
import { getAccessToken } from "@/lib/auth-storage";
import { useRoomSearch } from "@/lib/use-room-search";

/**
 * Page d'accueil des visiteurs non connectés : diaporama plein écran (vrais logements en
 * alternance avec des conseils d'utilisation), logo et boutons Connexion / Inscription fixes.
 */
export default function WelcomePage() {
  const router = useRouter();
  const { rooms } = useRoomSearch({ limit: 12 });

  useEffect(() => {
    if (getAccessToken()) router.replace("/home");
  }, [router]);

  return (
    <div className="relative flex-1 bg-[#12302f]">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-xl">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-[var(--color-cream)] py-1.5 pl-2 pr-4 shadow-md">
            <Logo size={28} withWordmark={false} />
            <p className="font-display text-lg font-bold tracking-tight">
              <span className="text-[var(--color-terracotta)]">Sòô</span>
              <span className="text-[var(--color-teal)]">Rooms</span>
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl">
        <Slideshow rooms={rooms} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-3xl bg-[var(--color-cream)] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
          <Link
            href="/login"
            className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3.5 text-center font-semibold text-[var(--color-ink)] hover:bg-[var(--color-cream-soft)]"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="rounded-2xl bg-[var(--color-terracotta)] px-5 py-3.5 text-center font-semibold text-white hover:bg-[var(--color-terracotta-dark)]"
          >
            Inscription
          </Link>
        </div>
        <p className="mx-auto mt-3 max-w-xl text-center text-xs text-slate-500">
          En continuant, vous acceptez nos{" "}
          <Link href="/conditions" className="font-medium text-[var(--color-teal)] underline">
            conditions d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link href="/confidentialite" className="font-medium text-[var(--color-teal)] underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
