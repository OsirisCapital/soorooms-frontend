import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { TERMS } from "@/lib/legal/terms";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — SòôRooms",
  description: "Les règles d'utilisation de SòôRooms pour les voyageurs et les hôtes, le paiement en séquestre et les litiges.",
};

export default function TermsPage() {
  return <LegalLayout document={TERMS} other={{ href: "/confidentialite", label: "Politique de confidentialité" }} />;
}
