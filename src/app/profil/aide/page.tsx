import { AppShell } from "@/components/AppShell";

const FAQ = [
  {
    q: "Comment le prix d'une réservation est-il fixé ?",
    a: "Le voyageur et l'hôte peuvent échanger des offres. Le prix retenu est celui que les deux parties ont validé.",
  },
  {
    q: "Mon paiement est-il sécurisé ?",
    a: "Oui. Le paiement est conservé en séquestre et n'est reversé à l'hôte qu'une fois le séjour confirmé par les deux parties.",
  },
  {
    q: "Que faire en cas de problème pendant mon séjour ?",
    a: "Vous pouvez ouvrir un litige sur la réservation : les fonds restent alors bloqués en attendant une résolution.",
  },
  {
    q: "Comment devenir hôte ?",
    a: "Dans Profil › Paramètres, activez votre compte hôte et complétez la vérification d'identité en 3 étapes.",
  },
];

export default function AidePage() {
  return (
    <AppShell title="Aide et support" backHref="/profil">
      <div className="flex flex-col gap-3">
        {FAQ.map((item) => (
          <details key={item.q} className="rounded-2xl bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none font-medium text-[var(--color-teal)]">{item.q}</summary>
            <p className="mt-3 text-sm text-slate-600">{item.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">Le contact direct avec le support arrivera bientôt.</p>
    </AppShell>
  );
}
