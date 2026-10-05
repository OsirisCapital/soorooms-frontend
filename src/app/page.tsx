"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getAccessToken } from "@/lib/auth-storage";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const destination = getAccessToken() ? "/home" : "/login";
    const timer = setTimeout(() => router.replace(destination), 900);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-cream px-6 text-center">
      <Logo size={96} />
      <p className="font-display text-sm font-semibold tracking-wide text-[var(--color-teal-600)]">
        Hébergez. Voyagez. Vivez.
      </p>
      <div className="mt-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-terracotta)] border-t-transparent" />
      <p className="text-sm text-slate-500">Chargement…</p>
    </main>
  );
}
