"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmailBanner } from "@/components/EmailBanner";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { setMode, useAccount, type AccountMode } from "@/lib/account";
import { NotificationBell } from "@/components/NotificationBell";
import { MessagesLink } from "@/components/MessagesLink";

const ROUND_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-teal-600)] text-white hover:bg-[var(--color-teal)]";

/**
 * Bande fixe en haut des écrans : logo, messages et notifications. La
 * petite flèche à côté du logo n'apparaît qu'une fois le compte hôte
 * activé (KYC envoyé) et permet de basculer voyageur ↔ hôte.
 */
export function AppHeader() {
  const router = useRouter();
  const { hostEnabled, mode } = useAccount();
  const [open, setOpen] = useState(false);

  function choose(next: AccountMode) {
    setMode(next);
    setOpen(false);
    router.push(next === "HOST" ? "/hote" : "/home");
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-xl items-center justify-between px-5">
          <div className="flex items-center gap-1">
            <Link href={mode === "HOST" ? "/hote" : "/home"} aria-label="Accueil SòôRooms">
              <Logo size={38} withWordmark={false} />
            </Link>
            {hostEnabled && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Changer de mode"
                aria-expanded={open}
                className="rounded-full p-1.5 text-[var(--color-teal)] hover:bg-[var(--color-cream-soft)]"
              >
                <Icon name="chevronDown" size={20} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <MessagesLink className={ROUND_BUTTON} />
            <NotificationBell className={ROUND_BUTTON} />
          </div>

          {open && (
            <div
              role="menu"
              className="absolute left-5 top-14 w-52 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-lg"
            >
              {(["TRAVELER", "HOST"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="menuitemradio"
                  aria-checked={mode === option}
                  onClick={() => choose(option)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-cream-soft)]"
                >
                  {option === "TRAVELER" ? "Mode voyageur" : "Mode hôte"}
                  {mode === option && <Icon name="check" size={18} className="text-[var(--color-terracotta)]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <EmailBanner />
    </>
  );
}
