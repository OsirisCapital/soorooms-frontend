"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { getAccessToken } from "@/lib/auth-storage";

type AppShellProps = {
  title?: string;
  /** Lien « retour » affiché au-dessus du titre (sous-pages). */
  backHref?: string;
  children: ReactNode;
};

/** Structure commune des écrans connectés : en-tête fixe, contenu, navigation basse. */
export function AppShell({ title, backHref, children }: AppShellProps) {
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
  }, [router]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-28 pt-6">
        {backHref && (
          <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-teal-600)]">
            <Icon name="back" size={18} />
            Retour
          </Link>
        )}
        {title && <h1 className="mb-6 text-3xl font-bold text-[var(--color-teal)]">{title}</h1>}
        {children}
      </main>
      <BottomNav />
    </>
  );
}
