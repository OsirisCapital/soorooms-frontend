"use client";

/** Étoiles en lecture seule (note moyenne ou avis). */
export function Stars({ value, size = "text-base" }: { value: number; size?: string }) {
  const full = Math.round(value);
  return (
    <span role="img" aria-label={`${value} sur 5`} className={`${size} leading-none tracking-tight text-[var(--color-terracotta)]`}>
      {"★".repeat(full)}
      <span className="text-slate-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}

/** Sélecteur de note de 1 à 5, utilisable au doigt (grandes cibles) et au clavier. */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Votre note" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} sur 5`}
          onClick={() => onChange(n)}
          className={`h-11 w-11 rounded-xl text-3xl leading-none ${n <= value ? "text-[var(--color-terracotta)]" : "text-slate-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
