"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getMe, type Me } from "./api";
import { getTokenUserId } from "./auth-storage";

/**
 * Cache partagé du profil (GET /auth/me) : un seul appel pour toute l'app,
 * relancé à la demande (`loadMe(true)`, par exemple après l'envoi du KYC).
 * Le cache est lié à l'identifiant du compte du token : en cas de changement
 * de compte dans le même onglet, l'ancien profil n'est jamais servi.
 */
let cached: Me | null = null;
let cachedFor: string | null = null;
let inflight: Promise<void> | null = null;
let inflightFor: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function loadMe(force = false): Promise<void> {
  const userId = getTokenUserId();
  if (!userId) return Promise.resolve();
  if (!force && cached && cachedFor === userId) return Promise.resolve();
  if (inflight && inflightFor === userId) return inflight;

  inflightFor = userId;
  inflight = getMe()
    .then((me) => {
      cached = me;
      cachedFor = userId;
      emit();
    })
    .catch(() => {})
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Me | null {
  return cached && cachedFor === getTokenUserId() ? cached : null;
}

/** Profil du compte connecté, ou null tant qu'il n'est pas chargé. */
export function useMe(): Me | null {
  const me = useSyncExternalStore(subscribe, getSnapshot, () => null);
  useEffect(() => {
    void loadMe();
  }, []);
  return me;
}

export const firstNameOf = (me: Me | null) => me?.fullName.trim().split(/\s+/)[0] ?? "";
