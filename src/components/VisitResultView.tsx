import type { ChecklistItem, VisitResult } from "@/lib/visits-api";

/** Rapport d'une visite terminée : verdict, grille, photos et commentaire de l'agent. */
export function VisitResultView({ result, checklist }: { result: VisitResult; checklist: ChecklistItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className={`text-sm font-semibold ${result.conforming ? "text-[var(--color-teal)]" : "text-[var(--color-terracotta-dark)]"}`}>
        {result.conforming ? "Logement conforme ✓" : "Des points sont à corriger"}
      </p>
      {result.checklist && (
        <ul className="flex flex-col gap-1.5 text-sm">
          {checklist.map((item) => (
            <li key={item.key} className="flex items-start gap-2">
              <span aria-hidden className={result.checklist?.[item.key] ? "text-[var(--color-teal)]" : "text-red-500"}>
                {result.checklist?.[item.key] ? "✓" : "✕"}
              </span>
              <span className="text-slate-700">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
      {result.report && <p className="whitespace-pre-line rounded-xl bg-[var(--color-cream-soft)] p-3 text-sm text-slate-700">{result.report}</p>}
      {result.photoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {result.photoUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Photo prise lors de la visite" className="aspect-square w-full rounded-xl object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
