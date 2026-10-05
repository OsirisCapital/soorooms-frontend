"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PropertyForm } from "@/components/host/PropertyForm";
import { createProperty } from "@/lib/api";

export default function NewPropertyPage() {
  const router = useRouter();

  return (
    <AppShell title="Nouveau logement" backHref="/hote/logements">
      <p className="mb-5 text-sm text-slate-600">
        Créez la fiche, puis ajoutez ses chambres et ses équipements. Elle ne sera visible des voyageurs qu&apos;une fois
        publiée.
      </p>
      <PropertyForm
        submitLabel="Créer le logement"
        onSubmit={async (payload) => {
          const property = await createProperty(payload);
          router.push(`/hote/logements/${property.id}`);
        }}
      />
    </AppShell>
  );
}
