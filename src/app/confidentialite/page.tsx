import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { PRIVACY } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Politique de confidentialité — SòôRooms",
  description: "Les données que SòôRooms collecte, pourquoi, avec qui elles sont partagées, combien de temps elles sont gardées et vos droits.",
};

export default function PrivacyPage() {
  return <LegalLayout document={PRIVACY} other={{ href: "/conditions", label: "Conditions d'utilisation" }} />;
}
