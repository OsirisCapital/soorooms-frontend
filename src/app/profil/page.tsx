"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AvatarEditor } from "@/components/AvatarEditor";
import { Icon, type IconName } from "@/components/Icon";
import { clearTokens } from "@/lib/auth-storage";
import { logoutUser } from "@/lib/api";
import { firstNameOf, useMe } from "@/lib/use-me";


const MENU: { href: string; label: string; icon: IconName }[] = [
  { href: "/profil/informations", label: "Mes informations personnelles", icon: "user" },
  { href: "/profil/reservations", label: "Mes réservations", icon: "calendar" },
  { href: "/profil/paiements", label: "Mes paiements", icon: "card" },
  { href: "/profil/avis", label: "Mes avis", icon: "star" },
  { href: "/profil/parametres", label: "Paramètres", icon: "settings" },
  { href: "/profil/aide", label: "Aide et support", icon: "help" },
];

export default function ProfilPage() {
  const router = useRouter();
  const me = useMe();
  const firstName = firstNameOf(me);

  async function handleLogout() {
    await logoutUser(); // révoque la session côté serveur avant d'effacer les tokens
    clearTokens();
    router.replace("/login");
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center">
           <AvatarEditor name={me?.fullName ?? ""} url={me?.avatarUrl ?? null} />
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-teal)]">{firstName ? `Bonjour, ${firstName} !` : "Bonjour !"}</h1>
      </div>

      <p className="mt-8 text-slate-500">Mon compte</p>
      <ul className="mt-2">
        {(me?.role === "ADMIN" ? [{ href: "/admin", label: "Administration", icon: "shield" as const }, ...MENU] : MENU).map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="flex items-center gap-4 py-3.5 text-[var(--color-teal)]">
              <Icon name={item.icon} />
              <span className="flex-1 text-lg">{item.label}</span>
              <Icon name="chevronRight" size={18} className="text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-2 border-t border-[var(--color-border)] pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-4 py-3.5 text-[var(--color-terracotta)]"
        >
          <Icon name="power" />
          <span className="text-lg">Déconnexion</span>
        </button>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 text-[var(--color-teal)]">
          <Icon name="shield" size={26} className="text-[var(--color-teal-600)]" />
          <h2 className="text-lg font-semibold">Voyagez en confiance</h2>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Le prix est négocié et validé par les deux parties, et votre paiement reste en séquestre jusqu&apos;à la
          confirmation de votre séjour.
        </p>
      </section>
    </AppShell>
  );
}
