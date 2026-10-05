import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  loading?: boolean;
};

export function Button({ variant = "primary", loading, children, className = "", disabled, ...props }: ButtonProps) {
  const base = "w-full rounded-2xl px-5 py-3.5 font-semibold transition-opacity disabled:opacity-60";
  const variants = {
    primary: "bg-[var(--color-terracotta)] text-white hover:bg-[var(--color-terracotta-dark)]",
    outline: "border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-cream-soft)]",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? "Un instant…" : children}
    </button>
  );
}
