"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { useAccount } from "@/lib/account";

type Tab = { href: string; label: string; icon: IconName; exact?: boolean };

const TRAVELER_TABS: Tab[] = [
  { href: "/home", label: "Accueil", icon: "home" },
  { href: "/explorer", label: "Explorer", icon: "search" },
  { href: "/favoris", label: "Favoris", icon: "star" },
  { href: "/profil", label: "Profil", icon: "user" },
];

const HOST_TABS: Tab[] = [
  { href: "/hote", label: "Tableau de bord", icon: "dashboard", exact: true },
  { href: "/hote/logements", label: "Logements", icon: "building" },
  { href: "/hote/reservations", label: "Réservations", icon: "calendar" },
  { href: "/profil", label: "Profil", icon: "user" },
];

const FILLED_WHEN_ACTIVE: IconName[] = ["home", "star", "user", "building", "dashboard"];

/** Barre de navigation basse : 4 onglets voyageur, ou 4 onglets hôte en mode hôte. */
export function BottomNav() {
  const pathname = usePathname();
  const { mode } = useAccount();
  const tabs = pathname.startsWith("/hote") || mode === "HOST" ? HOST_TABS : TRAVELER_TABS;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-white/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-xl pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium ${
                  active ? "text-[var(--color-terracotta)]" : "text-slate-400"
                }`}
              >
                <Icon name={tab.icon} size={24} filled={active && FILLED_WHEN_ACTIVE.includes(tab.icon)} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
