"use client";

import { useSyncExternalStore } from "react";
import { getTokenPhone } from "./auth-storage";

const noSubscription = () => () => {};

/** Téléphone du compte connecté (lu dans le token), null côté serveur. */
export function useTokenPhone() {
  return useSyncExternalStore(noSubscription, getTokenPhone, () => null);
}
