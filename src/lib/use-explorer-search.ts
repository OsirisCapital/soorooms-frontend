"use client";

import { useEffect, useState } from "react";
import { searchRooms, type RoomSearchResult, type SearchRoomsParams } from "./api";

const PAGE_SIZE = 20;

type State = { key: string; rooms: RoomSearchResult[]; page: number; totalPages: number; failed: boolean };

/**
 * Recherche paginée pour Explorer : la première page se charge quand les
 * filtres changent, « Voir plus » ajoute les pages suivantes. Le chargement
 * est dérivé de la clé des filtres, ce qui ignore aussi les réponses obsolètes.
 */
export function useExplorerSearch(params: SearchRoomsParams) {
  const key = JSON.stringify(params);
  const [state, setState] = useState<State | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    searchRooms({ ...(JSON.parse(key) as SearchRoomsParams), page: 1, limit: PAGE_SIZE })
      .then((response) => {
        if (!cancelled) {
          setState({ key, rooms: response.results, page: 1, totalPages: response.totalPages, failed: false });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ key, rooms: [], page: 1, totalPages: 1, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const ready = state?.key === key;
  const hasMore = ready && state.page < state.totalPages;

  async function loadMore() {
    if (!ready || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await searchRooms({ ...params, page: state.page + 1, limit: PAGE_SIZE });
      setState((prev) =>
        prev && prev.key === key
          ? { ...prev, rooms: [...prev.rooms, ...response.results], page: prev.page + 1, totalPages: response.totalPages }
          : prev,
      );
    } catch {
      // On garde les résultats déjà affichés ; le bouton reste disponible pour réessayer.
    } finally {
      setLoadingMore(false);
    }
  }

  return {
    loading: !ready,
    failed: ready ? state.failed : false,
    rooms: ready ? state.rooms : [],
    hasMore,
    loadingMore,
    loadMore,
  };
}
