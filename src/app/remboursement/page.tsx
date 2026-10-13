import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { REFUNDS } from "@/lib/legal/refunds";

export const metadata: Metadata = {
  title: "Politique d'annulation et de remboursement — SòôRooms",
  description: "Dans quels cas une réservation peut être annulée et remboursée, les délais et les montants.",
};

export default function RefundsPage() {
  return (
    <LegalLayout
      document={REFUNDS}
      others={[
        { href: "/conditions", label: "Conditions d'utilisation" },
        { href: "/confidentialite", label: "Politique de confidentialité" },
      ]}
    />
  );
}
