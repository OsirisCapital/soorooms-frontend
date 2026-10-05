"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatDay(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Barre « Où allez-vous ? / Quand ? / Rechercher ». Les dates ne sont
 * envoyées au backend que par paire (arrivée + départ), comme l'exige
 * GET /search/rooms. L'écran de résultats (/explorer) n'existe pas encore :
 * la recherche y transmet simplement ses paramètres.
 */
export function SearchBar() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [showDates, setShowDates] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const hasDates = checkIn !== "" && checkOut !== "";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (city.trim()) query.set("city", city.trim());
    if (hasDates) {
      query.set("checkInDate", checkIn);
      query.set("checkOutDate", checkOut);
    }
    const queryString = query.toString();
    router.push(`/explorer${queryString ? `?${queryString}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="px-5">
      <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-md">
        <label className="flex min-w-0 flex-1 items-center gap-2 pl-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal-600)" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Où allez-vous ?"
            aria-label="Destination"
            className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-slate-500 focus:outline-none"
          />
        </label>

        <span className="h-8 w-px bg-[var(--color-border)]" />

        <button
          type="button"
          onClick={() => setShowDates((v) => !v)}
          aria-expanded={showDates}
          className="flex shrink-0 items-center gap-2 px-1 text-sm text-slate-500"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal-600)" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          {hasDates ? `${formatDay(checkIn)} → ${formatDay(checkOut)}` : "Quand ?"}
        </button>

        <button
          type="submit"
          className="shrink-0 rounded-xl bg-[var(--color-teal-600)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-teal)]"
        >
          Rechercher
        </button>
      </div>

      {showDates && (
        <div className="mt-2 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-md">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Arrivée
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) setCheckOut("");
              }}
              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Départ
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
            />
          </label>
        </div>
      )}
    </form>
  );
}
