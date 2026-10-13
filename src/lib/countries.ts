/**
 * Pays où l'on peut publier et chercher un logement, avec leurs villes principales. Les coordonnées
 * sont approximatives : elles pré-remplissent le formulaire d'un logement (l'hôte peut les corriger ou
 * utiliser la position de son appareil). La liste officielle côté serveur (countries.ts du backend) fait
 * foi : un pays absent de là-bas est refusé à l'enregistrement.
 */
export type CityInfo = { name: string; latitude: number; longitude: number };
export type CountryInfo = { code: string; name: string; cities: CityInfo[] };

export const COUNTRIES: CountryInfo[] = [
  {
    code: "CM",
    name: "Cameroun",
    cities: [
      { name: "Douala", latitude: 4.0511, longitude: 9.7679 },
      { name: "Yaoundé", latitude: 3.848, longitude: 11.5021 },
      { name: "Kribi", latitude: 2.94, longitude: 9.91 },
      { name: "Bafoussam", latitude: 5.4737, longitude: 10.4179 },
      { name: "Limbé", latitude: 4.0239, longitude: 9.2059 },
      { name: "Buéa", latitude: 4.1559, longitude: 9.2417 },
      { name: "Bamenda", latitude: 5.9597, longitude: 10.146 },
      { name: "Garoua", latitude: 9.3014, longitude: 13.3977 },
    ],
  },
  {
    code: "GA",
    name: "Gabon",
    cities: [
      { name: "Libreville", latitude: 0.4162, longitude: 9.4673 },
      { name: "Port-Gentil", latitude: -0.7193, longitude: 8.7815 },
      { name: "Franceville", latitude: -1.6333, longitude: 13.5833 },
      { name: "Oyem", latitude: 1.5995, longitude: 11.5793 },
    ],
  },
  {
    code: "CG",
    name: "Congo",
    cities: [
      { name: "Brazzaville", latitude: -4.2634, longitude: 15.2429 },
      { name: "Pointe-Noire", latitude: -4.7692, longitude: 11.8664 },
      { name: "Dolisie", latitude: -4.1983, longitude: 12.6666 },
    ],
  },
  {
    code: "TD",
    name: "Tchad",
    cities: [
      { name: "N'Djamena", latitude: 12.1348, longitude: 15.0557 },
      { name: "Moundou", latitude: 8.5667, longitude: 16.0833 },
      { name: "Sarh", latitude: 9.1429, longitude: 18.3923 },
    ],
  },
  {
    code: "CF",
    name: "Centrafrique",
    cities: [
      { name: "Bangui", latitude: 4.3947, longitude: 18.5582 },
      { name: "Bimbo", latitude: 4.2567, longitude: 18.5158 },
    ],
  },
  {
    code: "GQ",
    name: "Guinée équatoriale",
    cities: [
      { name: "Malabo", latitude: 3.755, longitude: 8.7817 },
      { name: "Bata", latitude: 1.8639, longitude: 9.7658 },
    ],
  },
];

export const DEFAULT_COUNTRY = "Cameroun";

export const citiesOf = (country: string) => COUNTRIES.find((c) => c.name === country)?.cities ?? [];
