"use client";

import { useEffect, useRef, useState } from "react";

type State<T> = { key: string; data: T | null; error: string | null };

/**
 * Charge une ressource asynchrone. `key` identifie la requête : quand elle
 * change, le résultat précédent est ignoré et `loading` repasse à vrai
 * (dérivé, sans remise à zéro d'état dans l'effet).
 */
export function useAsyncData<T>(key: string, fetcher: () => Promise<T>) {
  const fetcherRef = useRef(fetcher);
  const [state, setState] = useState<State<T> | null>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ key, data: null, error: err instanceof Error ? err.message : "Une erreur est survenue." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const ready = state?.key === key;
  return {
    loading: !ready,
    data: ready ? state.data : null,
    error: ready ? state.error : null,
  };
}
