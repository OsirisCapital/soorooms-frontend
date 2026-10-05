"use client";

import { AppShell } from "@/components/AppShell";
import { useMe } from "@/lib/use-me";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

export default function InformationsPage() {
  const me = useMe();

  return (
    <AppShell title="Mes informations" backHref="/profil">
      <div className="flex flex-col gap-3">
        <Field label="Nom complet" value={me?.fullName ?? "…"} />
        <Field label="Téléphone" value={me ? (me.phone.startsWith("google:") ? "Non renseigné" : me.phone) : "…"} />
        {me?.email && <Field label="E-mail" value={me.email} />}
      </div>
      <p className="mt-6 text-sm text-slate-500">
        La modification de vos informations et de votre photo arrivera dans une prochaine version.
      </p>
    </AppShell>
  );
}
