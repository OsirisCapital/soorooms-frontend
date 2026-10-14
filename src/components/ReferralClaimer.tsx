"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { claimReferral } from "@/lib/partners-api";
import { clearReferral, pendingReferral } from "@/lib/referral-storage";

/**
 * Rattache le compte connecté au partenaire dont il a suivi le lien. Sans interface : à chaque changement
 * de page, si un code est mémorisé et qu'on est connecté, on l'envoie une fois. Une réponse définitive du
 * serveur (accepté ou refusé : code inconnu, compte trop ancien, déjà parrainé…) efface le code ; seule une
 * panne passagère le conserve pour un nouvel essai.
 */
export function ReferralClaimer() {
  const pathname = usePathname();
  const busy = useRef(false);

  useEffect(() => {
    const code = pendingReferral();
    if (!code || !getAccessToken() || busy.current) return;
    busy.current = true;
    claimReferral(code)
      .then(clearReferral)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 401 && error.status !== 429) clearReferral();
      })
      .finally(() => {
        busy.current = false;
      });
  }, [pathname]);

  return null;
}
