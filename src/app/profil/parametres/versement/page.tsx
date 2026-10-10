"use client";

import { AppShell } from "@/components/AppShell";
import { PayoutDetailsForm } from "@/components/PayoutDetailsForm";

export default function PayoutSettingsPage() {
  return (
    <AppShell title="Mes versements" backHref="/profil/parametres">
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Où recevoir votre argent</h2>
        <p className="mt-2 text-sm text-slate-600">
          Quand le voyageur et vous avez confirmé le séjour, notre équipe vous verse 90 % du montant sur ce compte Mobile Money.
        </p>
        <div className="mt-5">
          <PayoutDetailsForm />
        </div>
      </section>
    </AppShell>
  );
}
