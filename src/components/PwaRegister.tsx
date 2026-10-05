"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Échec silencieux : l'application fonctionne sans, seule
        // l'installation sur l'écran d'accueil est affectée.
      });
    }
  }, []);

  return null;
}
