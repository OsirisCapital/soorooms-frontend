"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { getAdminAccess, STAFF_ROLE_LABEL, type AdminAccess, type Permission } from "@/lib/admin-api";
import { useAsyncData } from "@/lib/use-async-data";
import { useMe } from "@/lib/use-me";

const SECTIONS: Array<{ href: string; label: string; permission: Permission }> = [
  { href: "/admin", label: "Tableau de bord", permission: "dashboard.view" },
  { href: "/admin/accreditations", label: "Accréditations", permission: "kyc.review" },
  { href: "/admin/litiges", label: "Litiges", permission: "disputes.view" },
  { href: "/admin/journal", label: "Journal", permission: "audit.view" },
];

const Notice = ({ children }: { children: ReactNode }) => (
  <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{children}</p>
);

function SectionNav({ access }: { access: AdminAccess }) {
  const pathname = usePathname();
  const visible = SECTIONS.filter((section) => access.permissions.includes(section.permission));
  return (
    <nav aria-label="Sections de l'administration" className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5">
      {visible.map((section) => {
        const active = pathname === section.href;
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              active
                ? "bg-[var(--color-terracotta)] text-white"
                : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Cadre commun des pages d'administration : réservé aux ADMIN, n'affiche que les sections auxquelles
 * la personne a accès, et refuse la page si l'accès précis (`permission`) lui manque. Le serveur
 * refait les mêmes vérifications : ici, on ne fait qu'éviter d'afficher ce qui serait refusé.
 */
export function AdminFrame({ permission, children }: { permission: Permission; children: (access: AdminAccess) => ReactNode }) {
  const me = useMe();
  const isAdmin = me?.role === "ADMIN";
  const { data: access, loading, error } = useAsyncData<AdminAccess | null>(isAdmin ? "admin-access" : "admin-access-skip", () =>
    isAdmin ? getAdminAccess() : Promise.resolve(null),
  );

  return (
    <AppShell title="Administration" backHref="/profil">
      {me == null || (isAdmin && loading) ? (
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : !isAdmin ? (
        <Notice>Cette page est réservée à l&apos;équipe d&apos;administration.</Notice>
      ) : error || !access ? (
        <p className="text-sm text-red-500">{error ?? "Impossible de charger vos accès. Réessayez."}</p>
      ) : (
        <>
          {access.staffRole && <p className="-mt-3 mb-4 text-sm text-slate-500">{STAFF_ROLE_LABEL[access.staffRole]}</p>}
          <SectionNav access={access} />
          {access.permissions.includes(permission) ? (
            children(access)
          ) : (
            <Notice>Vous n&apos;avez pas accès à cette section. Demandez-le à un super administrateur.</Notice>
          )}
        </>
      )}
    </AppShell>
  );
}
