"use client";

import { useEffect, useSyncExternalStore } from "react";
import { addFavorite, getFavoriteIds, removeFavorite } from "./api";
import { getTokenUserId } from "./auth-storage";

/**
 * Identifiants des logements favoris, partagés par toutes les cartes de l'app
 * (un seul appel réseau). Le basculement est optimiste : l'étoile change tout
 * de suite et revient en arrière si le backend refuse. Comme pour le profil,
 * le cache est lié au compte du token.
 */
let ids: ReadonlySet<string> | null = null;
let idsFor: string | null = null;
let inflight: Promise<void> | null = null;
let inflightFor: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function loadFavoriteIds(force = false): Promise<void> {
  const userId = getTokenUserId();
  if (!userId) return Promise.resolve();
  if (!force && ids && idsFor === userId) return Promise.resolve();
  if (inflight && inflightFor === userId) return inflight;

  inflightFor = userId;
  inflight = getFavoriteIds()
    .then((list) => {
      ids = new Set(list);
      idsFor = userId;
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

function getSnapshot(): ReadonlySet<string> | null {
  return ids && idsFor === getTokenUserId() ? ids : null;
}

/** Ensemble des favoris du compte, ou null tant qu'il n'est pas chargé. */
export function useFavoriteIds(): ReadonlySet<string> | null {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => null);
  useEffect(() => {
    void loadFavoriteIds();
  }, []);
  return current;
}

function setMembership(propertyId: string, present: boolean) {
  const next = new Set(ids ?? []);
  if (present) next.add(propertyId);
  else next.delete(propertyId);
  ids = next;
  idsFor = getTokenUserId();
  emit();
}

/** Ajoute ou retire un favori ; lève une erreur (après retour arrière) si le backend refuse. */
export async function toggleFavorite(propertyId: string) {
  const had = getSnapshot()?.has(propertyId) ?? false;
  setMembership(propertyId, !had);
  try {
    await (had ? removeFavorite(propertyId) : addFavorite(propertyId));
  } catch (error) {
    setMembership(propertyId, had);
    throw error;
  }
}
