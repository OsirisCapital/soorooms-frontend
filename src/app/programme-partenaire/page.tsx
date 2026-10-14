import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { PARTNER_RULES } from "@/lib/legal/partners";

export const metadata: Metadata = {
  title: "Règlement du programme partenaire — SòôRooms",
  description: "Qui peut devenir partenaire, commissions, durées, retrait des gains, conduite attendue et cas d'exclusion.",
};

export default function PartnerRulesPage() {
  return (
    <LegalLayout
      document={PARTNER_RULES}
      others={[
        { href: "/conditions", label: "Conditions d'utilisation" },
        { href: "/confidentialite", label: "Politique de confidentialité" },
      ]}
    />
  );
}
