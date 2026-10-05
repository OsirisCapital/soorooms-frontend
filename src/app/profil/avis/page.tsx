import { AppShell } from "@/components/AppShell";

// STATIQUE — le backend n'expose pas encore la liste des avis de l'utilisateur.
export default function AvisPage() {
  return (
    <AppShell title="Mes avis" backHref="/profil">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-slate-600">Vous n&apos;avez pas encore laissé d&apos;avis.</p>
        <p className="mt-2 text-sm text-slate-500">Après un séjour terminé, vous pourrez noter votre hébergement ici.</p>
      </div>
    </AppShell>
  );
}
