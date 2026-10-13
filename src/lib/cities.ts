/**
 * Coordonnées approximatives des villes : le backend exige une latitude et une longitude pour chaque
 * logement, qu'un hôte ne connaît pas par cœur. Elles pré-remplissent le formulaire (modifiables, ou
 * remplaçables par la position de l'appareil). Les villes viennent de la liste des pays (countries.ts).
 */
import { COUNTRIES } from "./countries";

export const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = Object.fromEntries(
  COUNTRIES.flatMap((country) => country.cities.map((city) => [city.name, { latitude: city.latitude, longitude: city.longitude }] as const)),
);

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

export function coordsForCity(city: string) {
  const key = Object.keys(CITY_COORDS).find((name) => normalize(name) === normalize(city));
  return key ? CITY_COORDS[key] : null;
}
