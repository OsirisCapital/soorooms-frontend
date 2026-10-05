"use client";

import { useSyncExternalStore } from "react";
import { useMe } from "./use-me";

/**
 * Mode de compte. Le droit de basculer vient du serveur : le compte est HOST
 * et a envoyé son KYC (GET /auth/me). Seul le mode actuellement affiché
 * (voyageur ou hôte) est retenu localement, sur l'appareil.
 */
export type AccountMode = "TRAVELER" | "HOST";
export type AccountState = { hostEnabled: boolean; mode: AccountMode };

const KEY = "sooroms.account";
const EVENT = "sooroms:account";

let cachedRaw: string | null | undefined;
let cachedMode: AccountMode = "TRAVELER";

function readMode(): AccountMode {
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedMode;
  cachedRaw = raw;
  try {
    cachedMode = raw && (JSON.parse(raw) as { mode?: AccountMode }).mode === "HOST" ? "HOST" : "TRAVELER";
  } catch {
    cachedMode = "TRAVELER";
  }
  return cachedMode;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function setMode(mode: AccountMode) {
  localStorage.setItem(KEY, JSON.stringify({ mode }));
  window.dispatchEvent(new Event(EVENT));
}

export function useAccount(): AccountState {
  const me = useMe();
  const localMode = useSyncExternalStore(subscribe, readMode, () => "TRAVELER" as AccountMode);

  // Un compte est « hôte » dès qu'il a un profil hôte, quel que soit son rôle
  // (un ADMIN peut aussi être hôte), et qu'il a envoyé son KYC.
  const hostEnabled = me != null && (me.role === "HOST" || me.hostProfile != null) && me.kycStatus !== "NOT_SUBMITTED";
  // Tant que le profil charge, on fait confiance au mode mémorisé ; ensuite un
  // compte qui n'est pas (ou plus) hôte est ramené en mode voyageur.
  const mode = me != null && !hostEnabled ? "TRAVELER" : localMode;
  return { hostEnabled, mode };
}
