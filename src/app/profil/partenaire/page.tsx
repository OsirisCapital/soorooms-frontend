"use client";

import { AppShell } from "@/components/AppShell";
import { PartnerHome } from "@/components/partner/PartnerHome";

export default function PartnerPage() {
  return (
    <AppShell title="Programme partenaire" backHref="/profil">
      <PartnerHome />
    </AppShell>
  );
}
