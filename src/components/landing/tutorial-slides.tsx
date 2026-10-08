import type { ReactNode } from "react";

/** Couleurs de la marque SòôRooms, reprises du logo. */
const C = { terracotta: "#C1622E", teal: "#1E4A4A", sand: "#F2A65A", cream: "#FAF6F0", mist: "#E3EFED" };

export type TutorialSlide = {
  id: string;
  label: string;
  title: string;
  text: string;
  /** Fond du diapo : trois ambiances de la charte. */
  tone: "teal" | "terracotta" | "deep";
  illustration: ReactNode;
  /**
   * Photo facultative (adresse Cloudinary publique) : si elle est renseignée, elle remplace
   * le fond coloré. Prévu pour des images de logements atypiques avec le texte par-dessus.
   */
  image?: string;
};

const svgProps = { viewBox: "0 0 160 160", width: 150, height: 150, "aria-hidden": true } as const;

const HouseIllustration = (
  <svg {...svgProps}>
    <circle cx="80" cy="80" r="76" fill={C.mist} />
    <path d="M80 28 L132 70 H118 V122 H42 V70 H28 Z" fill={C.terracotta} />
    <rect x="58" y="78" width="44" height="44" rx="4" fill={C.teal} />
    <path d="M80 78 L98 92 V122 H62 V92 Z" fill={C.sand} />
  </svg>
);

const SearchIllustration = (
  <svg {...svgProps}>
    <circle cx="80" cy="80" r="76" fill={C.mist} />
    <circle cx="72" cy="70" r="30" fill="none" stroke={C.teal} strokeWidth="10" />
    <path d="M94 92 L124 122" stroke={C.teal} strokeWidth="12" strokeLinecap="round" />
    <path d="M72 50 a14 14 0 0 1 14 14 c0 11 -14 26 -14 26 s-14 -15 -14 -26 a14 14 0 0 1 14 -14z" fill={C.terracotta} />
    <circle cx="72" cy="64" r="5" fill={C.cream} />
  </svg>
);

const ShieldIllustration = (
  <svg {...svgProps}>
    <circle cx="80" cy="80" r="76" fill={C.mist} />
    <path d="M80 26 L128 44 V80 C128 108 108 126 80 138 C52 126 32 108 32 80 V44 Z" fill={C.teal} />
    <path d="M58 82 L74 98 L104 64" fill="none" stroke={C.sand} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VerifiedIllustration = (
  <svg {...svgProps}>
    <circle cx="80" cy="80" r="76" fill={C.mist} />
    <rect x="34" y="44" width="92" height="72" rx="10" fill={C.terracotta} />
    <circle cx="62" cy="76" r="12" fill={C.cream} />
    <path d="M42 108 c2 -14 12 -20 20 -20 s18 6 20 20z" fill={C.cream} />
    <rect x="92" y="66" width="24" height="6" rx="3" fill={C.cream} />
    <rect x="92" y="80" width="18" height="6" rx="3" fill={C.cream} />
    <circle cx="116" cy="108" r="20" fill={C.sand} />
    <path d="M106 108 L113 115 L127 100" fill="none" stroke={C.teal} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: "bienvenue",
    label: "Bienvenue",
    title: "Hébergez. Voyagez. Vivez.",
    text: "Hôtels, meublés, chambres d'hôtes et résidences étudiantes partout au Cameroun, réservés en quelques touches.",
    tone: "deep",
    illustration: HouseIllustration,
  },
  {
    id: "chercher",
    label: "Étape 1 sur 4",
    title: "Cherchez votre logement",
    text: "Choisissez une ville et vos dates, comparez photos, prix et avis, puis gardez vos coups de cœur dans vos favoris.",
    tone: "terracotta",
    illustration: SearchIllustration,
  },
  {
    id: "payer",
    label: "Étape 2 sur 4",
    title: "Payez en toute sécurité",
    text: "MTN MoMo, Orange Money ou carte. Votre argent reste en séquestre jusqu'à votre arrivée : l'hôte n'est payé qu'une fois le séjour confirmé.",
    tone: "teal",
    illustration: ShieldIllustration,
  },
  {
    id: "verifies",
    label: "Étape 3 sur 4",
    title: "Des hôtes vérifiés",
    text: "Chaque hôte fait contrôler son identité avant de publier. Un problème ? Ouvrez un litige, nous examinons et protégeons votre paiement.",
    tone: "deep",
    illustration: VerifiedIllustration,
  },
  {
    id: "heberger",
    label: "Étape 4 sur 4",
    title: "Devenez hôte",
    text: "Publiez votre logement en quelques minutes, ajoutez vos photos, recevez vos réservations et vos paiements.",
    tone: "terracotta",
    illustration: HouseIllustration,
  },
];
