import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

/** Écran provisoire des onglets pas encore construits (garde la navigation fonctionnelle). */
export function ComingSoon({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 pb-24 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-teal)]">{title}</h1>
        <p className="max-w-xs text-slate-500">Cet écran arrive bientôt.</p>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
