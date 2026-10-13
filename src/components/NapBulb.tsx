"use client";

/** Petite ampoule : allumée (jaune, rayonnante) ou éteinte (grise). Cliquable si `onToggle` est fourni. */
export function NapBulb({ on, onToggle, size = 28, label }: { on: boolean; onToggle?: () => void; size?: number; label?: string }) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {on && (
        <g stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 1.5v1.8M4.2 4.7l1.3 1.3M19.8 4.7 18.5 6M1.8 11.5h1.8M20.4 11.5h1.8" />
        </g>
      )}
      <path
        d="M9 18h6M10 21h4M12 4.5a5.5 5.5 0 0 0-3.4 9.8c.6.5.9 1.1.9 1.7V16h5v-.0c0-.6.3-1.2.9-1.7A5.5 5.5 0 0 0 12 4.5Z"
        fill={on ? "#fde68a" : "none"}
        stroke={on ? "#d97706" : "#94a3b8"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const text = label ?? (on ? "Ampoule allumée" : "Ampoule éteinte");
  if (!onToggle) {
    return (
      <span role="img" aria-label={text} title={text} className="inline-flex">
        {svg}
      </span>
    );
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={text}
      title={text}
      onClick={onToggle}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
        on ? "border-amber-400 bg-amber-50" : "border-[var(--color-border)] bg-white"
      }`}
    >
      {svg}
    </button>
  );
}
