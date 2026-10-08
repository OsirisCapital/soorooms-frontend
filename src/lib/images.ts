/**
 * Photos de logements servies par Cloudinary dans la bonne taille.
 *
 * L'adresse enregistrée en base désigne le fichier d'origine (souvent 2 à 5 Mo,
 * pris au téléphone). Cloudinary peut en fabriquer à la demande une version
 * adaptée : on insère simplement des instructions dans l'adresse.
 *   f_auto    → le format le plus léger que le navigateur comprend (AVIF, WebP…)
 *   q_auto    → la qualité la plus basse qui reste invisible à l'œil
 *   c_limit   → réduit si l'image est plus grande que demandé, ne l'agrandit jamais
 *   w_<n>     → largeur maximale en pixels
 *
 * Seules les photos PUBLIQUES de notre dossier soorooms/ sont modifiées. Toute
 * autre adresse (ancien lien, autre hébergeur, document privé) est rendue telle
 * quelle : en cas de doute on garde l'image d'origine plutôt que de la casser.
 */

// « …/image/upload/ » suivi directement du numéro de version (v123/) ou du dossier,
// donc sans instructions déjà présentes.
const PLAIN_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)((?:v\d+\/)?soorooms\/)/;

/** Adresse de la photo en largeur maximale `width` (en pixels CSS × densité d'écran déjà comprise). */
export function optimizedImageUrl(url: string, width: number): string {
  const match = PLAIN_UPLOAD.exec(url);
  if (!match || !Number.isInteger(width) || width < 16 || width > 4000) return url;
  return `${match[1]}f_auto,q_auto,c_limit,w_${width}/${url.slice(match[1].length)}`;
}

/**
 * Valeur `srcSet` : le navigateur choisit lui-même la version qui convient à
 * l'écran (un téléphone ordinaire n'a pas besoin de la même que la 4K).
 * Renvoie undefined si l'adresse n'est pas une photo Cloudinary modifiable.
 */
export function imageSrcSet(url: string, widths: number[]): string | undefined {
  if (!PLAIN_UPLOAD.test(url)) return undefined;
  return widths.map((width) => `${optimizedImageUrl(url, width)} ${width}w`).join(", ");
}
