"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";

// STATIQUE — pas d'endpoint de notifications côté backend : exemples issus de la maquette.
const SAMPLE = [
  { id: "1", text: "Votre réservation à Kribi est confirmée ! 🌴", time: "12:30", unread: true },
  { id: "2", text: "Nouveau message de Jean Kouamé.", time: "11:50", unread: false },
  { id: "3", text: "Baisse de prix : Villa à Douala. 📉", time: "Hier", unread: false },
  { id: "4", text: "Laissez un avis pour votre séjour à Bafoussam.", time: "Hier", unread: false },
  { id: "5", text: "Votre compte est vérifié !", time: "2 jours", unread: false },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [readIds, setReadIds] = useState<string[]>([]);

  const items = SAMPLE.map((n) => ({ ...n, unread: n.unread && !readIds.includes(n.id) })).filter(
    (n) => filter === "all" || n.unread,
  );

  return (
    <AppShell title="Notifications">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setReadIds(SAMPLE.map((n) => n.id))}
          className="text-sm text-[var(--color-teal-600)]"
        >
          Tout marquer comme lu
        </button>
        <div className="flex rounded-full bg-[var(--color-cream-soft)] p-1 text-sm font-medium">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-full px-4 py-1.5 ${filter === value ? "bg-white text-[var(--color-teal)] shadow-sm" : "text-slate-500"}`}
            >
              {value === "all" ? "Toutes" : "Non lues"}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">Aucune notification non lue.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((n) => (
            <li key={n.id} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <Logo size={40} withWordmark={false} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold text-[var(--color-ink)]">
                    {n.unread && <span className="h-2 w-2 rounded-full bg-[var(--color-terracotta)]" aria-label="Non lue" />}
                    SòôRooms
                  </p>
                  <span className="text-xs text-slate-500">{n.time}</span>
                </div>
                <p className="mt-0.5 text-[var(--color-ink)]">{n.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
