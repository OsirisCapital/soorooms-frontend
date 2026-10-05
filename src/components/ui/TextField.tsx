import type { InputHTMLAttributes, ReactNode } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
  /** Élément en fin de champ (ex: bouton afficher/masquer le mot de passe). */
  trailing?: ReactNode;
  error?: string;
};

export function TextField({ icon, trailing, error, className = "", ...props }: TextFieldProps) {
  return (
    <div className="w-full">
      <div
        className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 transition-colors focus-within:border-[var(--color-teal)] ${
          error ? "border-red-400" : "border-[var(--color-border)]"
        } ${className}`}
      >
        {icon && <span className="text-[var(--color-teal)]">{icon}</span>}
        <input
          className="w-full bg-transparent text-[var(--color-ink)] placeholder:text-slate-400 focus:outline-none"
          {...props}
        />
        {trailing}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
