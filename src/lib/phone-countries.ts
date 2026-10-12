export type PhoneCountry = { code: string; dial: string; name: string };

/** Cameroun en premier, puis l'Afrique, puis les principaux pays de la diaspora. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "CM", dial: "237", name: "Cameroun" },
  { code: "BJ", dial: "229", name: "Bénin" },
  { code: "BF", dial: "226", name: "Burkina Faso" },
  { code: "BI", dial: "257", name: "Burundi" },
  { code: "CV", dial: "238", name: "Cap-Vert" },
  { code: "CF", dial: "236", name: "Centrafrique" },
  { code: "TD", dial: "235", name: "Tchad" },
  { code: "KM", dial: "269", name: "Comores" },
  { code: "CG", dial: "242", name: "Congo" },
  { code: "CD", dial: "243", name: "RD Congo" },
  { code: "CI", dial: "225", name: "Côte d'Ivoire" },
  { code: "DJ", dial: "253", name: "Djibouti" },
  { code: "EG", dial: "20", name: "Égypte" },
  { code: "GQ", dial: "240", name: "Guinée équatoriale" },
  { code: "GA", dial: "241", name: "Gabon" },
  { code: "GM", dial: "220", name: "Gambie" },
  { code: "GH", dial: "233", name: "Ghana" },
  { code: "GN", dial: "224", name: "Guinée" },
  { code: "KE", dial: "254", name: "Kenya" },
  { code: "MA", dial: "212", name: "Maroc" },
  { code: "ML", dial: "223", name: "Mali" },
  { code: "MR", dial: "222", name: "Mauritanie" },
  { code: "MU", dial: "230", name: "Maurice" },
  { code: "NE", dial: "227", name: "Niger" },
  { code: "NG", dial: "234", name: "Nigeria" },
  { code: "RW", dial: "250", name: "Rwanda" },
  { code: "SN", dial: "221", name: "Sénégal" },
  { code: "SL", dial: "232", name: "Sierra Leone" },
  { code: "ZA", dial: "27", name: "Afrique du Sud" },
  { code: "TG", dial: "228", name: "Togo" },
  { code: "TN", dial: "216", name: "Tunisie" },
  { code: "DZ", dial: "213", name: "Algérie" },
  { code: "UG", dial: "256", name: "Ouganda" },
  { code: "TZ", dial: "255", name: "Tanzanie" },
  { code: "ET", dial: "251", name: "Éthiopie" },
  { code: "AO", dial: "244", name: "Angola" },
  { code: "MG", dial: "261", name: "Madagascar" },
  { code: "FR", dial: "33", name: "France" },
  { code: "BE", dial: "32", name: "Belgique" },
  { code: "CH", dial: "41", name: "Suisse" },
  { code: "DE", dial: "49", name: "Allemagne" },
  { code: "IT", dial: "39", name: "Italie" },
  { code: "ES", dial: "34", name: "Espagne" },
  { code: "PT", dial: "351", name: "Portugal" },
  { code: "GB", dial: "44", name: "Royaume-Uni" },
  { code: "NL", dial: "31", name: "Pays-Bas" },
  { code: "CA", dial: "1", name: "Canada" },
  { code: "US", dial: "1", name: "États-Unis" },
  { code: "CN", dial: "86", name: "Chine" },
  { code: "AE", dial: "971", name: "Émirats arabes unis" },
  { code: "TR", dial: "90", name: "Turquie" },
  { code: "IN", dial: "91", name: "Inde" },
  { code: "BR", dial: "55", name: "Brésil" },
  { code: "LB", dial: "961", name: "Liban" },
  { code: "SA", dial: "966", name: "Arabie saoudite" },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

/** « +CCC » + numéro national sans zéro de tête ni séparateurs ; vide si rien n'est saisi. */
export function buildE164(country: PhoneCountry, national: string): string {
  const digits = national.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `+${country.dial}${digits}` : "";
}

export function flagUrl(code: string): string {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}
