"use client";

import { useEffect, useState } from "react";
import { searchRooms, type RoomSearchResult, type SearchRoomsParams } from "./api";

type SearchState = { key: string; rooms: RoomSearchResult[]; failed: boolean };

/**
 * Charge /search/rooms pour des paramètres donnés. L'état « chargement »
 * est dérivé (résultat pas encore reçu pour les paramètres courants), ce
 * qui évite de remettre un état à zéro dans l'effet à chaque changement
 * de filtre et ignore les réponses devenues obsolètes.
 */
export function useRoomSearch(params: SearchRoomsParams) {
  const key = JSON.stringify(params);
  const [state, setState] = useState<SearchState | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchRooms(JSON.parse(key) as SearchRoomsParams)
      .then((response) => {
        if (!cancelled) setState({ key, rooms: response.results, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ key, rooms: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const ready = state?.key === key;
  return {
    loading: !ready,
    rooms: ready ? state.rooms : [],
    failed: ready ? state.failed : false,
  };
}
