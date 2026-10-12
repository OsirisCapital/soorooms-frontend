"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildE164,
  DEFAULT_PHONE_COUNTRY,
  flagUrl,
  PHONE_COUNTRIES,
  type PhoneCountry,
} from "@/lib/phone-countries";

type Props = {
  /** Reçoit le numéro complet « +237677123456 » (chaîne vide tant que rien n'est saisi) et le pays. */
  onChange: (phone: string, country: PhoneCountry) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
};

function Flag({ code }: { code: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={flagUrl(code)} alt="" width={22} height={16} className="h-4 w-[22px] rounded-[2px] object-cover" />
  );
}

/**
 * Champ téléphone précédé d'une liste de pays (drapeau + indicatif seulement).
 * Le nom du pays reste disponible en infobulle et pour les lecteurs d'écran.
 */
export function PhoneField({ onChange, placeholder = "Numéro de téléphone", required, autoFocus }: Props) {
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [national, setNational] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function pick(next: PhoneCountry) {
    setCountry(next);
    setOpen(false);
    onChange(buildE164(next, national), next);
  }

  function typeNumber(value: string) {
    setNational(value);
    onChange(buildE164(country, value), country);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-3.5 transition-colors focus-within:border-[var(--color-teal)]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Pays : ${country.name}, indicatif +${country.dial}`}
          title={country.name}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-0.5 hover:bg-[var(--color-cream-soft)]"
        >
          <Flag code={country.code} />
          <span className="text-sm font-medium text-[var(--color-ink)]">+{country.dial}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <span className="h-5 w-px bg-[var(--color-border)]" />
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={placeholder}
          value={national}
          onChange={(e) => typeNumber(e.target.value)}
          required={required}
          autoFocus={autoFocus}
          className="w-full min-w-0 bg-transparent text-[var(--color-ink)] placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-20 mt-1 max-h-64 w-44 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white py-1 shadow-lg"
        >
          {PHONE_COUNTRIES.map((c) => (
            <li key={c.code} role="option" aria-selected={c.code === country.code}>
              <button
                type="button"
                onClick={() => pick(c)}
                title={c.name}
                aria-label={`${c.name} +${c.dial}`}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-[var(--color-cream-soft)] ${
                  c.code === country.code ? "bg-[var(--color-cream-soft)]" : ""
                }`}
              >
                <Flag code={c.code} />
                <span className="text-sm text-[var(--color-ink)]">+{c.dial}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
