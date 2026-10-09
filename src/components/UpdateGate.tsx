"use client";

import { useEffect, useState } from "react";
import { applyUpdate, APP_VERSION, compareVersions, fetchVersionInfo, type VersionInfo } from "@/lib/app-version";

const DISMISS_KEY = "sooroms.updateDismissed";
const CHECK_EVERY_MS = 10 * 60_000;

function dismissedVersion(): string | null {
  try {
    return sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

/**
 * Surveille les versions de l'application.
 *  - Version plus ancienne que la plus basse acceptée : écran plein, impossible de continuer sans mettre à jour.
 *  - Version plus ancienne que la dernière : simple bandeau, qu'on peut écarter pour la session.
 * Sans réponse du serveur (hors ligne, serveur qui se réveille), on ne bloque jamais.
 */
export function UpdateGate() {
  const [info, setInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(dismissedVersion);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = () =>
      fetchVersionInfo().then((next) => {
        if (!cancelled && next) setInfo(next);
      });
    void check();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, CHECK_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!info) return null;

  const blocked = compareVersions(APP_VERSION, info.minSupported) < 0;
  const outdated = compareVersions(APP_VERSION, info.latest) < 0;

  async function update() {
    setUpdating(true);
    await applyUpdate();
  }

  if (blocked) {
    return (
      <div role="alertdialog" aria-modal="true" aria-labelledby="update-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-cream)] p-6">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-lg">
          <h1 id="update-title" className="text-xl font-bold text-[var(--color-teal)]">
            Mise à jour requise
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Une nouvelle version de SòôRooms est disponible. Pour continuer à l&apos;utiliser en toute sécurité, mettez l&apos;application à jour.
          </p>
          {info.notes && <p className="mt-3 rounded-2xl bg-[var(--color-cream-soft)] p-3 text-sm text-slate-700">{info.notes}</p>}
          <button
            type="button"
            onClick={update}
            disabled={updating}
            className="mt-5 w-full rounded-full bg-[var(--color-terracotta)] px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {updating ? "Mise à jour…" : "Mettre à jour"}
          </button>
          <p className="mt-3 text-xs text-slate-400">
            Version installée {APP_VERSION} · requise {info.minSupported}
          </p>
        </div>
      </div>
    );
  }

  if (outdated && dismissed !== info.latest) {
    return (
      <div role="status" className="fixed inset-x-3 top-3 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[var(--color-teal)] p-3 text-sm text-white shadow-lg">
        <p className="min-w-0 flex-1">
          <span className="font-semibold">Nouvelle version disponible.</span> {info.notes}
        </p>
        <button type="button" onClick={update} disabled={updating} className="shrink-0 rounded-full bg-white px-4 py-2 font-semibold text-[var(--color-teal)] disabled:opacity-60">
          {updating ? "…" : "Mettre à jour"}
        </button>
        <button
          type="button"
          aria-label="Plus tard"
          onClick={() => {
            try {
              sessionStorage.setItem(DISMISS_KEY, info.latest);
            } catch {
              /* sans stockage, le bandeau reviendra au prochain contrôle */
            }
            setDismissed(info.latest);
          }}
          className="shrink-0 px-1 text-lg leading-none text-white/80"
        >
          ×
        </button>
      </div>
    );
  }
  return null;
}
