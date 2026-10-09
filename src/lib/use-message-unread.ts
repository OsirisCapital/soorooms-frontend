"use client";

import { useSyncExternalStore } from "react";
import { getAccessToken } from "./auth-storage";
import { getUnreadConversations } from "./messages-api";

/**
 * Nombre de conversations avec des messages non lus, partagé par toute l'application (même principe que
 * les notifications). Relu toutes les 30 secondes tant qu'un écran l'affiche et que l'onglet est visible.
 */
let count = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

export function setMessageUnread(next: number) {
  if (next === count) return;
  count = next;
  listeners.forEach((listener) => listener());
}

export async function refreshMessageUnread() {
  if (!getAccessToken()) return setMessageUnread(0);
  try {
    setMessageUnread((await getUnreadConversations()).count);
  } catch {
    /* on garde la valeur précédente */
  }
}

const onVisible = () => {
  if (document.visibilityState === "visible") void refreshMessageUnread();
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshMessageUnread();
    timer = setInterval(onVisible, 30_000);
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

export const useMessageUnread = () =>
  useSyncExternalStore(
    subscribe,
    () => count,
    () => 0,
  );
