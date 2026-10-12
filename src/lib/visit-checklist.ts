import type { ChecklistItem } from "./visits-api";

/** Même grille que le serveur (visit.utils.ts) : sert à relire un rapport sans rappeler l'API. */
export const CHECKLIST_FALLBACK: ChecklistItem[] = [
  { key: "locationMatches", label: "L'adresse et la localisation correspondent à l'annonce" },
  { key: "photosMatch", label: "Les photos de l'annonce correspondent à la réalité" },
  { key: "hostOnSite", label: "Le gérant est présent et identifié sur place" },
  { key: "cleanliness", label: "Le logement est propre et en bon état" },
  { key: "utilities", label: "Eau et électricité fonctionnent" },
  { key: "security", label: "Les accès sont sécurisés (porte, serrure)" },
  { key: "amenitiesMatch", label: "Les équipements annoncés sont présents" },
];
