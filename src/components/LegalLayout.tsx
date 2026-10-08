import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { LegalDocument } from "@/lib/legal/types";

/**
 * Page de texte légal accessible sans compte : en-tête avec logo, sommaire cliquable,
 * sections numérotées. Composant serveur — aucune interactivité nécessaire.
 */
export function LegalLayout({ document, other }: { document: LegalDocument; other: { href: string; label: string } }) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-cream)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/" aria-label="Retour à l'accueil de SòôRooms">
            <Logo size={32} withWordmark={false} />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-[var(--color-teal)]">
            Retour à l&apos;application
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-8">
        <h1 className="text-3xl font-bold text-[var(--color-teal)]">{document.title}</h1>
        <p className="mt-1 text-sm text-slate-500">Dernière mise à jour : {document.updatedAt}</p>

        <div className="mt-6 space-y-3 text-slate-700">
          {document.intro.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>

        <nav aria-label="Sommaire" className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-[var(--color-teal)]">Sommaire</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {document.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-[var(--color-teal-600)] underline-offset-2 hover:underline">
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="text-xl font-bold text-[var(--color-terracotta)]">{section.title}</h2>
              <div className="mt-3 space-y-3 text-slate-700">
                {section.paragraphs?.map((text) => <p key={text}>{text}</p>)}
                {section.items && (
                  <ul className="list-disc space-y-2 pl-5 marker:text-[var(--color-terracotta)]">
                    {section.items.map((text) => <li key={text}>{text}</li>)}
                  </ul>
                )}
                {section.after?.map((text) => <p key={text}>{text}</p>)}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-[var(--color-border)] pt-6 text-sm text-slate-500">
          Voir aussi : <Link href={other.href} className="font-semibold text-[var(--color-teal)]">{other.label}</Link>
        </p>
      </main>
    </>
  );
}
