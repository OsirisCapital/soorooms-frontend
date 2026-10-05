/**
 * Coordonnées approximatives de villes camerounaises : le backend exige une
 * latitude et une longitude pour chaque logement, qu'un hôte ne connaît pas
 * par cœur. Elles pré-remplissent le formulaire (modifiables, ou remplaçables
 * par la position de l'appareil).
 */
export const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  Douala: { latitude: 4.0511, longitude: 9.7679 },
  Yaoundé: { latitude: 3.848, longitude: 11.5021 },
  Kribi: { latitude: 2.94, longitude: 9.91 },
  Bafoussam: { latitude: 5.4737, longitude: 10.4179 },
  Limbé: { latitude: 4.0239, longitude: 9.2059 },
  Buéa: { latitude: 4.1559, longitude: 9.2417 },
  Bamenda: { latitude: 5.9597, longitude: 10.146 },
  Garoua: { latitude: 9.3014, longitude: 13.3977 },
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export function coordsForCity(city: string) {
  const key = Object.keys(CITY_COORDS).find((name) => normalize(name) === normalize(city));
  return key ? CITY_COORDS[key] : null;
}
