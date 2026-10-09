"use client";

import { useSyncExternalStore } from "react";
import { getAccessToken } from "./auth-storage";
import { getUnreadCount } from "./notifications-api";

/**
 * Nombre de notifications non lues, partagé par toute l'application (la cloche et la page lisent la
 * même valeur). Relu toutes les minutes tant qu'un écran l'affiche et que l'onglet est visible, et
 * à chaque retour sur l'onglet. Une erreur réseau garde simplement la dernière valeur connue.
 */
let count = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

export function setUnreadCount(next: number) {
  if (next === count) return;
  count = next;
  listeners.forEach((listener) => listener());
}

export async function refreshUnread() {
  if (!getAccessToken()) return setUnreadCount(0);
  try {
    setUnreadCount((await getUnreadCount()).count);
  } catch {
    /* on garde la valeur précédente */
  }
}

const onVisible = () => {
  if (document.visibilityState === "visible") void refreshUnread();
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshUnread();
    timer = setInterval(onVisible, 60_000);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

export const useUnreadCount = () =>
  useSyncExternalStore(
    subscribe,
    () => count,
    () => 0,
  );
